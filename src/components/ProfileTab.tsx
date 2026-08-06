import React, { useState, useEffect } from 'react';
import { Contributor, SettingsState } from '../types';
import { Trophy, Mail, User, ShieldCheck, CheckCircle2, LogOut, KeyRound, Smartphone, Car, Bike, Sparkles, UserCheck, Bug, Code2, Plus, ThumbsUp, Lightbulb, Rocket } from 'lucide-react';
import { t } from '../lib/i18n';

interface ProfileTabProps {
  contributors: Contributor[];
  settings: SettingsState;
}

export interface UserProfileState {
  isLoggedIn: boolean;
  loginMethod: 'guest' | 'email';
  displayName: string;
  email: string;
  vehicleType: 'Car' | 'Motorcycle' | 'Maxim Rider' | 'Grab/Panda' | 'EV' | 'Taxi';
  vehicleEmoji: string;
  points: number;
  reportsCount: number;
}

interface BugReportItem {
  id: string;
  title: string;
  category: 'GPS / Map Glitch' | 'Audio / Voice Guide' | 'Route Calculation' | 'UI / Display' | 'Performance';
  reporter: string;
  status: 'OPEN' | 'IN_REVIEW' | 'FIXED_IN_BUILD';
  votes: number;
  date: string;
  description: string;
}

