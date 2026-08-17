import React, { useState, useEffect } from 'react';
import { TrafficAlert, AlertTypeKey, ALERT_TYPES, SettingsState, EarthquakeFeedItem, EarthquakeFeedResponse } from '../types';
import { ThumbsUp, Plus, ShieldAlert, Clock, MapPin, Activity, Waves, Droplets, ShieldCheck, Download, ExternalLink, Code, Search, RefreshCw, AlertTriangle, ChevronRight, Globe, Layers, BookOpen } from 'lucide-react';
import { t } from '../lib/i18n';
import { fetchLiveEarthquakes, fetchWaterData } from '../services/api';

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
  const [activeSubTab, setActiveSubTab] = useState<'traffic' | 'earthquake' | 'water'>('traffic');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Earthquake Feeds State
  const [earthquakeFeed, setEarthquakeFeed] = useState<EarthquakeFeedResponse | null>(null);
  const [eqMinMag, setEqMinMag] = useState<number>(0);
  const [eqSearchQuery, setEqSearchQuery] = useState<string>('');
  const [eqLoading, setEqLoading] = useState<boolean>(false);
  const [selectedFormat, setSelectedFormat] = useState<'geojson' | 'atom' | 'kml' | 'csv' | 'quakeml'>('geojson');
  const [showDeveloperModal, setShowDeveloperModal] = useState<boolean>(false);

  // Water & Flood Telemetry State
  const [waterTelemetry, setWaterTelemetry] = useState<any>(null);

  const loadEarthquakeData = async (minMag = eqMinMag) => {
    setEqLoading(true);
    try {
      const data = await fetchLiveEarthquakes(minMag, undefined, 30);
      setEarthquakeFeed(data);
    } catch (_e) {
    } finally {
      setEqLoading(false);
    }
  };

  useEffect(() => {
    loadEarthquakeData();
    fetchWaterData().then((w) => setWaterTelemetry(w));
  }, []);

  const handleMinMagChange = (mag: number) => {
    setEqMinMag(mag);
    loadEarthquakeData(mag);
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filterType === 'ALL') return true;
    return alert.type === filterType;
  });

  const filteredEarthquakes = (earthquakeFeed?.items || []).filter((item) => {
    if (!eqSearchQuery.trim()) return true;
    const q = eqSearchQuery.toLowerCase();
    return item.place.toLowerCase().includes(q) || item.title.toLowerCase().includes(q) || item.severityLevel.toLowerCase().includes(q);
  });

  const getTimeAgo = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins}m lalu`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h lalu`;
    const days = Math.floor(hrs / 24);
    return `${days}d lalu`;
  };

  return (
    <div id="alerts-tab-screen" className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <span>{t('nav_alerts', settings.language)} & Amaran Keselamatan</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pusat Pemberitahuan Masa Nyata & Telemetri Bahaya Semula Jadi
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t('report_here', settings.language)}</span>
        </button>
      </div>

      {/* Main Alert Category Switcher Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-xl">
        <button
          onClick={() => setActiveSubTab('traffic')}
          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'traffic'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span>🚦</span>
          <span>Trafik ({alerts.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('earthquake')}
          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'earthquake'
              ? 'bg-rose-500 text-white shadow-md font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>Gempa Bumi ({earthquakeFeed?.count || 0})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('water')}
          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'water'
              ? 'bg-blue-500 text-white shadow-md font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          <span>Air & Banjir</span>
        </button>
      </div>

      {/* SUBTAB 1: TRAFFIC ALERTS */}
      {activeSubTab === 'traffic' && (
        <div className="space-y-4">
          {/* Auto Phone Tracker Density Alert Banner */}
          {!isBannerDismissed && (
            <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/80 border border-red-500/50 rounded-2xl p-3 text-xs text-slate-200 space-y-1 shadow-lg">
              <div className="font-bold text-amber-300 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">📱</span>
                  <span>Sistem Pengesanan Ketumpatan Telefon Pintar (Auto Alert)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded text-[10px] font-mono border border-red-500/40">
                    Standard 40 - 50 Telefon
                  </span>
                  <button
                    onClick={() => setIsBannerDismissed(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-0.5 rounded text-[10px] font-bold border border-slate-600 transition-all flex items-center gap-1"
                    title="Tutup banner ini"
                  >
                    <span>Skip</span>
                    <span>✕</span>
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Apabila kelompok peranti penjejak mencapai <strong>40 hingga 50 peranti aktif</strong> di laluan yang sama, MapAi mengesahkan kesesakan teruk dan menyiarkan amaran segera kepada semua pemandu.
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
              Semua ({alerts.length})
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
                <p className="text-sm font-semibold">Tiada laporan trafik aktif berdekatan</p>
                <p className="text-xs text-slate-500 mt-1">Jadilah yang pertama melaporkan bahaya atau sekatan jalan raya!</p>
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
                          {alert.confidence}% keyakinan
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
                        <span className="text-emerald-400 font-semibold">{alert.confirmedBy} pengesahan</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onConfirmAlert(alert.id)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-400 border border-slate-700/80 text-slate-300 transition-colors flex items-center gap-1"
                      title="Sahkan amaran ini"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: USGS EARTHQUAKE NOTIFICATION & REAL-TIME SEISMIC CENTER */}
      {activeSubTab === 'earthquake' && (
        <div className="space-y-4">
          {/* Main ENS Hero Card */}
          <div className="bg-gradient-to-br from-rose-950/90 via-slate-900 to-red-950/90 border border-rose-600/50 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-2xl shrink-0 shadow-lg">
                  🌋
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 animate-pulse" /> Perkhidmatan Pemberitahuan Gempa Bumi (ENS)
                    </span>
                    <span className="bg-rose-500/20 text-rose-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-rose-500/30">
                      Live USGS Feeds
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {earthquakeFeed?.feedName || 'USGS Real-Time Earthquake Hazards Catalog'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Pemantauan Seismik Global, Log Perubahan, dan Amaran Tsunami Masa Nyata
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadEarthquakeData()}
                  disabled={eqLoading}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${eqLoading ? 'animate-spin' : ''}`} />
                  <span>Segar Semula</span>
                </button>
                <button
                  onClick={() => setShowDeveloperModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-950/50"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Untuk Pembangun</span>
                </button>
              </div>
            </div>

            {/* Real-time Feeds Format Switcher & Direct Download Links (GeoJSON, ATOM, KML, Spreadsheet/CSV, QuakeML) */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>📡 Suapan Masa Nyata (Real-time Feeds & Formats):</span>
                <span className="text-rose-400 font-mono">Format Standard USGS</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { key: 'geojson', label: 'Ringkasan GeoJSON', ext: 'JSON', url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson', desc: 'Format Peta & API Web' },
                  { key: 'atom', label: 'ATOM Feed', ext: 'XML', url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/atom.php', desc: 'Suapan RSS/Pembaca Berita' },
                  { key: 'kml', label: 'KML (Google Earth)', ext: 'KML', url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/kml.php', desc: 'Visual 3D Google Earth' },
                  { key: 'csv', label: 'Hamparan Kerja (CSV)', ext: 'CSV', url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/csv.php', desc: 'Analisis Excel & Sheet' },
                  { key: 'quakeml', label: 'QuakeML', ext: 'XML', url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/quakeml.php', desc: 'Piawaian Seismologi Antarabangsa' }
                ].map((fmt) => (
                  <a
                    key={fmt.key}
                    href={fmt.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/50 transition-all flex flex-col justify-between group text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black font-mono bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                        {fmt.ext}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-rose-400 transition-colors" />
                    </div>
                    <div className="mt-1.5">
                      <div className="text-xs font-bold text-slate-100 group-hover:text-rose-200 truncate">{fmt.label}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{fmt.desc}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Magnitude Filter Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-300 mr-1">Magnitud:</span>
                {[
                  { mag: 0, label: 'Semua Gempa' },
                  { mag: 2.5, label: 'M 2.5+' },
                  { mag: 4.5, label: 'M 4.5+ (Sederhana)' },
                  { mag: 6.0, label: 'M 6.0+ (Kritikal/Signifikan)' }
                ].map((btn) => (
                  <button
                    key={btn.mag}
                    onClick={() => handleMinMagChange(btn.mag)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                      eqMinMag === btn.mag
                        ? 'bg-rose-500 border-rose-400 text-white font-black shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari lokasi / rantau..."
                  value={eqSearchQuery}
                  onChange={(e) => setEqSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Active Earthquake Hazard List */}
          <div className="space-y-3">
            {filteredEarthquakes.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-400">
                <Activity className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">Tiada rekod gempa bumi ditemui untuk penapis ini</p>
                <p className="text-xs text-slate-500 mt-1">Cuba pilih penapis 'Semua Gempa' atau luaskan carian anda.</p>
              </div>
            ) : (
              filteredEarthquakes.map((eq) => {
                let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                if (eq.magnitude >= 6.5) {
                  badgeColor = 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse';
                } else if (eq.magnitude >= 5.0) {
                  badgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
                } else if (eq.magnitude >= 4.0) {
                  badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                }

                return (
                  <div
                    key={eq.id}
                    className="bg-slate-900 border border-slate-800/90 hover:border-rose-600/50 rounded-2xl p-4 transition-all shadow-lg space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black border shadow-inner ${
                          eq.magnitude >= 6.0 ? 'bg-red-950 border-red-500 text-red-300' :
                          eq.magnitude >= 4.5 ? 'bg-orange-950 border-orange-500 text-orange-300' :
                          'bg-amber-950 border-amber-500 text-amber-300'
                        }`}>
                          <span className="text-[10px] uppercase tracking-tighter opacity-80">{eq.magType.toUpperCase()}</span>
                          <span className="text-base leading-none font-black">{eq.magnitude.toFixed(1)}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white group-hover:text-rose-200 transition-colors">
                              {eq.place}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                              {eq.severityLevel}
                            </span>
                            {eq.tsunami && (
                              <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow animate-pulse flex items-center gap-0.5">
                                🌊 AMARAN TSUNAMI
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {getTimeAgo(eq.time)} ({new Date(eq.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                            </span>
                            <span>•</span>
                            <span>Kedalaman: <strong className="text-slate-200">{eq.depthKm} km</strong></span>
                            {eq.distanceKm && (
                              <>
                                <span>•</span>
                                <span className="text-cyan-400 font-semibold">📏 {eq.distanceKm} km dari anda</span>
                              </>
                            )}
                            {eq.felt && (
                              <>
                                <span>•</span>
                                <span className="text-amber-300">👥 {eq.felt} laporan dirasai</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <a
                        href={eq.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 border border-slate-700/80 hover:border-rose-500 text-slate-200 text-xs font-bold flex items-center gap-1 transition-all shrink-0"
                      >
                        <span>USGS</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Quick Safety / Tsunami Tip if Critical */}
                    {eq.magnitude >= 5.5 && (
                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 text-[11px] text-slate-300 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Protokol Keselamatan: <strong>Jatuh, Berlindung, dan Pegang (Drop, Cover, Hold On)</strong> jika gegaran dirasai semasa memandu.</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Status: {eq.status.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: USGS WATER & FLOOD TELEMETRY */}
      {activeSubTab === 'water' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-cyan-950/80 border border-blue-600/50 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-2xl shrink-0 shadow-lg">
                🌊
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5" /> USGS National Water Information System (NWIS)
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                    API Key Active
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Tolok Paras Air, Aliran Sungai & Amaran Banjir Kilat
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {waterTelemetry?.source || 'USGS Water Data Gateway & Flood Telemetry'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <div className="text-[10px] font-bold uppercase text-slate-400">Status Risiko Banjir</div>
                <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{waterTelemetry?.floodRisk || 'Normal & Terkawal'}</span>
                </div>
              </div>
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <div className="text-[10px] font-bold uppercase text-slate-400">Had Kadar USGS (Rate Limit)</div>
                <div className="text-sm font-bold text-blue-400 mt-1 font-mono">
                  {waterTelemetry?.rateRemaining || 998} / {waterTelemetry?.rateLimit || 1000} req/hr
                </div>
              </div>
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <div className="text-[10px] font-bold uppercase text-slate-400">Stesen Tolok Sensor</div>
                <div className="text-sm font-bold text-cyan-400 mt-1 font-mono">
                  {waterTelemetry?.stationsCount || 3} Stesen Aktif
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Developer API Catalog & USGS Earthquake Services Modal */}
      {showDeveloperModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-rose-400" />
                <div>
                  <h3 className="font-bold text-base text-white">Untuk Pembangun: Dokumentasi API USGS & Katalog EQ</h3>
                  <p className="text-xs text-slate-400">Pemberitahuan, Web Services & Dasar Kitaran Hayat Suapan</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeveloperModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-rose-400 flex items-center gap-1.5">
                  <span>📘 Dokumentasi API - Katalog EQ</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  USGS menyediakan titik akhir GeoJSON berkecekapan tinggi yang dikemas kini setiap minit. Sesuai untuk integrasi sistem amaran awam, navigasi pintar, dan penyelidikan seismologi.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span>📜 Dasar Kitaran Hayat Suapan (Feed Lifecycle Policy)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Semua data gempa bumi diklasifikasikan sebagai <em>automatic</em> sejurus dikesan oleh rangkaian sensor seismik dan ditukar kepada <em>reviewed</em> selepas disahkan oleh pakar seismologi USGS.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <span>🌐 Perkhidmatan Web & Senarai Mel</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Sertai senarai mel pengumuman dan forum pembangun USGS di <strong>https://earthquake.usgs.gov/ens/</strong> untuk menerima amaran SMS, Tweet pemberitahuan gempa bumi, dan kemas kini parameter API.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowDeveloperModal(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                Tutup Dokumentasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

