import React, { useState } from 'react';
import { 
  Navigation2, 
  Flag, 
  X, 
  Volume2, 
  ListOrdered, 
  CornerUpRight, 
  CornerUpLeft, 
  ArrowUp, 
  RotateCcw, 
  GitFork, 
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RouteInfo, SettingsState } from '../types';
import { t } from '../lib/i18n';
import { speakPrompt } from '../lib/audio';

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
  const [showSteps, setShowSteps] = useState(false);
  const isOverSpeed = speedKmh > speedLimitKmh;

  const totalDistKm = route ? (route.totalDistanceMeters / 1000).toFixed(1) : '0.0';
  const etaMinutes = route ? Math.ceil(route.durationSeconds / 60) : 0;

  const steps = route?.steps || [];
  const currentStep = steps[0];
  const nextStep = steps[1];

  const handleSpeakCurrentStep = () => {
    if (currentStep) {
      speakPrompt(`${currentStep.instruction}. Jarak ${Math.round(currentStep.distanceMeters)} meter.`, settings.language);
    } else {
      speakPrompt(`Menuju ke ${destinationName}. Jarak keseluruhan ${totalDistKm} kilometer.`, settings.language);
    }
  };

  const getManeuverIcon = (type?: string) => {
    switch (type) {
      case 'turn-right':
        return <CornerUpRight className="w-6 h-6 text-emerald-400" />;
      case 'turn-left':
        return <CornerUpLeft className="w-6 h-6 text-emerald-400" />;
      case 'u-turn':
        return <RotateCcw className="w-6 h-6 text-amber-400" />;
      case 'fork':
        return <GitFork className="w-6 h-6 text-cyan-400" />;
      case 'arrive':
        return <Flag className="w-6 h-6 text-red-400" />;
      default:
        return <ArrowUp className="w-6 h-6 text-cyan-400" />;
    }
  };

  return (
    <div id="nav-header-banner" className="bg-slate-900/98 backdrop-blur-lg border-b border-slate-700/80 text-slate-100 shadow-2xl z-[1000] relative">
      <div className="max-w-4xl mx-auto p-3">
        <div className="flex items-center justify-between gap-3">
          {/* Main Turn Direction Box */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold flex-shrink-0 shadow-lg shadow-emerald-500/10">
              {getManeuverIcon(currentStep?.maneuverType)}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                  {currentStep ? `${Math.round(currentStep.distanceMeters)}m` : 'LALUAN GPS'}
                </span>
                {nextStep && (
                  <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                    Kemudian: {nextStep.instruction}
                  </span>
                )}
              </div>

              <div className="text-base font-black truncate text-white mt-0.5">
                {currentStep ? currentStep.instruction : `Menuju ke ${destinationName || 'Destinasi'}`}
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-slate-200">{etaMinutes} min</span>
                <span className="text-slate-500">•</span>
                <span>{totalDistKm} km</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-emerald-400 font-medium">Lancar (Live OSRM GPS)</span>
              </div>
            </div>
          </div>

          {/* Action & Speed Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Voice Prompt Button */}
            <button
              onClick={handleSpeakCurrentStep}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 flex items-center justify-center transition-all active:scale-95 shadow-md"
              title="Ulang Arahan Suara (Voice Guidance)"
            >
              <Volume2 className="w-5 h-5" />
            </button>

            {/* Steps Drawer Toggle */}
            {steps.length > 0 && (
              <button
                onClick={() => setShowSteps(!showSteps)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all active:scale-95 shadow-md ${
                  showSteps ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title="Senarai Panduan Belok (Step-by-Step)"
              >
                <ListOrdered className="w-5 h-5" />
              </button>
            )}

            {/* Speedometer Badge */}
            <div
              className={`px-3 py-1.5 rounded-xl border flex flex-col items-center justify-center ${
                isOverSpeed
                  ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <span className="text-base font-black leading-tight">
                {Math.round(speedKmh)}
              </span>
              <span className="text-[9px] uppercase font-bold text-slate-400">
                had {speedLimitKmh}
              </span>
            </div>

            {/* Stop Navigation */}
            <button
              id="stop-navigation-btn"
              onClick={onStop}
              className="w-10 h-10 rounded-xl bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg shadow-red-900/40"
              title={t('stop_navigation', settings.language)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible Step-by-Step Turn List */}
        {showSteps && steps.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800 max-h-60 overflow-y-auto space-y-1.5 pr-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
              <span>Panduan Laluan Lengkap ({steps.length} Langkah)</span>
              <span className="text-cyan-400 cursor-pointer" onClick={() => setShowSteps(false)}>Tutup</span>
            </div>
            {steps.map((st, i) => (
              <div
                key={st.id || i}
                className={`p-2.5 rounded-xl border flex items-center gap-3 text-xs ${
                  i === 0 
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-white font-semibold' 
                    : 'bg-slate-800/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                  {getManeuverIcon(st.maneuverType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-slate-200">{st.instruction}</div>
                  <div className="text-[10px] text-slate-400">{st.roadName}</div>
                </div>
                <div className="text-right flex-shrink-0 text-[11px] font-mono text-slate-400">
                  {Math.round(st.distanceMeters)}m
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
