import React, { useState } from 'react';
import { ChatMessage, GeoPoint, Place, SettingsState } from '../types';
import { Bot, Send, User, Sparkles, Navigation, MapPin, Compass, ArrowRight } from 'lucide-react';
import { sendChatMessage } from '../services/api';
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

export const ChatTab: React.FC<ChatTabProps> = ({
  settings,
  userLocation,
  places,
  onSelectDestination,
  onStartNavigation
}) => {
  const [messages, setMessages] = useState<
    (ChatMessage & { destination?: ChatDestinationAction })[]
  >([
    {
      id: 'm_1',
      role: 'assistant',
      content:
        'Hello! I am your MapAi AI Copilot. Ask me directions to any place or tap a suggestion below to start navigation immediately! 🚗💨'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick preset destinations around user location
  const quickDestinations = [
    {
      name: 'Maxim Taxi & Cargo Hub',
      emoji: '🚖',
      offset: { lat: 0.0025, lon: 0.0015 }
    },
    {
      name: 'pandamart Foodpanda Hub',
      emoji: '🐼',
      offset: { lat: -0.003, lon: 0.004 }
    },
    {
      name: 'GrabKitchen Express',
      emoji: '💚',
      offset: { lat: 0.004, lon: -0.003 }
    },
    {
      name: 'Shell Express Fuel Station',
      emoji: '⛽',
      offset: { lat: -0.002, lon: -0.005 }
    },
    {
      name: 'McDonald\'s 24/7 Drive-Thru',
      emoji: '🍔',
      offset: { lat: 0.005, lon: 0.005 }
    },
    {
      name: 'Central General Hospital',
      emoji: '🏥',
      offset: { lat: -0.006, lon: -0.002 }
    }
  ];

  const triggerGoToDestination = (name: string, point: GeoPoint) => {
    onSelectDestination(point, name);
    onStartNavigation();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const replyText = await sendChatMessage(userText);

    // Detect destination intent or keyword in query/reply
    let detectedDest: ChatDestinationAction | undefined = undefined;
    const lowerText = userText.toLowerCase();

    // Check matching places from existing places list or create offset
    const matchedPlace = places.find((p) => lowerText.includes(p.name.toLowerCase()));
    if (matchedPlace) {
      detectedDest = { name: matchedPlace.name, point: matchedPlace.point };
    } else if (
      lowerText.includes('ke') ||
      lowerText.includes('arah') ||
      lowerText.includes('go to') ||
      lowerText.includes('navigate') ||
      lowerText.includes('bawa') ||
      lowerText.includes('jalan') ||
      lowerText.includes('petunjuk') ||
      lowerText.includes('to')
    ) {
      // Generate clean destination name from user query
      const cleanName = userText
        .replace(/bawa saya ke|ke arah|petunjuk arah ke|jalan ke|go to|navigate to|where is/gi, '')
        .trim() || 'Requested Destination';

      detectedDest = {
        name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        point: {
          latitude: userLocation.latitude + (Math.random() * 0.01 - 0.005),
          longitude: userLocation.longitude + (Math.random() * 0.01 - 0.005)
        }
      };
    }

    const botMsg = {
      id: `b_${Date.now()}`,
      role: 'assistant' as const,
      content: replyText,
      destination: detectedDest
    };

    setMessages((prev) => [...prev, botMsg]);
    setLoading(false);

    // Auto-navigate immediately if explicitly asked to "bawa saya", "go now", "terus pergi", "navigate"
    if (
      detectedDest &&
      (lowerText.includes('bawa') ||
        lowerText.includes('pergi') ||
        lowerText.includes('go now') ||
        lowerText.includes('navigate'))
    ) {
      setTimeout(() => {
        triggerGoToDestination(detectedDest!.name, detectedDest!.point);
      }, 1200);
    }
  };

  return (
    <div id="chat-tab-screen" className="flex-1 bg-slate-950 text-slate-100 flex flex-col h-full overflow-hidden pb-20">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold shadow-lg">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              <span>MapAi Assistant</span>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-400">Gemini AI Navigation & Immediate Route Copilot</p>
          </div>
        </div>
      </div>

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
            <div
              key={m.id}
              className={`flex flex-col max-w-[85%] ${
                isUser ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`flex items-start gap-2.5 ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 border border-slate-700 text-cyan-400'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-medium rounded-tr-none shadow-lg'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  {m.content}
                </div>
              </div>

              {/* Attached Direct Navigation Action Button */}
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

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for directions (e.g., 'bawa saya ke KLCC' or 'ke Shell')..."
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
  );
};

