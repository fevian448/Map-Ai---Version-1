import React, { useState, useRef, useEffect } from 'react';
import { SettingsState, GeoPoint, Place, SubscriptionState } from '../types';
import { Bot, Send, X, Minimize2, Sparkles, Navigation, MapPin, Mic, Pin, Move, GripHorizontal, Crown, Zap } from 'lucide-react';
import { sendChatMessage, searchGeocoding } from '../services/api';
import { t } from '../lib/i18n';

interface FloatingAiCopilotProps {
  settings: SettingsState;
  userLocation: GeoPoint;
  places: Place[];
  onSelectDestination: (point: GeoPoint | null, name: string) => void;
  onStartNavigation: () => void;
  onAddLog: (
    category: 'GPS' | 'AI' | 'PERMISSIONS' | 'SOCKET' | 'SYSTEM' | 'NAVIGATION',
    level: 'info' | 'warn' | 'error' | 'success',
    message: string
  ) => void;
  onToggleDock: () => void;
  subscription?: SubscriptionState;
  onOpenUpgradeModal?: () => void;
  onUpdateSubscription?: (sub: SubscriptionState) => void;
}

export const FloatingAiCopilot: React.FC<FloatingAiCopilotProps> = ({
  settings,
  userLocation,
  places,
  onSelectDestination,
  onStartNavigation,
  onAddLog,
  onToggleDock,
  subscription = {
    tier: 'FREE',
    dailyQueriesLimit: 15,
    queriesUsedToday: 0,
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  onOpenUpgradeModal,
  onUpdateSubscription
}) => {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const currentSub = subscription || {
    tier: 'FREE',
    dailyQueriesLimit: 15,
    queriesUsedToday: 0,
    lastResetDate: new Date().toISOString().split('T')[0]
  };
  const isPro = currentSub.tier === 'PRO' || currentSub.tier === 'ENTERPRISE';
  const remainingFreeQueries = Math.max(0, 15 - (currentSub.queriesUsedToday || 0));

  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; text: string; actionDest?: { name: string; point: GeoPoint } }[]
  >([
    {
      role: 'assistant',
      text: 'MapAi Floating Copilot ready! Draggable anywhere on screen. Ask for traffic, routes, or destination.'
    }
  ]);
  const [isListening, setIsListening] = useState(false);

  // Position for dragging (null = default bottom-right)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize position when component mounts or expands
  useEffect(() => {
    if (pos === null && typeof window !== 'undefined') {
      const defaultX = Math.max(16, window.innerWidth - 380);
      const defaultY = Math.max(16, window.innerHeight - 520);
      setPos({ x: defaultX, y: defaultY });
    }
  }, [pos]);

  // Dragging handlers (mouse & touch pointer events)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag on left click or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    e.preventDefault();
    isDraggingRef.current = true;

    const currentX = pos ? pos.x : window.innerWidth - 380;
    const currentY = pos ? pos.y : window.innerHeight - 520;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    const newX = Math.min(Math.max(10, dragStartRef.current.initialX + dx), window.innerWidth - 120);
    const newY = Math.min(Math.max(10, dragStartRef.current.initialY + dy), window.innerHeight - 100);

    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  // Quick Voice Speech Input
  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice speech recognition is not supported in this browser. Please type your prompt.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang =
        settings.language === 'id' ? 'id-ID' : settings.language === 'es' ? 'es-ES' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsListening(true);
      onAddLog('AI', 'info', 'Started voice recognition mic input');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSendQuery(transcript);
      };

      recognition.onerror = (err: any) => {
        setIsListening(false);
        onAddLog('AI', 'warn', `Voice recognition warning: ${err.error || 'speech ended'}`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      onAddLog('AI', 'error', 'Failed to start Speech Recognition service');
    }
  };

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    if (!isPro && (currentSub.queriesUsedToday || 0) >= 15) {
      if (onOpenUpgradeModal) {
        onOpenUpgradeModal();
      }
      return;
    }

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);
    onAddLog(
      'AI',
      'info',
      `Sending AI query [${settings.aiProvider || 'gemini_flash'}]: "${textToSend.substring(0, 40)}..."`
    );

    try {
      const response = await sendChatMessage(
        textToSend,
        settings.aiProvider || 'gemini_flash',
        settings.aiApiKey,
        settings.aiCustomEndpoint,
        'default_user',
        currentSub.tier
      );

      if (onUpdateSubscription && response.queriesUsed !== undefined) {
        onUpdateSubscription({
          ...currentSub,
          queriesUsedToday: response.queriesUsed
        });
      }

      let actionDest: { name: string; point: GeoPoint } | undefined = undefined;
      const lower = textToSend.toLowerCase();

      // Check for navigation intent
      if (
        lower.includes('navigate') ||
        lower.includes('go to') ||
        lower.includes('take me') ||
        lower.includes('bawa saya') ||
        lower.includes('petunjuk')
      ) {
        const cleanName = textToSend
          .replace(/navigate to|take me to|go to|bawa saya ke|petunjuk arah ke/gi, '')
          .trim();

        if (cleanName) {
          const geoResults = await searchGeocoding(cleanName, userLocation);
          if (geoResults && geoResults.length > 0) {
            actionDest = { name: geoResults[0].name, point: geoResults[0].point };
          } else {
            actionDest = {
              name: cleanName,
              point: {
                latitude: userLocation.latitude + (Math.random() * 0.01 - 0.005),
                longitude: userLocation.longitude + (Math.random() * 0.01 - 0.005)
              }
            };
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: response.text || 'I have checked your request and updated the map route.',
          actionDest
        }
      ]);
      onAddLog('AI', 'success', 'Received AI response');
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I encountered an issue connecting to the AI model. Please check your API key in Settings.'
        }
      ]);
      onAddLog('AI', 'error', `AI copilot failed: ${e.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!settings.enableFloatingAi) return null;

  const stylePosition: React.CSSProperties = pos
    ? { left: `${pos.x}px`, top: `${pos.y}px` }
    : { right: '16px', bottom: '80px' };

  return (
    <div
      id="floating-ai-copilot-container"
      ref={containerRef}
      style={stylePosition}
      className="fixed z-[2000] flex flex-col items-end gap-2 select-none touch-none transition-shadow"
    >
      {/* Expanded Floating AI Widget Window */}
      {expanded ? (
        <div className="w-80 sm:w-96 bg-slate-900/95 backdrop-blur-2xl border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[480px]">
          {/* Draggable Drag Handle Header */}
          <div
            onPointerDown={handlePointerDown}
            className="bg-slate-950/95 px-3 py-2 border-b border-slate-800 flex items-center justify-between cursor-move active:bg-slate-900 transition-colors"
            title="Drag to move Floating AI Copilot"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                <GripHorizontal className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <h4 className="text-xs font-black text-white tracking-wide">
                  {t('floating_copilot', settings.language)}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                MOVE / DRAG
              </span>
              <button
                onClick={onToggleDock}
                title="Dock to Main Chat Tab"
                className="p-1 rounded-lg hover:bg-slate-800 hover:text-amber-300 transition-colors"
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setExpanded(false)}
                title="Minimize Floating Widget"
                className="p-1 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs custom-scrollbar">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-100 rounded-br-xs'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>

                {m.actionDest && (
                  <div className="mt-1.5 p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center gap-2 text-cyan-200 text-[11px]">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="truncate font-semibold">{m.actionDest.name}</span>
                    <button
                      onClick={() => {
                        onSelectDestination(m.actionDest!.point, m.actionDest!.name);
                        onStartNavigation();
                        setExpanded(false);
                      }}
                      className="ml-auto px-2 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 shrink-0 shadow-md"
                    >
                      <Navigation className="w-3 h-3 fill-slate-950" />
                      <span>{t('start_navigation', settings.language)}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 text-slate-400 text-xs animate-pulse">
                <Bot className="w-4 h-4 text-amber-400" />
                <span>AI Copilot thinking...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-2 bg-slate-950/90 border-t border-slate-800 flex items-center gap-1.5">
            <button
              onClick={handleMicClick}
              className={`p-2 rounded-xl border transition-all ${
                isListening
                  ? 'bg-rose-500 border-rose-400 text-white animate-bounce'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-amber-300'
              }`}
              title="Voice Speech Input"
            >
              <Mic className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
              placeholder={t('chat_hint', settings.language)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => handleSendQuery()}
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Floating Draggable Pill Indicator */
        <div className="flex items-center gap-1 group">
          <div
            onPointerDown={handlePointerDown}
            className="p-2.5 rounded-full bg-slate-950/80 border border-amber-500/40 text-amber-400 cursor-move hover:bg-slate-800 transition-colors shadow-lg"
            title="Drag to reposition AI Copilot"
          >
            <Move className="w-4 h-4" />
          </div>

          <button
            onClick={() => setExpanded(true)}
            className="px-3 py-2.5 rounded-full bg-slate-900/95 border-2 border-amber-500/70 hover:border-amber-400 text-amber-300 shadow-2xl flex items-center gap-2 backdrop-blur-md hover:scale-105 transition-all active:scale-95"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="text-xs font-black text-white">{t('floating_copilot', settings.language)}</span>
          </button>
        </div>
      )}
    </div>
  );
};
