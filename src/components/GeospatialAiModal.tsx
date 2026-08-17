import React, { useState } from 'react';
import { GeoPoint, GeospatialAnalysisResult, SubscriptionState } from '../types';
import { Sparkles, MapPin, Download, FileText, TrendingUp, Users, Shield, Store, RefreshCw, X, CheckCircle2, Lock } from 'lucide-react';
import { fetchGeospatialAnalysis } from '../services/api';

interface GeospatialAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: GeoPoint;
  subscription: SubscriptionState;
  onOpenUpgradeModal: () => void;
}

export const GeospatialAiModal: React.FC<GeospatialAiModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  subscription,
  onOpenUpgradeModal
}) => {
  const [targetLocation, setTargetLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeospatialAnalysisResult | null>(null);
  const [exportNotice, setExportNotice] = useState('');

  if (!isOpen) return null;

  const isPro = subscription.tier === 'PRO' || subscription.tier === 'ENTERPRISE';

  const handleRunAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    const loc = targetLocation.trim() || 'Lokasi Semasa Pengguna';
    const data = await fetchGeospatialAnalysis(loc, userLocation, 'default_user');
    setResult(data);
    setLoading(false);
  };

  const handleExport = (format: 'JSON' | 'CSV' | 'TXT') => {
    if (!result) return;

    let content = '';
    let mimeType = 'text/plain';
    let filename = `MapAi_Geospatial_Report_${Date.now()}`;

    if (format === 'JSON') {
      content = JSON.stringify(result, null, 2);
      mimeType = 'application/json';
      filename += '.json';
    } else if (format === 'CSV') {
      mimeType = 'text/csv';
      filename += '.csv';
      content = `Lokasi,Skor Foot Traffic,Tahap Hotspot Komersial,Indeks Keselamatan Jalan,Kepadatan Pesaing,Tarikh Laporan\n"${result.locationName}",${result.footTrafficScore},"${result.commercialHotspotLevel}",${result.safetyAndRoadIndex},"${result.competitorDensity}","${new Date(result.generatedAt).toLocaleString()}"`;
    } else {
      mimeType = 'text/plain';
      filename += '.txt';
      content = `========================================
LAPORAN KECERDASAN GEOSPATIAL & BISNES MAP-AI
========================================
Lokasi: ${result.locationName}
Skor Aliran Foot-Traffic: ${result.footTrafficScore}/100
Tahap Hotspot: ${result.commercialHotspotLevel}
Indeks Keselamatan: ${result.safetyAndRoadIndex}/100
Kepadatan Pesaing: ${result.competitorDensity}
Rumusan Demografi: ${result.demographicSummary}
Jenis Perniagaan Disyorkan: ${result.recommendedBusinessTypes.join(', ')}

--- LAPORAN PENUH AI GEMINI ---
${result.fullAiReport}
========================================`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    setExportNotice(`Laporan ${format} berjaya dieksport & dimuat turun!`);
    setTimeout(() => setExportNotice(''), 3500);
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-4 sm:p-6 text-slate-100 shadow-2xl relative my-auto animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Kecerdasan Geospatial & Bisnes AI</span>
          </div>
          <h2 className="text-xl font-black text-white">
            Analisis Lokasi, Demografi & Aliran Trafik Pintar
          </h2>
          <p className="text-xs text-slate-300">
            Kaji potensi komersial, kepadatan pelanggan, dan risiko keselamatan mana-mana kawasan dengan model Gemini Pro.
          </p>
        </div>

        {/* Export Toast */}
        {exportNotice && (
          <div className="bg-emerald-950 border border-emerald-500 text-emerald-300 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Search Input */}
        <form onSubmit={handleRunAnalysis} className="flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
              placeholder="Masukkan nama kawasan / stesen / jalan (atau biarkan kosong untuk lokasi semasa)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shrink-0 shadow transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Menganalisis...' : 'Jana Analisis'}</span>
          </button>
        </form>

        {/* Analysis Results View */}
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
          {result ? (
            <div className="space-y-3">
              {/* Score Cards Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                  <div className="text-xl font-black text-cyan-400">{result.footTrafficScore}/100</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5 flex items-center justify-center gap-1">
                    <TrendingUp className="w-3 h-3 text-cyan-400" />
                    <span>Foot Traffic</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                  <div className="text-xl font-black text-amber-400">{result.commercialHotspotLevel}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5 flex items-center justify-center gap-1">
                    <Store className="w-3 h-3 text-amber-400" />
                    <span>Hotspot Bisnes</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                  <div className="text-xl font-black text-emerald-400">{result.safetyAndRoadIndex}/100</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5 flex items-center justify-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>Keselamatan</span>
                  </div>
                </div>
              </div>

              {/* Recommended Business Tags */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="text-xs font-bold text-slate-300">Peluang & Jenis Perniagaan Disyorkan:</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.recommendedBusinessTypes.map((t, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 text-[11px] font-semibold">
                      ✨ {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Full AI Report Body */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs leading-relaxed text-slate-200">
                <div className="font-extrabold text-white text-sm flex items-center justify-between border-b border-slate-800 pb-2">
                  <span>Laporan Terperinci AI Gemini</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(result.generatedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="whitespace-pre-line text-xs sm:text-sm font-normal text-slate-300">
                  {result.fullAiReport}
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center justify-between gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Eksport Laporan:</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleExport('CSV')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
                  >
                    CSV (Excel)
                  </button>
                  <button
                    onClick={() => handleExport('JSON')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
                  >
                    JSON Raw
                  </button>
                  <button
                    onClick={() => handleExport('TXT')}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors"
                  >
                    Teks / Print
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
              <div className="text-sm font-bold text-white">Sedia Untuk Analisis Geospatial</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Ketik nama lokasi atau tekan butang di atas untuk menjana analisis AI mengenai potensi pasaran dan trafik setempat.
              </p>
              <button
                onClick={() => handleRunAnalysis()}
                className="mt-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md"
              >
                Analisis Lokasi Semasa Sekarang
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
