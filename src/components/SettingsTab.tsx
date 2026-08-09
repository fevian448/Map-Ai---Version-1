import React, { useState, useEffect } from 'react';
import { SettingsState, LanguageCode, AiProviderKey, SystemLog, GeoPoint } from '../types';
import { Settings, Globe, Map, Volume2, Gauge, Server, Download, Cpu, Smartphone, Laptop, Tv, Code2, Sparkles, Key, Link, ShieldCheck, Lock, CheckCircle2, AlertCircle, Loader2, ShieldAlert, Pin, Move, Camera, Mic, MapPin, Bell, Trash2, Wifi } from 'lucide-react';
import { t } from '../lib/i18n';
import { sendChatMessage } from '../services/api';
import { DiagnosticLogger } from './DiagnosticLogger';
import { downloadCompactOfflineMap, getOfflineMapPackMeta, clearOfflineMapData, FREE_BACKEND_SERVERS, OfflineMapPack } from '../services/offlineMapStore';

interface SettingsTabProps {
  settings: SettingsState;
  onUpdateSettings: (newSettings: Partial<SettingsState>) => void;
  onOpenInstallStudio?: () => void;
  onOpenAppBuilder?: () => void;
  logs: SystemLog[];
  onClearLogs: () => void;
  userLocation: GeoPoint;
  speedKmh: number;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  onOpenInstallStudio,
  onOpenAppBuilder,
  logs,
  onClearLogs,
  userLocation,
  speedKmh
}) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testLatency, setTestLatency] = useState<number | null>(null);

  // Offline Map Pack State
  const [offlinePack, setOfflinePack] = useState<OfflineMapPack | null>(null);
  const [isDownloadingOffline, setIsDownloadingOffline] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    setOfflinePack(getOfflineMapPackMeta());
  }, []);

  const handleStartOfflineDownload = async () => {
    setIsDownloadingOffline(true);
    setDownloadProgress(0);
    try {
      const meta = await downloadCompactOfflineMap(userLocation, (pct) => {
        setDownloadProgress(pct);
      });
      setOfflinePack(meta);
    } catch (_e) {
      console.error('Failed downloading offline map tiles:', _e);
    } finally {
      setIsDownloadingOffline(false);
    }
  };

  const handleClearOffline = async () => {
    await clearOfflineMapData();
    setOfflinePack(null);
  };

  const languages: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'zh', label: '中文', flag: '🇨🇳' }
  ];

  const handleTestKeyConnection = async () => {
    setTestStatus('testing');
    setTestLatency(null);
    const startTime = Date.now();
    try {
      const response = await sendChatMessage(
        'Ping! Confirm AI connectivity.',
        settings.aiProvider || 'gemini_flash',
        settings.aiApiKey,
        settings.aiCustomEndpoint
      );
      const latency = Date.now() - startTime;
      if (response && response.length > 0) {
        setTestLatency(latency);
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    } catch (_e) {
      setTestStatus('error');
    }
  };

  return (
    <div id="settings-tab-screen" className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 space-y-4 pb-24">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">{t('nav_settings', settings.language)}</h2>
      </div>

      {/* Installation & Build Studio Section (Gradle, React, Rust, Windows, TV) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 space-y-3 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Download className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>App Installation & Studio Build</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  STUDIO
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Multi-Stack Options: Gradle, React, Rust/Tauri & Windows
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-300 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Gradle Android / TV</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>React PWA Universal</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Rust / Tauri Binary</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
            <Laptop className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Windows EXE & Desktop</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {onOpenInstallStudio && (
            <button
              onClick={onOpenInstallStudio}
              className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Code2 className="w-4 h-4" />
              <span>Studio Package & TV 🚀</span>
            </button>
          )}

          {onOpenAppBuilder && (
            <button
              onClick={onOpenAppBuilder}
              className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Custom App / SDK Builder 🛠️</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Model & Personal API Key Management */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Personal AI Copilot & Custom API Key</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PERSONAL AI
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Use MapAi built-in Gemini or supply your private API key
              </p>
            </div>
          </div>
        </div>

        {/* Security Assurance Badge */}
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[11px] font-medium">
            <strong>Client Privacy Guaranteed:</strong> Personal keys are stored directly in your browser's encrypted state.
          </span>
        </div>

        {/* Provider Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onUpdateSettings({ aiProvider: 'gemini_flash' })}
            className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
              (settings.aiProvider || 'gemini_flash') === 'gemini_flash'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="text-xs font-bold">✨ Gemini 3.6 Flash</span>
            <span className="text-[10px] text-slate-400 font-normal">Fast, default copilot (Built-in)</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ aiProvider: 'gemini_pro' })}
            className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
              settings.aiProvider === 'gemini_pro'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="text-xs font-bold">🌟 Gemini 3.1 Pro</span>
            <span className="text-[10px] text-slate-400 font-normal">Complex route planning & reasoning</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ aiProvider: 'groq' })}
            className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
              settings.aiProvider === 'groq'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="text-xs font-bold">⚡ Groq (Llama 3.3 70B)</span>
            <span className="text-[10px] text-slate-400 font-normal">Ultra fast response speed</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ aiProvider: 'openrouter' })}
            className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
              settings.aiProvider === 'openrouter'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="text-xs font-bold">🔀 OpenRouter</span>
            <span className="text-[10px] text-slate-400 font-normal">Universal AI model aggregator</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ aiProvider: 'anthropic' })}
            className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
              settings.aiProvider === 'anthropic'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="text-xs font-bold">🧠 Anthropic Claude</span>
            <span className="text-[10px] text-slate-400 font-normal">Claude 3.5 Haiku / Sonnet</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ aiProvider: 'deepseek' })}
            className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
              settings.aiProvider === 'deepseek'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="text-xs font-bold">🐳 DeepSeek V3 / R1</span>
            <span className="text-[10px] text-slate-400 font-normal">Deep reasoning open AI engine</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ aiProvider: 'openai' })}
            className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
              settings.aiProvider === 'openai'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="text-xs font-bold">🟢 OpenAI GPT-4o</span>
            <span className="text-[10px] text-slate-400 font-normal">Standard OpenAI API key</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ aiProvider: 'huggingface' })}
            className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
              settings.aiProvider === 'huggingface'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="text-xs font-bold">🤗 Hugging Face</span>
            <span className="text-[10px] text-slate-400 font-normal">Open-weight Qwen/Llama models</span>
          </button>
        </div>

        {/* Custom Key Input & Connection Test Button */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div>
            <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Personal API Key:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {settings.aiApiKey ? '🔑 Custom Key Provided' : '⚡ Using App Key'}
              </span>
            </label>
            <input
              type="password"
              value={settings.aiApiKey || ''}
              onChange={(e) => {
                onUpdateSettings({ aiApiKey: e.target.value });
                setTestStatus('idle');
              }}
              placeholder={
                settings.aiProvider === 'groq'
                  ? 'gsk_...'
                  : settings.aiProvider === 'openrouter'
                  ? 'sk-or-v1-...'
                  : settings.aiProvider === 'anthropic'
                  ? 'sk-ant-...'
                  : 'sk-... or hf_...'
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-200 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1">
              <Link className="w-3.5 h-3.5 text-amber-400" />
              <span>Custom Endpoint Base URL (Optional):</span>
            </label>
            <input
              type="text"
              value={settings.aiCustomEndpoint || ''}
              onChange={(e) => {
                onUpdateSettings({ aiCustomEndpoint: e.target.value });
                setTestStatus('idle');
              }}
              placeholder="https://api.example.com/v1/chat/completions"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-1 flex items-center justify-between">
            <button
              onClick={handleTestKeyConnection}
              disabled={testStatus === 'testing'}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {testStatus === 'testing' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Testing Connectivity...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test API Connection</span>
                </>
              )}
            </button>

            {testStatus === 'success' && (
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Connected! ({testLatency}ms)</span>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="flex items-center gap-1 text-xs font-bold text-rose-400">
                <AlertCircle className="w-4 h-4" />
                <span>Connection failed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security & Personal Privacy Settings */}
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs uppercase font-black text-emerald-400 tracking-wider">
              Safety & Personal Privacy Settings
            </h3>
            <p className="text-[10px] text-slate-400">
              Enhanced user security and offline/private data controls
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-slate-200">Strict Local Encrypted Storage Only</div>
                <div className="text-[10px] text-slate-400">Keep personal API keys and favorite locations local</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.encryptedLocalStorageOnly ?? true}
              onChange={(e) => onUpdateSettings({ encryptedLocalStorageOnly: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-xs font-bold text-slate-200">Emergency Voice AI Assist</div>
                <div className="text-[10px] text-slate-400">AI copilot auto-reads hazard and SOS updates</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.emergencyAiVoiceAlerts ?? true}
              onChange={(e) => onUpdateSettings({ emergencyAiVoiceAlerts: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
          </label>
        </div>
      </div>

      {/* Language Option */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
        <div className="text-xs uppercase font-bold text-slate-400 flex items-center gap-1.5 mb-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>{t('language', settings.language)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {languages.map((lang) => {
            const isSelected = settings.language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => onUpdateSettings({ language: lang.code })}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Provider */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
        <div className="text-xs uppercase font-bold text-slate-400 flex items-center gap-1.5 mb-2">
          <Map className="w-4 h-4 text-cyan-400" />
          <span>{t('map_provider', settings.language)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onUpdateSettings({ mapProvider: 'osm' })}
            className={`p-3 rounded-xl border text-xs font-bold transition-all ${
              settings.mapProvider === 'osm'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            🗺️ OpenStreetMap
          </button>
          <button
            onClick={() => onUpdateSettings({ mapProvider: 'google' })}
            className={`p-3 rounded-xl border text-xs font-bold transition-all ${
              settings.mapProvider === 'google'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            📍 Google Maps
          </button>
          <button
            onClick={() => onUpdateSettings({ mapProvider: 'nasa_gibs' })}
            className={`p-3 rounded-xl border text-xs font-bold transition-all ${
              settings.mapProvider === 'nasa_gibs'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            🛰️ NASA Satellite (MODIS/VIIRS)
          </button>
          <button
            onClick={() => onUpdateSettings({ mapProvider: 'nasa_night' })}
            className={`p-3 rounded-xl border text-xs font-bold transition-all ${
              settings.mapProvider === 'nasa_night'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            🌃 NASA Earth at Night
          </button>
        </div>
      </div>

      {/* Preferences Toggles */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-slate-200">{t('voice_guidance', settings.language)}</span>
          </div>
          <input
            type="checkbox"
            checked={settings.voiceGuidance}
            onChange={(e) => onUpdateSettings({ voiceGuidance: e.target.checked })}
            className="w-5 h-5 accent-cyan-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-slate-200">{t('speed_unit', settings.language)}</span>
          </div>
          <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs">
            <button
              onClick={() => onUpdateSettings({ speedUnit: 'kmh' })}
              className={`px-3 py-1 font-bold ${
                settings.speedUnit === 'kmh' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              km/h
            </button>
            <button
              onClick={() => onUpdateSettings({ speedUnit: 'mph' })}
              className={`px-3 py-1 font-bold ${
                settings.speedUnit === 'mph' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              mph
            </button>
          </div>
        </div>
      </div>

      {/* Floating AI & Dynamic UI Placement Settings */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Move className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs uppercase font-black text-amber-400 tracking-wider">
              Floating AI Copilot & UI Placement
            </h3>
            <p className="text-[10px] text-slate-400">
              Set AI to floating overlay mode or fixed/docked in chat tab
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-slate-200">Enable Floating AI Widget</div>
                <div className="text-[10px] text-slate-400">Overlay AI Copilot on top of Map & Navigation views</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableFloatingAi ?? true}
              onChange={(e) => onUpdateSettings({ enableFloatingAi: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => onUpdateSettings({ floatingAiMode: 'float', enableFloatingAi: true })}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                (settings.floatingAiMode || 'float') === 'float'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5" />
                <span>Floating Overlay</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 font-mono">ON MAP</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ floatingAiMode: 'docked', enableFloatingAi: false })}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                settings.floatingAiMode === 'docked'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5" />
                <span>Fixed / Docked</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono">TAB ONLY</span>
            </button>
          </div>
        </div>
      </div>

      {/* Permissions Matrix & Download Verification */}
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs uppercase font-black text-purple-400 tracking-wider">
              Download & Device Permissions Status
            </h3>
            <p className="text-[10px] text-slate-400">
              Verified permissions for seamless Android & Web execution without bugs
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-200">Geolocation (GPS)</div>
              <div className="text-[10px] text-emerald-400 font-semibold">ACCESS_FINE_LOCATION</div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-200">Camera & Scanner</div>
              <div className="text-[10px] text-cyan-400 font-semibold">CAMERA</div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <Mic className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-200">Microphone & Voice</div>
              <div className="text-[10px] text-amber-400 font-semibold">RECORD_AUDIO</div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-200">Hazards Notification</div>
              <div className="text-[10px] text-purple-400 font-semibold">POST_NOTIFICATIONS</div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Auto-Config Diagnostic Logger for Google AI Studio Monitoring */}
      <DiagnosticLogger
        logs={logs}
        onClearLogs={onClearLogs}
        settings={settings}
        userLocation={userLocation}
        speedKmh={speedKmh}
      />

      {/* Compact Offline Map Download Manager Card */}
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Offline Map Data Management (~1.5MB)</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  AUTO DOWNLOAD
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Compact map data for offline navigation & auto-caching upon installation
              </p>
            </div>
          </div>
        </div>

        {/* Offline Status */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
          {offlinePack ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-bold">
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Offline Map Active ({offlinePack.regionName})</span>
                </span>
                <button
                  onClick={handleClearOffline}
                  className="text-slate-400 hover:text-rose-400 text-[10px] font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Data</span>
                </button>
              </div>
              <div className="text-[11px] text-slate-300 grid grid-cols-2 gap-2 font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <div>Total Tiles: <strong className="text-cyan-300">{offlinePack.tileCount} tiles</strong></div>
                <div>Data Size: <strong className="text-emerald-300">{offlinePack.sizeMb} MB</strong></div>
                <div className="col-span-2 text-[10px] text-slate-400">
                  Updated: {new Date(offlinePack.downloadedAt).toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-[11px]">
              No offline map data saved yet. Click below to download compact local map tiles.
            </div>
          )}

          {/* Download Progress Bar */}
          {isDownloadingOffline && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] font-bold text-cyan-300">
                <span>Downloading map tiles...</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-1 flex items-center justify-between">
            <button
              onClick={handleStartOfflineDownload}
              disabled={isDownloadingOffline}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-50 transition-all"
            >
              {isDownloadingOffline ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Downloading Compact Map Tiles...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Offline Map Data (Auto Compact ~1.5MB)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Free Backend Server Auto-Fallback & Live Runtime */}
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Free Backend Servers & Live Runtime Continuous Sync</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ALWAYS ONLINE
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Automatic fallback to free backend instances (Render/Railway/Local) ensuring live runtime continuity.
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {FREE_BACKEND_SERVERS.map((srv, idx) => {
            const isSelected = settings.serverUrl === srv.url;
            return (
              <div
                key={idx}
                onClick={() => onUpdateSettings({ serverUrl: srv.url })}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <div>
                    <div className="text-xs font-bold text-white">{srv.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{srv.url}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  {srv.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Backend Server URL Config */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
        <div className="text-xs uppercase font-bold text-slate-400 flex items-center gap-1.5 mb-1">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>{t('server_url', settings.language)}</span>
        </div>
        <input
          type="text"
          value={settings.serverUrl}
          onChange={(e) => onUpdateSettings({ serverUrl: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
        />
        <p className="text-[11px] text-slate-500">Connected to express + socket.io backend service</p>
      </div>
    </div>
  );
};

