import React, { useState } from 'react';
import { TrafficAlert, AlertTypeKey, ALERT_TYPES, SettingsState } from '../types';
import { ThumbsUp, Plus, ShieldAlert, Clock, MapPin } from 'lucide-react';
import { t } from '../lib/i18n';

interface AlertsTabProps {
  alerts: TrafficAlert[];
  onConfirmAlert: (id: string) => void;
  onOpenReportModal: () => void;
  settings: SettingsState;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({
  alerts,
  onConfirmAlert,
  onOpenReportModal,
  settings
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  const filteredAlerts = alerts.filter((alert) => {
    if (filterType === 'ALL') return true;
    return alert.type === filterType;
  });

  const getTimeAgo = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  };

  return (
    <div id="alerts-tab-screen" className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <span>{t('nav_alerts', settings.language)}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {alerts.length} {t('active_alerts', settings.language)}
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t('report_here', settings.language)}</span>
        </button>
      </div>

      {/* Auto Phone Tracker Density Alert Banner */}
      {!isBannerDismissed && (
        <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/80 border border-red-500/50 rounded-2xl p-3 text-xs text-slate-200 space-y-1 shadow-lg">
          <div className="font-bold text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-base">📱</span>
              <span>Sistem Pengesanan Kepadatan Phone Tracker (Auto Alert)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded text-[10px] font-mono border border-red-500/40">
                Piawaian 40 - 50 Phone
              </span>
              <button
                onClick={() => setIsBannerDismissed(true)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-0.5 rounded text-[10px] font-bold border border-slate-600 transition-all flex items-center gap-1"
                title="Tutup / Skip Alert Ini"
              >
                <span>Skip</span>
                <span>✕</span>
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Apabila kelompok phone tracker mencapai <strong>40 hingga standar 50 phone active</strong> dalam sesuatu lokasi, sistem MapAi mengesahkan keadaan sebagai <strong>Jalan Sesak / Kesesakan Teruk</strong> dan menyebarkan info alert serta-merta kepada semua pemandu.
          </p>
        </div>
      )}

      {/* Type Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
            filterType === 'ALL'
              ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-black'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          All ({alerts.length})
        </button>
        {(Object.keys(ALERT_TYPES) as AlertTypeKey[]).map((key) => {
          const item = ALERT_TYPES[key];
          const count = alerts.filter((a) => a.type === key).length;
          const isSelected = filterType === key;
          return (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                isSelected
                  ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-black'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-400">
            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold">No active traffic reports found</p>
            <p className="text-xs text-slate-500 mt-1">Be the first to report hazards or police speed traps!</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const item = ALERT_TYPES[alert.type] || { emoji: '🚨', label: alert.type };
            return (
              <div
                key={alert.id}
                className="bg-slate-900 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-4 flex items-start gap-3.5 shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/80 text-2xl flex items-center justify-center shrink-0 shadow-inner">
                  {item.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-white">{item.label}</span>
                    <span className="text-xs font-extrabold text-cyan-400 bg-cyan-950/80 border border-cyan-800/50 px-2 py-0.5 rounded-lg">
                      {alert.confidence}% trust
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                    <span className="font-semibold text-slate-300">{alert.reporter}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {getTimeAgo(alert.timestamp)}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{alert.confirmedBy} confirms</span>
                  </div>
                </div>

                <button
                  onClick={() => onConfirmAlert(alert.id)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-400 border border-slate-700/80 text-slate-300 transition-colors flex items-center gap-1"
                  title="Confirm alert"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
