import React, { useState } from 'react';
import { GeoPoint, SettingsState } from '../types';
import { ShieldAlert, Volume2, VolumeX, PhoneCall, UserPlus, Send, Radio } from 'lucide-react';
import { startSirenSound, stopSirenSound } from '../lib/audio';
import { sendSosAlert } from '../services/api';
import { t } from '../lib/i18n';

interface SosTabProps {
  userLocation: GeoPoint;
  settings: SettingsState;
}

export const SosTab: React.FC<SosTabProps> = ({ userLocation, settings }) => {
  const [sirenActive, setSirenActive] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [contacts, setContacts] = useState<string[]>(['+1 (555) 019-2834', '911 / Emergency Services']);
  const [newContact, setNewContact] = useState('');
  const [fakeCallActive, setFakeCallActive] = useState(false);

  const toggleSiren = () => {
    if (sirenActive) {
      stopSirenSound();
      setSirenActive(false);
    } else {
      startSirenSound();
      setSirenActive(true);
    }
  };

  const handleBroadcastSos = async () => {
    setSosSent(true);
    await sendSosAlert('You', userLocation, 'EMERGENCY SOS: Require immediate road assistance!');
    setTimeout(() => setSosSent(false), 5000);
  };

  const addContactHandler = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContact.trim()) {
      setContacts([...contacts, newContact.trim()]);
      setNewContact('');
    }
  };

  return (
    <div id="sos-tab-screen" className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 space-y-5 pb-24">
      {/* Huge Panic Emergency Button */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-slate-950 border border-red-600/80 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
        <div className="text-xs uppercase font-extrabold tracking-widest text-red-400 mb-3 flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
          <span>{t('emergency_sos', settings.language)}</span>
        </div>

        <button
          onClick={handleBroadcastSos}
          className="w-36 h-36 mx-auto rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-red-500 border-4 border-red-300 shadow-2xl shadow-red-600/50 flex flex-col items-center justify-center text-white active:scale-95 transition-transform my-2 group cursor-pointer"
        >
          <Radio className="w-10 h-10 animate-ping group-hover:animate-none" />
          <span className="font-black text-lg tracking-wider mt-1">BROADCAST</span>
        </button>

        <p className="text-xs text-red-200 mt-3 max-w-xs mx-auto leading-relaxed">
          {t('sos_description', settings.language)}
        </p>

        {sosSent && (
          <div className="mt-4 p-3 bg-red-500 border border-red-400 rounded-xl text-xs font-bold text-white animate-bounce">
            ✓ LIVE SOS BROADCAST SENT TO NEARBY DRIVERS & CONTACTS
          </div>
        )}
      </div>

      {/* Quick Tools: Siren & Fake Call */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={toggleSiren}
          className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 font-bold text-xs transition-all shadow-lg ${
            sirenActive
              ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
              : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
          }`}
        >
          {sirenActive ? <VolumeX className="w-7 h-7 text-amber-400" /> : <Volume2 className="w-7 h-7 text-amber-400" />}
          <span>{sirenActive ? 'Stop Loud Siren' : t('siren_alert', settings.language)}</span>
        </button>

        <button
          onClick={() => setFakeCallActive(!fakeCallActive)}
          className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 font-bold text-xs transition-all shadow-lg ${
            fakeCallActive
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
              : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
          }`}
        >
          <PhoneCall className="w-7 h-7 text-cyan-400" />
          <span>{fakeCallActive ? 'Dismiss Fake Call' : t('fake_call', settings.language)}</span>
        </button>
      </div>

      {/* Fake Call Modal / Overlay */}
      {fakeCallActive && (
        <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl p-5 text-center shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center mb-2">
            <PhoneCall className="w-8 h-8 animate-bounce" />
          </div>
          <div className="text-sm font-extrabold text-white">Incoming Emergency Call...</div>
          <div className="text-xs text-slate-400 mt-0.5">Police Dispatch Center</div>
          <div className="flex gap-2 justify-center mt-4">
            <button
              onClick={() => setFakeCallActive(false)}
              className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs"
            >
              Decline
            </button>
            <button
              onClick={() => alert('Simulated call connected: "Police dispatch, what is your emergency?"')}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              Answer
            </button>
          </div>
        </div>
      )}

      {/* Emergency Contacts List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-cyan-400" />
          <span>Emergency Contacts</span>
        </h3>

        <div className="space-y-2">
          {contacts.map((c, idx) => (
            <div key={idx} className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between text-xs font-semibold text-slate-200">
              <span>{c}</span>
              <span className="text-emerald-400 text-[10px] uppercase font-bold">SMS Ready</span>
            </div>
          ))}
        </div>

        <form onSubmit={addContactHandler} className="flex gap-2 pt-1">
          <input
            type="text"
            value={newContact}
            onChange={(e) => setNewContact(e.target.value)}
            placeholder="Add phone number..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
};
