import React from 'react';
import { Contributor, SettingsState } from '../types';
import { Award, Trophy, ShieldCheck, MapPin, Activity, Flame } from 'lucide-react';
import { t } from '../lib/i18n';

interface ProfileTabProps {
  contributors: Contributor[];
  settings: SettingsState;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ contributors, settings }) => {
  return (
    <div id="profile-tab-screen" className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 space-y-4 pb-24">
      {/* User Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 text-center shadow-xl relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 mx-auto flex items-center justify-center text-3xl font-black shadow-lg shadow-cyan-500/10 mb-3">
          🚗
        </div>

        <h2 className="text-lg font-bold text-white">Alex_Driver</h2>
        <div className="text-xs text-slate-400 mt-0.5">MapAi Road Guardian • Level 4</div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50">
            <div className="text-lg font-extrabold text-cyan-400">340</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Points</div>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50">
            <div className="text-lg font-extrabold text-amber-400">34</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Reports</div>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50">
            <div className="text-lg font-extrabold text-emerald-400">98%</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Accuracy</div>
          </div>
        </div>
      </div>

      {/* Leaderboard / Top Contributors */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{t('contributors', settings.language)}</span>
          </h3>
          <span className="text-xs text-cyan-400 font-semibold">Global Ranks</span>
        </div>

        <div className="space-y-2">
          {contributors.slice(0, 10).map((c, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            return (
              <div
                key={c.id || idx}
                className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-sm w-6 text-center text-amber-400">{medal}</span>
                  <div>
                    <div className="font-bold text-white text-sm">{c.name}</div>
                    <div className="text-slate-400 text-[11px]">{c.reports} confirmed reports</div>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-800/50 text-cyan-300 font-mono font-bold">
                  {c.points} pts
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
