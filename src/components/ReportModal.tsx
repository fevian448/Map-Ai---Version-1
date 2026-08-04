import React, { useState } from 'react';
import { X, Send, AlertTriangle } from 'lucide-react';
import { ALERT_TYPES, AlertTypeKey, GeoPoint, SettingsState } from '../types';
import { t } from '../lib/i18n';

interface ReportModalProps {
  onClose: () => void;
  onSubmit: (type: AlertTypeKey, description: string) => void;
  userLocation: GeoPoint | null;
  settings: SettingsState;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  onClose,
  onSubmit,
  userLocation,
  settings
}) => {
  const [selectedType, setSelectedType] = useState<AlertTypeKey>('HAZARD');
  const [note, setNote] = useState('');

  const alertKeys = Object.keys(ALERT_TYPES) as AlertTypeKey[];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const typeObj = ALERT_TYPES[selectedType];
    const finalDesc = note.trim() || `User reported ${typeObj.label}`;
    onSubmit(selectedType, finalDesc);
  };

  return (
    <div id="report-modal-backdrop" className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div id="report-modal-dialog" className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 text-slate-100 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {t('report_here', settings.language)}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Grid of options */}
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {alertKeys.map((key) => {
              const item = ALERT_TYPES[key];
              const isSelected = selectedType === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelectedType(key)}
                  className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/30'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-sm font-semibold truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Left lane blocked, slow traffic..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Submit Live Alert</span>
          </button>
        </form>
      </div>
    </div>
  );
};
