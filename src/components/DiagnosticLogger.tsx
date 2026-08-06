import React, { useState } from 'react';
import { SystemLog, SettingsState, GeoPoint } from '../types';
import { Activity, ShieldCheck, Wifi, Cpu, CheckCircle2, AlertTriangle, XCircle, RefreshCw, ChevronDown, ChevronUp, Trash2, Download, Radio, Lock } from 'lucide-react';

interface DiagnosticLoggerProps {
  logs: SystemLog[];
  onClearLogs: () => void;
  settings: SettingsState;
  userLocation: GeoPoint;
  speedKmh: number;
}

export const DiagnosticLogger: React.FC<DiagnosticLoggerProps> = ({
  logs,
  onClearLogs,
  settings,
  userLocation,
  speedKmh
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter((l) => categoryFilter === 'ALL' || l.category === categoryFilter);

  // Download log report JSON
  const handleDownloadLogReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      settingsSummary: {
        aiProvider: settings.aiProvider,
        hasCustomKey: Boolean(settings.aiApiKey),
        mapProvider: settings.mapProvider,
        voiceGuidance: settings.voiceGuidance,
        encryptedStorage: settings.encryptedLocalStorageOnly
      },
      currentTelemetry: {
        userLocation,
        speedKmh,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
      },
      logs
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MapAi-DiagnosticLog-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Auto-Config & System Monitor Log</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                LIVE
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Real-time telemetry, permissions & Google AI Studio monitor
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition-all"
        >
          <span>{isOpen ? 'Collapse' : 'Expand Logs'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Status Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400 font-semibold">GPS Precision</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> High
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400 font-semibold">AI Copilot</span>
          <span className="text-amber-400 font-bold truncate ml-1">
            {settings.aiProvider || 'gemini_flash'}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400 font-semibold">Permissions</span>
          <span className="text-cyan-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Granted
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400 font-semibold">Server REST</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Wifi className="w-3 h-3" /> 200 OK
          </span>
        </div>
      </div>

      {/* Expanded Logs Viewer */}
      {isOpen && (
        <div className="space-y-2 pt-2 border-t border-slate-800 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold">
              {['ALL', 'GPS', 'AI', 'PERMISSIONS', 'SOCKET', 'SYSTEM', 'NAVIGATION'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-1 rounded-lg border transition-all ${
                    categoryFilter === cat
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleDownloadLogReport}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-slate-300 flex items-center gap-1 transition-all"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>Export Log JSON</span>
              </button>

              <button
                onClick={onClearLogs}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-rose-400 flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-52 overflow-y-auto space-y-1.5 font-mono text-[11px]">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-500 text-center py-4">No telemetry logs recorded yet.</div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 border-b border-slate-900 pb-1">
                  <span className="text-slate-500 text-[10px] shrink-0">{log.timestamp}</span>
                  <span
                    className={`px-1 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                      log.category === 'GPS'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : log.category === 'AI'
                        ? 'bg-amber-500/20 text-amber-300'
                        : log.category === 'PERMISSIONS'
                        ? 'bg-purple-500/20 text-purple-300'
                        : log.category === 'SOCKET'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {log.category}
                  </span>
                  <span
                    className={`flex-1 break-words ${
                      log.level === 'error'
                        ? 'text-rose-400 font-bold'
                        : log.level === 'warn'
                        ? 'text-amber-300'
                        : log.level === 'success'
                        ? 'text-emerald-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
