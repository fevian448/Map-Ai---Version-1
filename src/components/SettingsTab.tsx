import React from 'react';
import { SettingsState, LanguageCode } from '../types';
import { Settings, Globe, Map, Volume2, Gauge, Server, Moon } from 'lucide-react';
import { t } from '../lib/i18n';

interface SettingsTabProps {
  settings: SettingsState;
  onUpdateSettings: (newSettings: Partial<SettingsState>) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ settings, onUpdateSettings }) => {
  const languages: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'zh', label: '中文', flag: '🇨🇳' }
  ];

  return (
    <div id="settings-tab-screen" className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 space-y-4 pb-24">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">{t('nav_settings', settings.language)}</h2>
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
