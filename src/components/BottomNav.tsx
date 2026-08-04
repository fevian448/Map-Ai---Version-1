import React from 'react';
import { Map, ShieldAlert, Gauge, Compass, Bot, Siren, User, Settings } from 'lucide-react';
import { SettingsState } from '../types';
import { t } from '../lib/i18n';

export type TabKey = 'map' | 'alerts' | 'drive' | 'explore' | 'chat' | 'sos' | 'profile' | 'settings';

interface BottomNavProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  settings: SettingsState;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, settings }) => {
  const navItems: { key: TabKey; labelKey: string; icon: React.ReactNode }[] = [
    { key: 'map', labelKey: 'nav_map', icon: <Map className="w-5 h-5" /> },
    { key: 'alerts', labelKey: 'nav_alerts', icon: <ShieldAlert className="w-5 h-5" /> },
    { key: 'drive', labelKey: 'nav_drive', icon: <Gauge className="w-5 h-5" /> },
    { key: 'explore', labelKey: 'nav_explore', icon: <Compass className="w-5 h-5" /> },
    { key: 'chat', labelKey: 'nav_chat', icon: <Bot className="w-5 h-5" /> },
    { key: 'sos', labelKey: 'nav_sos', icon: <Siren className="w-5 h-5 text-red-400" /> },
    { key: 'profile', labelKey: 'nav_profile', icon: <User className="w-5 h-5" /> },
    { key: 'settings', labelKey: 'nav_settings', icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <div id="bottom-navigation-bar" className="fixed bottom-0 left-0 right-0 z-[1500] bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-1 py-1.5 shadow-2xl">
      <div className="max-w-4xl mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              id={`nav-tab-${item.key}`}
              key={item.key}
              onClick={() => onSelectTab(item.key)}
              className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl transition-all ${
                isActive
                  ? 'text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`${isActive ? 'scale-110' : ''} transition-transform`}>
                {item.icon}
              </div>
              <span className="text-[10px] leading-none whitespace-nowrap">
                {t(item.labelKey, settings.language)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
