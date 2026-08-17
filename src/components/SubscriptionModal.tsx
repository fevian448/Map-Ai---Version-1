import React, { useState } from 'react';
import { UserSubscriptionTier, SubscriptionState } from '../types';
import { Sparkles, CheckCircle2, ShieldCheck, Zap, Crown, ArrowRight, X, Star, CreditCard, Flame, Check } from 'lucide-react';
import { upgradeUserTier } from '../services/api';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: SubscriptionState;
  onSubscriptionChange: (newSub: SubscriptionState) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onSubscriptionChange
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleUpgrade = async (targetTier: UserSubscriptionTier) => {
    setLoading(true);
    const res = await upgradeUserTier('default_user', targetTier);
    if (res.ok) {
      onSubscriptionChange({
        ...subscription,
        tier: res.tier,
        dailyQueriesLimit: res.tier === 'FREE' ? 15 : 999999,
        proExpiryDate: '2027-12-31'
      });
      setSuccessMsg(res.message || `Berjaya dinaik taraf ke ${res.tier}!`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-4 sm:p-6 text-slate-100 shadow-2xl relative my-auto animate-in zoom-in-95 duration-150 space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge & Title */}
        <div className="text-center space-y-1 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-cyan-500/20 border border-amber-500/30 text-amber-300 text-xs font-black tracking-wide uppercase">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>MapAi Pelan & Langganan Pintar</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Pilih Pelan Yang Sesuai Untuk Navigasi Anda
          </h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Buka kuasa penuh model AI Gemini Pro, analisis geospatial lokasi perniagaan, kuota pertanyaan tanpa had, dan audio suara turn-by-turn.
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Tahunan</span>
              <span className="px-1.5 py-0.2 text-[9px] bg-slate-950 text-amber-300 rounded font-mono">
                JIMAT 30%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Plan 1: Free Tier */}
          <div className={`rounded-2xl p-4 border flex flex-col justify-between transition-all ${
            subscription.tier === 'FREE'
              ? 'bg-slate-950/90 border-slate-700 ring-1 ring-slate-600'
              : 'bg-slate-950/60 border-slate-800/80'
          }`}>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-sm text-slate-200">Free Tier</div>
                {subscription.tier === 'FREE' && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
                    PELAN SEMASA
                  </span>
                )}
              </div>

              <div>
                <span className="text-2xl font-black text-white">RM 0</span>
                <span className="text-xs text-slate-400"> / selamanya</span>
              </div>

              <p className="text-[11px] text-slate-400">
                Sesuai untuk pemanduan harian dan navigasi asas peta.
              </p>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>15 Kuota Pertanyaan AI / Hari</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Model Gemini 3.7 Flash</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Peta Langsung & Laporan Trafik</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Mod Tetamu Tanpa Daftar</span>
                </div>
              </div>
            </div>

            <button
              disabled={subscription.tier === 'FREE'}
              onClick={() => handleUpgrade('FREE')}
              className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 text-xs font-bold transition-all"
            >
              {subscription.tier === 'FREE' ? 'Pelan Aktif' : 'Tukar ke Percuma'}
            </button>
          </div>

          {/* Plan 2: Pro Tier */}
          <div className="rounded-2xl p-4 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/80 flex flex-col justify-between relative shadow-xl">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black tracking-wider uppercase shadow">
              PALING POPULAR 🔥
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-sm text-amber-300 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>MapAi PRO 💎</span>
                </div>
                {subscription.tier === 'PRO' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                    PELAN AKTIF
                  </span>
                )}
              </div>

              <div>
                <span className="text-2xl font-black text-white">
                  {billingCycle === 'yearly' ? 'RM 149' : 'RM 19'}
                </span>
                <span className="text-xs text-slate-400">
                  {billingCycle === 'yearly' ? ' / tahun (RM12.40/bln)' : ' / bulan'}
                </span>
              </div>

              <p className="text-[11px] text-amber-200/80">
                Pakej lengkap untuk pemandu profesional, peniaga & pengguna kuasa.
              </p>

              <div className="space-y-1.5 pt-2 border-t border-amber-500/30 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-bold text-amber-300">Kuota AI Tanpa Had (Unlimited)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Google Gemini Pro & Geospatial Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Analisis Foot-Traffic & Demografi Kawasan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Eksport Laporan Data (CSV, JSON, PDF)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>AI Voice Turn-by-Turn Pintar & SOS Priority</span>
                </div>
              </div>
            </div>

            <button
              disabled={loading || subscription.tier === 'PRO'}
              onClick={() => handleUpgrade('PRO')}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-60 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>{subscription.tier === 'PRO' ? 'Pelan PRO Sedang Aktif' : '⚡ Aktifkan MapAi PRO Sekarang'}</span>
            </button>
          </div>
        </div>

        {/* Enterprise Card Mini */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold">
              🏢
            </div>
            <div>
              <div className="font-bold text-white">MapAi Enterprise & Fleet Logistics</div>
              <div className="text-[11px] text-slate-400">Pengurusan armada syarikat, API tersuai & laporan analitik berskala besar.</div>
            </div>
          </div>
          <button
            onClick={() => handleUpgrade('ENTERPRISE')}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0"
          >
            Aktifkan Enterprise
          </button>
        </div>
      </div>
    </div>
  );
};
