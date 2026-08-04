import React from 'react';
import { SpeedCamera, WeatherInfo, SettingsState, TrafficAlert } from '../types';
import { Gauge, Camera, CloudSun, AlertTriangle, Play, Square, ShieldAlert, Plus } from 'lucide-react';
import { t } from '../lib/i18n';

interface DriveTabProps {
  speedKmh: number;
  speedLimitKmh: number;
  speedCameras: SpeedCamera[];
  weather: WeatherInfo;
  isNavigating: boolean;
  onStartNavigation: () => void;
  onStopNavigation: () => void;
  alerts: TrafficAlert[];
  onOpenReportModal: () => void;
  settings: SettingsState;
}

export const DriveTab: React.FC<DriveTabProps> = ({
  speedKmh,
  speedLimitKmh,
  speedCameras,
  weather,
  isNavigating,
  onStartNavigation,
  onStopNavigation,
  alerts,
  onOpenReportModal,
  settings
}) => {
  const isOverSpeed = speedKmh > speedLimitKmh;
  const trafficJamAlerts = alerts.filter((a) => a.type === 'TRAFFIC');

  return (
    <div id="drive-tab-screen" className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 space-y-4 pb-24">
      {/* Huge Digital Speedometer HUD */}
      <div
        className={`rounded-3xl p-6 border text-center relative overflow-hidden transition-all shadow-2xl ${
          isOverSpeed
            ? 'bg-gradient-to-br from-red-950/90 to-red-900/90 border-red-500/80 shadow-red-900/30'
            : 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-slate-800'
        }`}
      >
        <div className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-2 flex items-center justify-center gap-1.5">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span>{t('current_speed', settings.language)}</span>
        </div>

        <div className="relative inline-block my-2">
          <span
            className={`text-7xl font-black font-mono tracking-tight ${
              isOverSpeed ? 'text-red-400 animate-pulse' : 'text-cyan-400'
            }`}
          >
            {Math.round(speedKmh)}
          </span>
          <span className="text-lg font-bold text-slate-400 ml-2">
            {settings.speedUnit === 'mph' ? 'mph' : 'km/h'}
          </span>
        </div>

        <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-bold text-slate-300">
          <span>{t('speed_limit', settings.language)}:</span>
          <span className="text-amber-400 font-mono text-sm">{speedLimitKmh} km/h</span>
        </div>

        {isOverSpeed && (
          <div className="mt-3 p-2 bg-red-600/30 border border-red-500/60 rounded-xl text-xs font-extrabold text-red-300 flex items-center justify-center gap-2 animate-bounce">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{t('over_speed', settings.language)}</span>
          </div>
        )}

        {/* Start / Stop Drive Simulation */}
        <div className="mt-5">
          {!isNavigating ? (
            <button
              onClick={onStartNavigation}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-sm"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Simulate Drive Speedometer</span>
            </button>
          ) : (
            <button
              onClick={onStopNavigation}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 text-sm"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop Drive Mode</span>
            </button>
          )}
        </div>
      </div>

      {/* Traffic Jam Alert & Live Congestion Radar */}
      <div className="bg-gradient-to-br from-red-950/60 via-slate-900 to-slate-900 border border-red-500/40 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center text-lg animate-pulse">
              🚦
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Traffic Jam Radar</span>
                <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.5 rounded font-bold">
                  LIVE
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {trafficJamAlerts.length} active traffic jams reported nearby
              </p>
            </div>
          </div>

          <button
            onClick={onOpenReportModal}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Report Jam</span>
          </button>
        </div>

        {trafficJamAlerts.length > 0 ? (
          <div className="space-y-2">
            {trafficJamAlerts.map((jam) => (
              <div
                key={jam.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-red-300 flex items-center gap-1">
                    <span>🚦 Traffic Jam Alert</span>
                    <span className="text-[10px] text-slate-400">• {jam.confirmedBy} confirms</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 font-medium">{jam.description}</div>
                </div>
                <div className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-1 rounded shrink-0">
                  {jam.confidence}% trust
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3 text-xs text-slate-400">
            No severe traffic jams on your immediate route right now!
          </div>
        )}
      </div>

      {/* Weather Widget */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="text-xs uppercase font-bold text-slate-400 mb-3 flex items-center gap-1.5">
          <CloudSun className="w-4 h-4 text-cyan-400" />
          <span>{t('weather_info', settings.language)}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-5xl">{weather.emoji}</div>
          <div className="flex-1">
            <div className="text-base font-bold text-white">
              {weather.condition} • {weather.temperatureC}°C
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Wind {weather.windKph} km/h • Humidity {weather.humidity}% • Visibility {weather.visibilityKm} km
            </div>
            <div className="text-xs font-semibold text-cyan-400 mt-1">
              Road: {weather.roadRisk}
            </div>
          </div>
        </div>
      </div>

      {/* Speed Cameras List */}
      <div className="space-y-3">
        <h3 className="text-sm uppercase font-bold text-slate-400 flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-amber-400" />
          <span>{t('nearby_cameras', settings.language)} ({speedCameras.length})</span>
        </h3>

        <div className="space-y-2">
          {speedCameras.map((cam) => (
            <div
              key={cam.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-950/80 border border-red-500/50 text-red-400 font-mono font-bold text-xs flex items-center justify-center">
                  📸
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Speed Cam {cam.limitKmh} km/h</div>
                  <div className="text-xs text-slate-400">Direction: {cam.direction}</div>
                </div>
              </div>

              <div className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-xs">
                Limit {cam.limitKmh}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
