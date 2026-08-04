import React, { useEffect, useState } from 'react';
import { fetchNasaApod, fetchNasaEonetEvents, NasaApodData, NasaEonetEvent } from '../services/api';
import { Globe, Flame, Image as ImageIcon, ExternalLink, Sparkles, Tv, Radio } from 'lucide-react';

export const NasaWidget: React.FC = () => {
  const [apod, setApod] = useState<NasaApodData | null>(null);
  const [eonetEvents, setEonetEvents] = useState<NasaEonetEvent[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'apod' | 'eonet' | 'sat' | 'iss'>('iss');
  const [loading, setLoading] = useState<boolean>(true);
  const [satLat, setSatLat] = useState<string>('-6.2088');
  const [satLon, setSatLon] = useState<string>('106.8456');
  const [satImageUrl, setSatImageUrl] = useState<string | null>(null);
  const [fetchingSat, setFetchingSat] = useState<boolean>(false);
  const [issPosition, setIssPosition] = useState<{ lat: number; lon: number; speed: number; altitude: number } | null>({
    lat: -6.2,
    lon: 106.8,
    speed: 27600,
    altitude: 408
  });

  useEffect(() => {
    let isMounted = true;
    async function loadNasaData() {
      setLoading(true);
      const [apodData, eonetData] = await Promise.all([
        fetchNasaApod(),
        fetchNasaEonetEvents()
      ]);
      if (isMounted) {
        setApod(apodData);
        setEonetEvents(eonetData);
        setLoading(false);
      }
    }
    loadNasaData();

    // Fetch ISS Position
    const fetchIss = async () => {
      try {
        const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setIssPosition({
              lat: data.latitude,
              lon: data.longitude,
              speed: Math.round(data.velocity),
              altitude: Math.round(data.altitude)
            });
          }
        }
      } catch (_e) {}
    };

    fetchIss();
    const interval = setInterval(fetchIss, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleFetchSatImage = () => {
    setFetchingSat(true);
    const latNum = parseFloat(satLat) || -6.2;
    const lonNum = parseFloat(satLon) || 106.8;
    setSatImageUrl(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/${Math.floor((1 - Math.log(Math.tan(latNum * Math.PI / 180) + 1 / Math.cos(latNum * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, 13))}/${Math.floor((lonNum + 180) / 360 * Math.pow(2, 13))}`);
    setFetchingSat(false);
  };

  return (
    <div id="nasa-widget-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-950 border border-blue-800/80 flex items-center justify-center text-blue-400">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>NASA Earth & Space Monitor</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">NASA LIVE 🔴</span>
            </h3>
            <p className="text-[11px] text-slate-400">Powered by NASA Open API & ISS Station</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('iss')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
              activeSubTab === 'iss'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3 h-3 text-red-400" />
            <span>NASA TV Live</span>
          </button>
          <button
            onClick={() => setActiveSubTab('eonet')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
              activeSubTab === 'eonet'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Hazards</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sat')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
              activeSubTab === 'sat'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3 h-3 text-blue-400" />
            <span>Satellite</span>
          </button>
          <button
            onClick={() => setActiveSubTab('apod')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
              activeSubTab === 'apod'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3 h-3 text-cyan-400" />
            <span>Daily Earth</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>Fetching satellite data from NASA...</span>
        </div>
      ) : activeSubTab === 'iss' ? (
        <div className="space-y-3">
          {/* ISS Telemetry Badge */}
          {issPosition && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <div>
                  <div className="font-bold text-white flex items-center gap-1">
                    <span>International Space Station (ISS)</span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1 rounded font-mono font-bold">
                      LIVE TRACKING
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Lat: {issPosition.lat.toFixed(2)}°, Lon: {issPosition.lon.toFixed(2)}° | Alt: {issPosition.altitude} km | Speed: {issPosition.speed} km/h
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NASA Live Feed Stream */}
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video relative shadow-inner">
            <iframe
              src="https://www.youtube.com/embed/21X5lGlDOfg?autoplay=1&mute=1"
              title="NASA Live Stream"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      ) : activeSubTab === 'eonet' ? (
        <div className="space-y-2">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>NASA EONET (Earth Observatory Natural Events)</span>
            <span className="font-semibold text-slate-300">{eonetEvents.length} events detected</span>
          </div>

          {eonetEvents.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">No major global natural disaster events reported right now.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
              {eonetEvents.map((evt) => {
                const categoryName = evt.categories[0]?.title || 'Natural Event';
                const coord = evt.geometry[0]?.coordinates;
                const dateStr = evt.geometry[0]?.date ? new Date(evt.geometry[0].date).toLocaleDateString() : 'Recent';

                return (
                  <div
                    key={evt.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700/80 transition-all flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-300">{evt.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">{categoryName}</span>
                        <span>•</span>
                        <span>{dateStr}</span>
                        {coord && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-cyan-400">{coord[1].toFixed(2)}°, {coord[0].toFixed(2)}°</span>
                          </>
                        )}
                      </div>
                    </div>

                    {evt.link && (
                      <a
                        href={evt.link}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                        title="View on NASA EONET"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeSubTab === 'sat' ? (
        <div className="space-y-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>NASA Landsat / Satellite Imagery Viewer</span>
            <span className="text-[10px] text-cyan-400 font-mono">Zoom 13</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Latitude</label>
              <input
                type="text"
                value={satLat}
                onChange={(e) => setSatLat(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Longitude</label>
              <input
                type="text"
                value={satLon}
                onChange={(e) => setSatLon(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            onClick={handleFetchSatImage}
            disabled={fetchingSat}
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Load Satellite Imagery</span>
          </button>

          {satImageUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
              <img
                src={satImageUrl}
                alt="NASA Satellite Tile"
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="p-2 text-[10px] text-slate-400 bg-slate-900/90 flex items-center justify-between">
                <span>Coordinates: {satLat}, {satLon}</span>
                <span className="text-cyan-400 font-semibold">Source: NASA GIBS / Esri Satellite</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {apod ? (
            <div className="bg-slate-950/90 rounded-xl overflow-hidden border border-slate-800">
              {apod.media_type === 'image' ? (
                <img
                  src={apod.url}
                  alt={apod.title}
                  className="w-full h-44 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="p-4 bg-slate-900 text-center text-xs text-slate-400">
                  <span>NASA Media Stream ({apod.media_type})</span>
                </div>
              )}
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white truncate">{apod.title}</h4>
                  <span className="text-[10px] text-slate-400">{apod.date}</span>
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                  {apod.explanation}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-3 text-center">NASA Daily APOD unavailable at this moment.</p>
          )}
        </div>
      )}
    </div>
  );
};