interface AiIdeaItem {
  id: string;
  title: string;
  creator: string;
  model: string;
  status: 'PLANNED' | 'IN_DEVELOPMENT' | 'PROPOSED';
  likes: number;
  description: string;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ contributors, settings }) => {
  const [profile, setProfile] = useState<UserProfileState>(() => {
    const saved = localStorage.getItem('mapai_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_e) {}
    }
    return {
      isLoggedIn: true,
      loginMethod: 'guest',
      displayName: 'Guest_Driver_448',
      email: '',
      vehicleType: 'Car',
      vehicleEmoji: '🚗',
      points: 240,
      reportsCount: 18
    };
  });

  const [activeSubView, setActiveSubView] = useState<'PROFILE' | 'RANKINGS' | 'BUG_REPORTS' | 'AI_BUILDER'>('PROFILE');
  const [rankingCategory, setRankingCategory] = useState<'POWER_USERS' | 'APP_CREATORS'>('POWER_USERS');

  // Bug Report State
  const [bugList, setBugList] = useState<BugReportItem[]>([
    {
      id: 'bug_1',
      title: 'Voice navigation repeats warning on sharp turns',
      category: 'Audio / Voice Guide',
      reporter: 'Fevian448',
      status: 'FIXED_IN_BUILD',
      votes: 14,
      date: '2026-08-04',
      description: 'Audio speech plays twice when recalculating route in mountain tunnels.'
    },
    {
      id: 'bug_2',
      title: 'Map tile flickering on fast zoom pinch',
      category: 'GPS / Map Glitch',
      reporter: 'Rider_Siti_KL',
      status: 'IN_REVIEW',
      votes: 8,
      date: '2026-08-05',
      description: 'OSM tile cache flickers slightly when changing orientation rapidly.'
    },
    {
      id: 'bug_3',
      title: 'Phone tracker density counter needs 2-sec debounce',
      category: 'Performance',
      reporter: 'Dev_Amir',
      status: 'OPEN',
      votes: 5,
      date: '2026-08-05',
      description: 'Updating active 50 phone cluster markers causes micro lag on low-end phones.'
    }
  ]);
  const [showBugModal, setShowBugModal] = useState(false);
  const [newBugTitle, setNewBugTitle] = useState('');
  const [newBugCategory, setNewBugCategory] = useState<BugReportItem['category']>('GPS / Map Glitch');
  const [newBugDesc, setNewBugDesc] = useState('');

  // AI Idea Hub State
  const [aiIdeas, setAiIdeas] = useState<AiIdeaItem[]>([
    {
      id: 'idea_1',
      title: 'AI Camera Vision: Auto-detect Potholes & Road Debris',
      creator: 'Fevian (Lead Creator)',
      model: 'Gemini 3.6 Flash + Vision',
      status: 'IN_DEVELOPMENT',
      likes: 42,
      description: 'Uses mobile camera feed during dashcam mode to auto-flag road hazards to MapAi backend.'
    },
    {
      id: 'idea_2',
      title: 'Live AI Audio Traffic DJ & Weather Host',
      creator: 'Antigravity AI Agent',
      model: 'ElevenLabs / Gemini Voice',
      status: 'PLANNED',
      likes: 29,
      description: 'Personalized radio DJ that summarizes traffic jams and local news in conversational Malay/English.'
    },
    {
      id: 'idea_3',
      title: 'Smart EV Battery & Charging Station AI Optimizer',
      creator: 'Rider_Community_Dev',
      model: 'Groq Llama 3.3',
      status: 'PROPOSED',
      likes: 18,
      description: 'Calculates exact battery depletion on high-elevation routes for Electric Vehicles.'
    }
  ]);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaModel, setNewIdeaModel] = useState('Gemini 3.6 Flash');
  const [newIdeaDesc, setNewIdeaDesc] = useState('');

  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  useEffect(() => {
    localStorage.setItem('mapai_user_profile', JSON.stringify(profile));
  }, [profile]);

  // Creators Leaderboard Data
  const appCreatorsList = [
    { rank: 1, name: 'Fevian (Lead Architect & Dev)', role: 'Founder & Fullstack Builder', points: 9850, contributions: 'Core Engine, Offline Maps, Socket.IO & Android Architecture', badge: '👑 OWNER' },
    { rank: 2, name: 'Google AI Studio Antigravity Agent', role: 'AI Code Co-Pilot', points: 8900, contributions: 'Real-time Radar, Gemini API, Multi-Model Router & UI', badge: '🤖 AI CORE' },
    { rank: 3, name: 'Gemini 3.6 Flash Model', role: 'AI Voice & Route Reasoning', points: 7400, contributions: 'Instant Voice Navigation & Natural Language Search', badge: '⚡ MODEL' },
    { rank: 4, name: 'OpenStreetMap & OSRM Community', role: 'Global Cartography Team', points: 6200, contributions: 'Open Map Tiles & Routing Network', badge: '🌍 MAP DATA' },
    { rank: 5, name: 'MapAi Open Source Contributors', role: 'Beta Testers & Code Reviewers', points: 4500, contributions: 'Bug Fixes, Localizations (Malay/Spanish/Arabic)', badge: '⭐ COMMUNITY' }
  ];

  // Power Users Leaderboard Data
  const powerUsersList = [
    { rank: 1, name: 'Captain_Rider_Panda', vehicle: '🛵 Motorcycle / Panda', points: 1420, reports: 112, badge: '🥇 LEGEND DRIVER' },
    { rank: 2, name: 'Siti_Maxim_Delivery', vehicle: '🚕 Maxim Taxi', points: 1180, reports: 89, badge: '🥈 MASTER NAVIGATOR' },
    { rank: 3, name: 'Fevian_Driver_448', vehicle: '🚗 Car', points: 940, reports: 65, badge: '🥉 PRO GUARDIAN' },
    { rank: 4, name: 'Ahmad_Truck_Logistics', vehicle: '🚚 Cargo Truck', points: 810, reports: 54, badge: 'HERO REPORT' },
    { rank: 5, name: 'EV_Driver_Johor', vehicle: '⚡ Electric EV', points: 690, reports: 42, badge: 'PATROL SCOUT' }
  ];

  const handleGuestLogin = () => {
    const name = inputName.trim() || `Guest_Driver_${Math.floor(100 + Math.random() * 900)}`;
    setProfile((prev) => ({
      ...prev,
      isLoggedIn: true,
      loginMethod: 'guest',
      displayName: name,
      email: ''
    }));
    setShowEmailForm(false);
    setAuthSuccessMsg('Logged in as Guest (No Email required). Enjoy live navigation!');
    setTimeout(() => setAuthSuccessMsg(''), 4000);
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim() || !inputEmail.includes('@')) {
      alert('Sila masukkan e-mel yang sah / Please enter a valid email address.');
      return;
    }
    const derivedName = inputName.trim() || inputEmail.split('@')[0];
    setProfile((prev) => ({
      ...prev,
      isLoggedIn: true,
      loginMethod: 'email',
      displayName: derivedName,
      email: inputEmail.trim(),
      points: prev.points + 50
    }));
    setShowEmailForm(false);
    setAuthSuccessMsg(`Akaun e-mel [${inputEmail}] berjaya disambungkan! (+50 Bonus Pts)`);
    setTimeout(() => setAuthSuccessMsg(''), 4000);
  };

  const handleLogoutToGuest = () => {
    setProfile((prev) => ({
      ...prev,
      loginMethod: 'guest',
      email: '',
      displayName: `Guest_Rider_${Math.floor(100 + Math.random() * 900)}`
    }));
    setAuthSuccessMsg('Tukar ke mod Tetamu (Tanpa e-mel).');
    setTimeout(() => setAuthSuccessMsg(''), 3000);
  };

  const handleSubmitBug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBugTitle.trim()) return;

    const newBug: BugReportItem = {
      id: `bug_${Date.now()}`,
      title: newBugTitle.trim(),
      category: newBugCategory,
      reporter: profile.displayName || 'User',
      status: 'OPEN',
      votes: 1,
      date: new Date().toISOString().split('T')[0],
      description: newBugDesc.trim() || 'No additional details provided.'
    };

    setBugList((prev) => [newBug, ...prev]);
    setShowBugModal(false);
    setNewBugTitle('');
    setNewBugDesc('');
    setAuthSuccessMsg('Laporan Bug berjaya dihantar! Terima kasih atas bantuan anda.');
    setTimeout(() => setAuthSuccessMsg(''), 4000);
  };

  const handleSubmitIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaTitle.trim()) return;

    const newIdea: AiIdeaItem = {
      id: `idea_${Date.now()}`,
      title: newIdeaTitle.trim(),
      creator: profile.displayName || 'AI Dev',
      model: newIdeaModel,
      status: 'PROPOSED',
      likes: 1,
      description: newIdeaDesc.trim() || 'Cadangan integrasi AI untuk MapAi.'
    };

    setAiIdeas((prev) => [newIdea, ...prev]);
    setShowIdeaModal(false);
    setNewIdeaTitle('');
    setNewIdeaDesc('');
    setAuthSuccessMsg('Idea AI baru berjaya didaftarkan dalam Hub!');
    setTimeout(() => setAuthSuccessMsg(''), 4000);
  };

  const vehicles = [
    { type: 'Car' as const, emoji: '🚗', label: 'Kereta / Car' },
    { type: 'Motorcycle' as const, emoji: '🏍️', label: 'Motosikal' },
    { type: 'Maxim Rider' as const, emoji: '🛵', label: 'Maxim / Delivery' },
    { type: 'Grab/Panda' as const, emoji: '🍔', label: 'Food Delivery' },
    { type: 'EV' as const, emoji: '⚡', label: 'Electric EV' },
    { type: 'Taxi' as const, emoji: '🚕', label: 'Teksi / E-Hailing' }
  ];

  return (
    <div id="profile-tab-screen" className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 space-y-4 pb-24">
      {/* Toast Notification */}
      {authSuccessMsg && (
        <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{authSuccessMsg}</span>
        </div>
      )}

      {/* Top Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveSubView('PROFILE')}
          className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubView === 'PROFILE'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Akaun Saya</span>
        </button>

        <button
          onClick={() => setActiveSubView('RANKINGS')}
          className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubView === 'RANKINGS'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Ranking Board</span>
        </button>

        <button
          onClick={() => setActiveSubView('BUG_REPORTS')}
          className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubView === 'BUG_REPORTS'
              ? 'bg-red-500 text-white shadow-md font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bug className="w-3.5 h-3.5 text-red-400" />
          <span>Lapor Bug</span>
        </button>

        <button
          onClick={() => setActiveSubView('AI_BUILDER')}
          className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubView === 'AI_BUILDER'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-950" />
          <span>AI Builders Hub</span>
        </button>
      </div>

      {/* VIEW 1: USER PROFILE & SETTINGS */}
      {activeSubView === 'PROFILE' && (
        <div className="space-y-4">
          {/* Main Profile Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 text-center shadow-xl relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span
                className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full border ${
                  profile.loginMethod === 'email'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-amber-500/20 border-amber-500 text-amber-300'
                }`}
              >
                {profile.loginMethod === 'email' ? '📧 Email Verified' : '👤 Guest Mode (Tanpa E-mel)'}
              </span>
            </div>

            <div className="w-20 h-20 rounded-3xl bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 mx-auto flex items-center justify-center text-4xl shadow-lg shadow-cyan-500/10 mb-3 mt-2">
              {profile.vehicleEmoji}
            </div>

            <h2 className="text-xl font-black text-white">{profile.displayName}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {profile.email ? profile.email : 'Akaun Tetamu • MapAi Guardian Level 4'}
            </p>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800">
              <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50">
                <div className="text-lg font-extrabold text-cyan-400">{profile.points}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Points</div>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50">
                <div className="text-lg font-extrabold text-amber-400">{profile.reportsCount}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Reports</div>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50">
                <div className="text-lg font-extrabold text-emerald-400">99%</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Accuracy</div>
              </div>
            </div>
          </div>

          {/* Login Options Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs uppercase font-black text-slate-200 tracking-wider">
                  Tetapan Log Masuk / Login Mode
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Pilihan / Optional</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleLogoutToGuest}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                  profile.loginMethod === 'guest'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <User className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold">Tanpa E-mel (Guest)</span>
                <span className="text-[9px] text-slate-400">Guna serta-merta tanpa daftar</span>
              </button>

              <button
                onClick={() => setShowEmailForm(true)}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                  profile.loginMethod === 'email'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Mail className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold">Log Masuk E-mel</span>
                <span className="text-[9px] text-slate-400">Simpan markah & penyelarasan</span>
              </button>
            </div>

            {showEmailForm && (
              <form onSubmit={handleEmailLogin} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>Daftar / Sambung dengan E-Mel</span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Alamat E-mel / Email Address
                  </label>
                  <input
                    type="email"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="contoh: fevian448@gmail.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Nama Pemandu / Driver Handle
                  </label>
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="e.g. Captain_Pemandu"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 shadow-md"
                  >
                    Sahkan E-mel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Vehicle Picker */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <h3 className="text-xs uppercase font-black text-slate-200 tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-cyan-400" />
              <span>Jenis Kenderaan Dalam Peta Live</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {vehicles.map((v) => (
                <button
                  key={v.type}
                  onClick={() =>
                    setProfile((prev) => ({
                      ...prev,
                      vehicleType: v.type,
                      vehicleEmoji: v.emoji
                    }))
                  }
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    profile.vehicleType === v.type
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold ring-1 ring-cyan-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-2xl">{v.emoji}</span>
                  <span className="text-[10px] font-semibold text-center leading-tight">{v.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DUAL RANKINGS LEADERBOARD */}
      {activeSubView === 'RANKINGS' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-amber-950/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Papan Markah & Ranking MapAi</h2>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                LIVE SEASON 2026
              </span>
            </div>

            {/* Ranking Sub-Category Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setRankingCategory('POWER_USERS')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  rankingCategory === 'POWER_USERS'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Pengguna Setia / Pemandu</span>
              </button>

              <button
                onClick={() => setRankingCategory('APP_CREATORS')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  rankingCategory === 'APP_CREATORS'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Pembuat Aplikasi / Devs</span>
              </button>
            </div>
          </div>

          {/* Ranking Category 1: Pengguna Setia (Power Users) */}
          {rankingCategory === 'POWER_USERS' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 px-1">
                Pemandu & Rider yang kerap menggunakan aplikasi, melaporkan info trafik, dan membantu pengguna lain.
              </p>
              {powerUsersList.map((usr) => (
                <div
                  key={usr.rank}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 font-black text-sm text-amber-400 flex items-center justify-center shrink-0">
                      #{usr.rank}
                    </span>
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm text-white flex items-center gap-2 truncate">
                        <span>{usr.name}</span>
                        <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono font-bold border border-cyan-500/30">
                          {usr.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{usr.vehicle}</span>
                        <span>•</span>
                        <span>{usr.reports} laporan terbukti</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-black text-xs shrink-0 shadow">
                    {usr.points} PTS
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ranking Category 2: Pembuat Aplikasi & AI Architects */}
          {rankingCategory === 'APP_CREATORS' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 px-1">
                Arkitekter, pembangun perisian, dan model AI yang menjayakan projek MapAi Android & Web Application.
              </p>
              {appCreatorsList.map((creator) => (
                <div
                  key={creator.rank}
                  className="bg-slate-900 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-500/40 font-black text-sm text-amber-300 flex items-center justify-center shrink-0">
                      #{creator.rank}
                    </span>
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm text-white flex items-center gap-2 truncate">
                        <span>{creator.name}</span>
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold border border-amber-500/30">
                          {creator.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        {creator.role} • <span className="text-slate-400">{creator.contributions}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-amber-950 border border-amber-800 text-amber-300 font-mono font-black text-xs shrink-0 shadow">
                    {creator.points} PTS
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: BUG REPORT MODULE */}
      {activeSubView === 'BUG_REPORTS' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border border-red-500/40 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Bug className="w-5 h-5 text-red-400" />
                <span>Modul Laporan Bug & Isu Aplikasi</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Temui kesilapan peta, audio, atau ralat laluan? Laporkan di sini untuk pembaikan serta-merta!
              </p>
            </div>
            <button
              onClick={() => setShowBugModal(true)}
              className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shrink-0 flex items-center gap-1 shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Hantar Bug</span>
            </button>
          </div>

          {/* Modal Form Hantar Bug */}
          {showBugModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-red-500/60 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Bug className="w-5 h-5 text-red-400" />
                    <h2 className="text-sm font-bold text-white">Lapor Bug / Ralat Sistem</h2>
                  </div>
                  <button onClick={() => setShowBugModal(false)} className="text-slate-400 hover:text-white text-sm font-bold">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitBug} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Tajuk / Ringkasan Bug *</label>
                    <input
                      type="text"
                      required
                      value={newBugTitle}
                      onChange={(e) => setNewBugTitle(e.target.value)}
                      placeholder="Contoh: Suara panduan navigasi terputus ketika dalam terowong..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Kategori Bug</label>
                    <select
                      value={newBugCategory}
                      onChange={(e) => setNewBugCategory(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
                    >
                      <option value="GPS / Map Glitch">🗺️ GPS / Peta Terkeluar Laluan</option>
                      <option value="Audio / Voice Guide">🔊 Audio / Suara Panduan</option>
                      <option value="Route Calculation">🚦 Pengiraan Laluan / Trafik</option>
                      <option value="UI / Display">📱 Paparan Skrin / UI Bug</option>
                      <option value="Performance">⚡ Keperlahanan / Performance Lag</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Butiran & Cara Mengulang Ralat</label>
                    <textarea
                      rows={3}
                      value={newBugDesc}
                      onChange={(e) => setNewBugDesc(e.target.value)}
                      placeholder="Terangkan masalah yang berlaku..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBugModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg"
                    >
                      Hantar Laporan Bug
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* List Bug Reports */}
          <div className="space-y-3">
            {bugList.map((b) => (
              <div key={b.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-2 shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>{b.title}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      b.status === 'FIXED_IN_BUILD'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : b.status === 'IN_REVIEW'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-red-950 text-red-400 border-red-800'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{b.description}</p>

                <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                  <div>
                    <span>Pelapor: <strong className="text-slate-200">{b.reporter}</strong></span> • <span>{b.category}</span>
                  </div>
                  <button
                    onClick={() => {
                      setBugList((prev) =>
                        prev.map((item) => (item.id === b.id ? { ...item, votes: item.votes + 1 } : item))
                      );
                    }}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-200 transition-all active:scale-95"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sahkan Bug ({b.votes})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: AI BUILDER OPPORTUNITY & IDEAS HUB */}
      {activeSubView === 'AI_BUILDER' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-indigo-950/90 border border-amber-500/50 rounded-3xl p-5 shadow-2xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-2xl shadow-lg">
                  🤖
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
                    <span>AI Studio Builders Hub & AI Opportunity</span>
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  </h2>
                  <p className="text-xs text-slate-300">
                    Aplikasi MapAi dibina menggunakan Google Gemini 3.6 Flash, Antigravity AI Agent & Open API.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIdeaModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 flex items-center gap-1 shadow-lg transition-all active:scale-95"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Cadang Idea AI</span>
              </button>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-amber-500/30 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1">
                <Rocket className="w-4 h-4" />
                <span>Mencari Pembuat AI / AI Developers?</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Adakah anda seorang pembangun AI, pereka model LLM, atau pencipta prompt? Anda boleh menyumbang idea atau menyertai pasukan pembuat MapAi secara terus!
              </p>
            </div>
          </div>

          {/* Modal Form Submit Idea */}
          {showIdeaModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-amber-500/60 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h2 className="text-sm font-bold text-white">Cadangkan Idea Ciri AI Baru</h2>
                  </div>
                  <button onClick={() => setShowIdeaModal(false)} className="text-slate-400 hover:text-white text-sm font-bold">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitIdea} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Tajuk Cadangan Idea AI *</label>
                    <input
                      type="text"
                      required
                      value={newIdeaTitle}
                      onChange={(e) => setNewIdeaTitle(e.target.value)}
                      placeholder="Contoh: Pengesan Lubang Jalan Automatik Menggunakan Kamera AI..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Model / Teknologi AI Digunakan</label>
                    <input
                      type="text"
                      value={newIdeaModel}
                      onChange={(e) => setNewIdeaModel(e.target.value)}
                      placeholder="e.g. Gemini 3.6 Flash, Groq, DeepSeek, OpenCV"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Butiran Penjelasan Idea</label>
                    <textarea
                      rows={3}
                      value={newIdeaDesc}
                      onChange={(e) => setNewIdeaDesc(e.target.value)}
                      placeholder="Bagaimana ciri AI ini membantu pemandu & pembuat aplikasi..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowIdeaModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg"
                    >
                      Hantar Idea AI
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* List AI Ideas */}
          <div className="space-y-3">
            {aiIdeas.map((idea) => (
              <div key={idea.id} className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 space-y-2 shadow-md transition-all">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-sm text-white">{idea.title}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      idea.status === 'IN_DEVELOPMENT'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : idea.status === 'PLANNED'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {idea.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{idea.description}</p>

                <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                  <div>
                    <span>Dicadang oleh: <strong className="text-amber-300">{idea.creator}</strong></span> • <span>Model: {idea.model}</span>
                  </div>
                  <button
                    onClick={() => {
                      setAiIdeas((prev) =>
                        prev.map((item) => (item.id === idea.id ? { ...item, likes: item.likes + 1 } : item))
                      );
                    }}
                    className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sokong Idea ({idea.likes})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

