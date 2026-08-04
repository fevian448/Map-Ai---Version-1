import React from 'react';
import { Navigation2, Flag, ShieldAlert, X } from 'lucide-react';
import { RouteInfo, SettingsState } from '../types';
import { t } from '../lib/i18n';

interface NavigationHeaderProps {
  destinationName: string;
  route: RouteInfo | null;
  speedKmh: number;
  speedLimitKmh: number;
  onStop: () => void;
  settings: SettingsState;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  destinationName,
  route,
  speedKmh,
  speedLimitKmh,
  onStop,
  settings
}) => {
  const isOverSpeed = speedKmh > speedLimitKmh;

  const totalDistKm = route ? (route.totalDistanceMeters / 1000).toFixed(1) : '0.0';
  const etaMinutes = route ? Math.ceil(route.durationSeconds / 60) : 0;

  return (
    <div id="nav-header-banner" className="bg-slate-900/95 backdrop-blur-md border-b border-slate-700/80 p-3 text-slate-100 shadow-xl z-[1000] relative">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Next Turn Instruction */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold">
            <Navigation2 className="w-6 h-6 rotate-45 animate-pulse" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1">
              <span>Navigating to</span>
            </div>
            <div className="text-base font-bold truncate max-w-[180px] sm:max-w-xs text-white">
              {destinationName || 'Selected Destination'}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{etaMinutes} min ({totalDistKm} km)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-emerald-400">Clear Route</span>
            </div>
          </div>
        </div>

        {/* Speedometer Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-xl border flex flex-col items-center justify-center ${
              isOverSpeed
                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <span className="text-lg font-black leading-tight">
              {Math.round(speedKmh)}
            </span>
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              limit {speedLimitKmh}
            </span>
          </div>

          <button
            id="stop-navigation-btn"
            onClick={onStop}
            className="w-10 h-10 rounded-xl bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg shadow-red-900/30"
            title={t('stop_navigation', settings.language)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
