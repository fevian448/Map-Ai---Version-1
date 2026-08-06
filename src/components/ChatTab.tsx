import React, { useState } from 'react';
import { ChatMessage, GeoPoint, Place, SettingsState } from '../types';
import { Bot, Send, User, Sparkles, Navigation, MapPin, Compass, ArrowRight, Cpu, Users, Store, MessageSquare, ShieldAlert, Bike, Plus, CheckCircle2 } from 'lucide-react';
import { sendChatMessage, searchGeocoding } from '../services/api';
import { t } from '../lib/i18n';

interface ChatTabProps {
  settings: SettingsState;
  userLocation: GeoPoint;
  places: Place[];
  onSelectDestination: (point: GeoPoint | null, name: string) => void;
  onStartNavigation: () => void;
}

interface ChatDestinationAction {
  name: string;
  point: GeoPoint;
}

interface GroupChannelMessage {
  id: string;
  senderName: string;
  senderRole: 'Pemandu' | 'Peniaga / Merchant' | 'Rider Express' | 'Mekanik / Towing' | 'Admin';
  avatarEmoji: string;
  text: string;
  timestampMs: number;
  promoLocation?: { name: string; point: GeoPoint };
}

export const ChatTab: React.FC<ChatTabProps> = ({
  settings,
  userLocation,
  places,
  onSelectDestination,
  onStartNavigation
}) => {
  const [activeTabMode, setActiveTabMode] = useState<'AI_COPILOT' | 'GROUP_CHANNELS'>('GROUP_CHANNELS');
  const [selectedChannel, setSelectedChannel] = useState<'TRAFFIC' | 'BUSINESS_PROMO' | 'RIDERS' | 'EMERGENCY'>('BUSINESS_PROMO');

  // AI Copilot state
  const [messages, setMessages] = useState<(ChatMessage & { destination?: ChatDestinationAction })[]>([
    {
      id: 'm_1',
      role: 'assistant',
      content: 'Salam! Saya Pembantu MapAi AI Copilot. Tanya saya jalan ke mana-mana kedai, lokasi atau tap cadangan cepat di bawah! 🚗💨'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Community Group Chat State
  const [channelMessages, setChannelMessages] = useState<Record<string, GroupChannelMessage[]>>({
    TRAFFIC: [
      {
        id: 'cm_t1',
        senderName: 'Faiz_Pemandu',
        senderRole: 'Pemandu',
        avatarEmoji: '🚗',
        text: '🚦 Jalan Utama Jalan Ampang agak perlahan menghala ke KLCC, ada 48 active phone tracker detected. Gunakan jalan susur alternatif.',
        timestampMs: Date.now() - 3 * 60000
      },
      {
        id: 'cm_t2',
        senderName: 'Abang_Maxim_04',
        senderRole: 'Rider Express',
        avatarEmoji: '🛵',
        text: '✅ Lebuhraya PLUS Utara lancar tiada halangan. Selamat memandu semua!',
        timestampMs: Date.now() - 12 * 60000
      }
    ],
    BUSINESS_PROMO: [
      {
        id: 'cm_b1',
        senderName: 'Restoran Nasi Kandar Royale',
        senderRole: 'Peniaga / Merchant',
        avatarEmoji: '🍛',
        text: '🔥 PROMO PERNIAGAAN: Nasi Kandar Ayam Merah + Teh O Ais hanya RM9.00 untuk pemandu MapAi, Foodpanda, Grab & Maxim! Diskaun 15%.',
        timestampMs: Date.now() - 5 * 60000,
        promoLocation: {
          name: 'Restoran Nasi Kandar Royale',
          point: { latitude: userLocation.latitude + 0.003, longitude: userLocation.longitude + 0.002 }
        }
      },
      {
        id: 'cm_b2',
        senderName: 'Bengkel & Tayar Auto24',
        senderRole: 'Mekanik / Towing',
        avatarEmoji: '🔧',
        text: '⚡ Servis Tayar Pancit & Bateri Kereta Tepi Jalan 24 Jam. Hubungi / Navigasi terus ke bengkel kami untuk rim & servis percuma!',
        timestampMs: Date.now() - 25 * 60000,
        promoLocation: {
          name: 'Bengkel Tayar Auto24 Express',
          point: { latitude: userLocation.latitude - 0.002, longitude: userLocation.longitude + 0.004 }
        }
      },
      {
        id: 'cm_b3',
        senderName: 'Café Kopi Tenang',
        senderRole: 'Peniaga / Merchant',
        avatarEmoji: '☕',
        text: '☕ Kopi Espresso & Croissant diskaun 20% khas untuk pelanggan & rider penghantaran hari ini!',
        timestampMs: Date.now() - 40 * 60000,
        promoLocation: {
          name: 'Café Kopi Tenang',
          point: { latitude: userLocation.latitude + 0.004, longitude: userLocation.longitude - 0.003 }
        }
      }
    ],
    RIDERS: [
      {
        id: 'cm_r1',
        senderName: 'Siti_Panda_Rider',
        senderRole: 'Rider Express',
        avatarEmoji: '🐼',
        text: '🛵 Hub pandamart Mall dah buka lane priority untuk rider Foodpanda & Grab. Pickup barang dalam 3 minit!',
        timestampMs: Date.now() - 8 * 60000
      },
      {
        id: 'cm_r2',
        senderName: 'Gamer_Driver_99',
        senderRole: 'Pemandu',
        avatarEmoji: '🚕',
        text: '🚖 Maxim Taxi station di stesen bas utama bersedia mengambil penumpang malam ini.',
        timestampMs: Date.now() - 18 * 60000
      }
    ],
    EMERGENCY: [
      {
        id: 'cm_e1',
        senderName: 'Unit Bantuan SOS MapAi',
        senderRole: 'Admin',
        avatarEmoji: '🆘',
        text: '🚨 Saluran Bantuan Kecemasan: Jika kereta anda rosak, tayar pancit, atau kemalangan, sila hantar lokasi terus di sini.',
        timestampMs: Date.now() - 60 * 60000
      }
    ]
  });

  const [groupInput, setGroupInput] = useState('');
  const [isMerchantPost, setIsMerchantPost] = useState(false);
  const [merchantShopName, setMerchantShopName] = useState('');

  const handleSendGroupMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupInput.trim()) return;

    const newMsg: GroupChannelMessage = {
      id: `cm_${Date.now()}`,
      senderName: isMerchantPost && merchantShopName.trim() ? merchantShopName.trim() : 'Anda (User MapAi)',
      senderRole: isMerchantPost ? 'Peniaga / Merchant' : 'Pemandu',
      avatarEmoji: isMerchantPost ? '🏪' : '🚗',
      text: groupInput.trim(),
      timestampMs: Date.now(),
      promoLocation: isMerchantPost
        ? {
            name: merchantShopName.trim() || 'Perniagaan Baru',
            point: { latitude: userLocation.latitude, longitude: userLocation.longitude }
          }
        : undefined
    };

    setChannelMessages((prev) => ({
      ...prev,
      [selectedChannel]: [newMsg, ...(prev[selectedChannel] || [])]
    }));

    setGroupInput('');
    if (isMerchantPost) setMerchantShopName('');
  };

  const quickDestinations = [
    { name: 'Maxim Taxi & Cargo Hub', emoji: '🚖', offset: { lat: 0.0025, lon: 0.0015 } },
    { name: 'pandamart Foodpanda Hub', emoji: '🐼', offset: { lat: -0.003, lon: 0.004 } },
    { name: 'GrabKitchen Express', emoji: '💚', offset: { lat: 0.004, lon: -0.003 } },
    { name: 'Shell Express Fuel Station', emoji: '⛽', offset: { lat: -0.002, lon: -0.005 } },
    { name: 'McDonald\'s 24/7 Drive-Thru', emoji: '🍔', offset: { lat: 0.005, lon: 0.005 } },
    { name: 'Central General Hospital', emoji: '🏥', offset: { lat: -0.006, lon: -0.002 } }
  ];

  const triggerGoToDestination = (name: string, point: GeoPoint) => {
    onSelectDestination(point, name);
    onStartNavigation();
  };

  const handleSendAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const replyText = await sendChatMessage(
      userText,
      settings.aiProvider || 'gemini_flash',
      settings.aiApiKey,
      settings.aiCustomEndpoint
    );

    let detectedDest: ChatDestinationAction | undefined = undefined;
    const lowerText = userText.toLowerCase();

    const matchedPlace = places.find((p) => lowerText.includes(p.name.toLowerCase()));
    if (matchedPlace) {
      detectedDest = { name: matchedPlace.name, point: matchedPlace.point };
    } else if (
      lowerText.includes('go to') || lowerText.includes('navigate') || lowerText.includes('take me') ||
      lowerText.includes('bawa') || lowerText.includes('ke')
    ) {
      const cleanName = userText.replace(/take me to|navigate to|drive to|bawa saya ke|ke arah/gi, '').trim() || 'Requested Destination';
      const geoResults = await searchGeocoding(cleanName, userLocation);
      if (geoResults && geoResults.length > 0) {
        detectedDest = { name: geoResults[0].name, point: geoResults[0].point };
      } else {
        detectedDest = {
          name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          point: {
            latitude: userLocation.latitude + (Math.random() * 0.01 - 0.005),
            longitude: userLocation.longitude + (Math.random() * 0.01 - 0.005)
          }
        };
      }
    }

    const botMsg = { id: `b_${Date.now()}`, role: 'assistant' as const, content: replyText, destination: detectedDest };
    setMessages((prev) => [...prev, botMsg]);
    setLoading(false);

    if (detectedDest && (lowerText.includes('take me') || lowerText.includes('bawa') || lowerText.includes('pergi'))) {
      setTimeout(() => triggerGoToDestination(detectedDest!.name, detectedDest!.point), 1200);
    }
  };

  return (
    <div id="chat-tab-screen" className="flex-1 bg-slate-950 text-slate-100 flex flex-col h-full overflow-hidden pb-20">
      {/* Header Selector: Switch Between Group Chat Komuniti & AI Navigation Copilot */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center font-bold shadow-lg">
              {activeTabMode === 'GROUP_CHANNELS' ? <Users className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{activeTabMode === 'GROUP_CHANNELS' ? 'Grup Chat Komuniti & Perniagaan' : 'MapAi AI Copilot'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h2>
              <p className="text-[11px] text-slate-400">
                {activeTabMode === 'GROUP_CHANNELS' ? 'Saluran live pemandu, rider & promosi kedai tempatan' : 'Pembantu AI pintar navigasi & penunjuk arah'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTabMode('GROUP_CHANNELS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabMode === 'GROUP_CHANNELS'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Grup Live</span>
            </button>
            <button
              onClick={() => setActiveTabMode('AI_COPILOT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabMode === 'AI_COPILOT'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Copilot</span>
            </button>
          </div>
        </div>

        {/* Group Chat Sub-Channels */}
        {activeTabMode === 'GROUP_CHANNELS' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => setSelectedChannel('BUSINESS_PROMO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                selectedChannel === 'BUSINESS_PROMO'
                  ? 'bg-amber-500 border-amber-400 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-amber-950" />
              <span>🏪 Promosi Perniagaan Local</span>
            </button>
            <button
              onClick={() => setSelectedChannel('TRAFFIC')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                selectedChannel === 'TRAFFIC'
                  ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>🚗 Pemandu & Trafik Live</span>
            </button>
            <button
              onClick={() => setSelectedChannel('RIDERS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                selectedChannel === 'RIDERS'
                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>🛵 Rider Express & Hubs</span>
            </button>
            <button
              onClick={() => setSelectedChannel('EMERGENCY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                selectedChannel === 'EMERGENCY'
                  ? 'bg-red-600 border-red-400 text-white font-black shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>🆘 Bantuan Kecemasan SOS</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: COMMUNITY GROUP CHATTING & MERCHANT PROMOS */}
      {activeTabMode === 'GROUP_CHANNELS' ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {(channelMessages[selectedChannel] || []).map((msg) => (
              <div key={msg.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 shadow-md hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl bg-slate-800 p-1 rounded-xl border border-slate-700">{msg.avatarEmoji}</span>
                    <div>
                      <div className="font-extrabold text-sm text-white flex items-center gap-1.5">
                        <span>{msg.senderName}</span>
                        {msg.senderRole === 'Peniaga / Merchant' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                            VERIFIED MERCHANT
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {msg.senderRole} • {new Date(msg.timestampMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {msg.text}
                </p>

                {/* Direct Promo Navigation Button */}
                {msg.promoLocation && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-amber-300 truncate">
                      📍 Lokasi Kedai: {msg.promoLocation.name}
                    </div>
                    <button
                      onClick={() => triggerGoToDestination(msg.promoLocation!.name, msg.promoLocation!.point)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shrink-0 shadow transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Navigasi Kedai</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Group Chat & Merchant Post Input Bar */}
          <form onSubmit={handleSendGroupMessage} className="p-3 bg-slate-900 border-t border-slate-800 space-y-2 shrink-0">
            {/* Merchant Toggle for Business Owners */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMerchantPost}
                  onChange={(e) => setIsMerchantPost(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span>Hantar Sebagai Promosi Perniagaan / Kedai Local 🏪</span>
              </label>
              {isMerchantPost && (
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Auto-attach GPS Kedai</span>
              )}
            </div>

            {isMerchantPost && (
              <input
                type="text"
                value={merchantShopName}
                onChange={(e) => setMerchantShopName(e.target.value)}
                placeholder="Nama Kedai / Perniagaan Anda (contoh: Nasi Ayam Gemarak)..."
                className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-amber-200 placeholder-amber-500/50 focus:outline-none"
              />
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={groupInput}
                onChange={(e) => setGroupInput(e.target.value)}
                placeholder={
                  isMerchantPost
                    ? "Tulis promosi kedai / diskaun untuk pemandu & rider di sini..."
                    : "Kongsi info trafik, promosi, atau soalan dalam grup..."
                }
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={!groupInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-md shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Hantar</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* VIEW MODE 2: AI NAVIGATION COPILOT */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Quick Destination Chips */}
          <div className="bg-slate-900/60 border-b border-slate-800 p-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 pl-1">
              <Navigation className="w-3 h-3 text-cyan-400" />
              <span>Quick Go:</span>
            </span>
            {quickDestinations.map((qd, idx) => {
              const pt = {
                latitude: userLocation.latitude + qd.offset.lat,
                longitude: userLocation.longitude + qd.offset.lon
              };
              return (
                <button
                  key={idx}
                  onClick={() => triggerGoToDestination(qd.name, pt)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/40 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
                >
                  <span>{qd.emoji}</span>
                  <span>{qd.name}</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                </button>
              );
            })}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id} className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                  <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${isUser ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 border border-slate-700 text-cyan-400'}`}>
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${isUser ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-medium rounded-tr-none shadow-lg' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'}`}>
                      {m.content}
                    </div>
                  </div>

                  {m.destination && (
                    <div className="mt-2 ml-10 p-3 bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 rounded-2xl shadow-xl space-y-2 max-w-xs">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                        <MapPin className="w-4 h-4 animate-bounce" />
                        <span>Destination Detected: {m.destination.name}</span>
                      </div>
                      <button
                        onClick={() => triggerGoToDestination(m.destination!.name, m.destination!.point)}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>GO & START NAVIGATION NOW 🚀</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-cyan-400 bg-slate-900 border border-slate-800 p-3 rounded-2xl w-max animate-pulse">
                <Bot className="w-4 h-4" />
                <span>MapAi copilot calculating route & directions...</span>
              </div>
            )}
          </div>

          {/* AI Input Bar */}
          <form onSubmit={handleSendAi} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for directions (e.g., 'bawa saya ke Shell' or 'ke Airport')..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 flex items-center justify-center font-bold transition-all shadow-md shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};


