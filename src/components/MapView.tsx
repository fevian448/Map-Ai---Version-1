import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  GeoPoint,
  TrafficAlert,
  Place,
  RouteInfo,
  PlaceCategory,
  PLACE_CATEGORIES,
  ALERT_TYPES,
  SpeedCamera,
  SettingsState
} from '../types';
import { Navigation2, Search, Plus, MapPin, Compass, LocateFixed, Fuel, Utensils, ParkingSquare, Building2, Banknote, Globe, Flame, Layers } from 'lucide-react';
import { t } from '../lib/i18n';
import { fetchNasaEonetEvents, NasaEonetEvent, haversine } from '../services/api';

interface MapViewProps {
  userLocation: GeoPoint;
  destination: GeoPoint | null;
  destinationName: string;
  route: RouteInfo | null;
  alerts: TrafficAlert[];
  places: Place[];
  speedCameras: SpeedCamera[];
  selectedCategory: PlaceCategory;
  onSelectCategory: (category: PlaceCategory) => void;
  onSelectDestination: (point: GeoPoint, name: String) => void;
  onOpenReportModal: () => void;
  onStartNavigation: () => void;
  isNavigating: boolean;
  settings: SettingsState;
}

export const MapView: React.FC<MapViewProps> = ({
  userLocation,
  destination,
  destinationName,
  route,
  alerts,
  places,
  speedCameras,
  selectedCategory,
  onSelectCategory,
  onSelectDestination,
  onOpenReportModal,
  onStartNavigation,
  isNavigating,
  settings
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const nasaLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [showNasaHazards, setShowNasaHazards] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [nasaEvents, setNasaEvents] = useState<NasaEonetEvent[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.latitude, userLocation.longitude],
        zoom: 14,
        zoomControl: false
      });

      markersGroupRef.current = L.layerGroup().addTo(map);
      nasaLayerGroupRef.current = L.layerGroup().addTo(map);

      // Handle map click to set custom destination
      map.on('click', (e: L.LeafletMouseEvent) => {
        onSelectDestination(
          { latitude: e.latlng.lat, longitude: e.latlng.lng },
          `Point (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`
        );
      });

      mapRef.current = map;
    }

    // Update tile layer based on mapProvider
    if (mapRef.current) {
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
      }

      let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      let maxZoom = 19;

      if (settings.mapProvider === 'google') {
        tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      } else if (settings.mapProvider === 'nasa_gibs') {
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      } else if (settings.mapProvider === 'nasa_night') {
        tileUrl = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_CityLights_2012/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg';
        maxZoom = 8;
      }

      tileLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom,
        attribution: '&copy; MapAi Navigation / NASA Open Data'
      }).addTo(mapRef.current);
    }

    return () => {
      // Keep map reference until unmount
    };
  }, [settings.mapProvider]);

  // Load NASA EONET hazard events on toggle
  useEffect(() => {
    if (showNasaHazards && nasaEvents.length === 0) {
      fetchNasaEonetEvents().then((evts) => {
        setNasaEvents(evts);
      });
    }
  }, [showNasaHazards]);

  // Render NASA hazard events on map
  useEffect(() => {
    if (!nasaLayerGroupRef.current) return;
    nasaLayerGroupRef.current.clearLayers();

    if (showNasaHazards && nasaEvents.length > 0) {
      nasaEvents.forEach((evt) => {
        const coord = evt.geometry[0]?.coordinates;
        if (!coord) return;
        const icon = L.divIcon({
          className: 'nasa-hazard-marker',
          html: `<div class="bg-amber-950/90 border-2 border-amber-500 text-amber-300 p-1.5 rounded-full shadow-2xl flex items-center justify-center animate-bounce cursor-pointer">
                   🔥
                 </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const m = L.marker([coord[1], coord[0]], { icon }).bindPopup(
          `<div class="p-1 font-sans">
             <div class="font-bold text-amber-600">NASA Hazard: ${evt.title}</div>
             <div class="text-xs text-slate-600 mt-1">Category: ${evt.categories[0]?.title || 'Natural Event'}</div>
             <a href="${evt.link}" target="_blank" class="text-xs text-blue-600 underline font-semibold mt-1 block">View NASA Details</a>
           </div>`
        );
        nasaLayerGroupRef.current?.addLayer(m);
      });
    }
  }, [showNasaHazards, nasaEvents]);

  // Update user location marker & pan
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    const latlng: [number, number] = [userLocation.latitude, userLocation.longitude];

    if (!userMarkerRef.current) {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div class="relative flex items-center justify-center w-8 h-8">
                 <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                 <div class="relative w-6 h-6 rounded-full bg-cyan-500 border-2 border-white shadow-lg flex items-center justify-center">
                   <div class="w-2 h-2 rounded-full bg-white"></div>
                 </div>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      userMarkerRef.current = L.marker(latlng, { icon: userIcon }).addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLatLng(latlng);
    }

    if (isNavigating) {
      mapRef.current.panTo(latlng);
    }
  }, [userLocation, isNavigating]);

  // Render Alerts, Places, Speed Cams, Destination on Map
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    // 1. Alert Markers
    alerts.forEach((alert) => {
      const isJam = alert.type === 'TRAFFIC';
      const emoji = ALERT_TYPES[alert.type]?.emoji || '🚨';

      const icon = L.divIcon({
        className: 'alert-marker',
        html: isJam
          ? `<div class="relative group cursor-pointer">
               <div class="absolute -inset-1 rounded-full bg-red-500/60 animate-ping"></div>
               <div class="relative bg-gradient-to-r from-red-950 to-slate-900 border-2 border-red-500 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
                 <span class="text-sm">🚦</span>
                 <span class="text-[10px] font-extrabold text-red-300 uppercase tracking-tight">TRAFFIC JAM</span>
               </div>
             </div>`
          : `<div class="bg-slate-900/90 border border-slate-700 text-lg px-2 py-1 rounded-xl shadow-lg transform hover:scale-110 transition-transform cursor-pointer">
                 ${emoji}
               </div>`,
        iconSize: isJam ? [110, 32] : [32, 32],
        iconAnchor: isJam ? [55, 16] : [16, 16]
      });

      const m = L.marker([alert.point.latitude, alert.point.longitude], { icon })
        .bindPopup(
          `<div class="p-1 text-slate-900 font-sans">
             <div class="font-bold flex items-center gap-1">${emoji} ${ALERT_TYPES[alert.type]?.label || alert.type}</div>
             <div class="text-xs mt-1 font-semibold text-slate-700">${alert.description}</div>
             <div class="text-[10px] text-slate-500 mt-1">Reporter: ${alert.reporter} • ${alert.confirmedBy} confirmations</div>
           </div>`
        );
      markersGroupRef.current?.addLayer(m);
    });

    // 2. Places Markers
    places.forEach((place) => {
      const catObj = PLACE_CATEGORIES.find((c) => c.key === place.category);
      const emoji = catObj?.emoji || '📍';

      const icon = L.divIcon({
        className: 'place-marker',
        html: `<div class="bg-slate-800 border border-cyan-500/50 text-xs px-2 py-1 rounded-xl shadow-md text-slate-100 flex items-center gap-1">
                 <span>${emoji}</span>
                 <span class="font-semibold max-w-[80px] truncate">${place.name}</span>
               </div>`,
        iconSize: [100, 24],
        iconAnchor: [50, 12]
      });

      const m = L.marker([place.point.latitude, place.point.longitude], { icon });
      m.on('click', () => {
        onSelectDestination(place.point, place.name);
      });
      markersGroupRef.current?.addLayer(m);
    });

    // 3. Speed Cameras
    speedCameras.forEach((cam) => {
      const icon = L.divIcon({
        className: 'cam-marker',
        html: `<div class="bg-red-950/90 border border-red-500 text-red-300 text-xs px-2 py-1 rounded-xl font-bold flex items-center gap-1 shadow-lg">
                 📸 ${cam.limitKmh}
               </div>`,
        iconSize: [50, 24],
        iconAnchor: [25, 12]
      });

      const m = L.marker([cam.point.latitude, cam.point.longitude], { icon }).bindPopup(
        `<b>Speed Camera</b><br/>Limit: ${cam.limitKmh} km/h<br/>Direction: ${cam.direction}`
      );
      markersGroupRef.current?.addLayer(m);
    });

    // 4. Destination Marker
    if (destination) {
      const destIcon = L.divIcon({
        className: 'dest-marker',
        html: `<div class="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center border-2 border-white shadow-xl">
                 <span class="text-sm">🏁</span>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const m = L.marker([destination.latitude, destination.longitude], { icon: destIcon })
        .bindPopup(`<b>${destinationName || 'Destination'}</b>`);
      markersGroupRef.current?.addLayer(m);
    }
  }, [alerts, places, speedCameras, destination]);

  // Render Route Polyline
  useEffect(() => {
    if (!mapRef.current) return;

    if (routeLayerRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (route && route.points.length > 0) {
      const latlngs: [number, number][] = route.points.map((p) => [p.latitude, p.longitude]);
      const polyline = L.polyline(latlngs, {
        color: '#00E5FF',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapRef.current);

      routeLayerRef.current = polyline;

      // Fit map bounds to show complete route
      if (!isNavigating) {
        mapRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      }
    }
  }, [route, isNavigating]);

  // Quick Search Filter
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = places.filter(
      (p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.category.includes(q.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const handleRecenter = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.flyTo([userLocation.latitude, userLocation.longitude], 15);
    }
  };

  return (
    <div id="map-view-container" className="relative w-full h-full flex flex-col overflow-hidden bg-slate-950">
      {/* Top Floating Search & Quick Filters Bar */}
      <div id="map-top-bar" className="absolute top-3 left-3 right-3 z-[1000] flex flex-col gap-2 max-w-lg mx-auto">
        <div className="relative bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-xl p-1.5 flex items-center">
          <Search className="w-5 h-5 text-slate-400 ml-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('search_placeholder', settings.language)}
            className="w-full bg-transparent border-none px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="px-2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-2 shadow-2xl max-h-56 overflow-y-auto">
            {searchResults.map((place) => (
              <button
                key={place.id}
                onClick={() => {
                  onSelectDestination(place.point, place.name);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="w-full p-2.5 rounded-xl hover:bg-slate-800 flex items-center justify-between text-left transition-colors"
              >
                <div>
                  <div className="text-sm font-bold text-slate-100">{place.name}</div>
                  <div className="text-xs text-slate-400">{(place.distanceMeters / 1000).toFixed(1)} km away</div>
                </div>
                <MapPin className="w-4 h-4 text-cyan-400" />
              </button>
            ))}
          </div>
        )}

        {/* Categories Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {PLACE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.key === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border backdrop-blur-md transition-all shadow-md ${
                  isSelected
                    ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-black scale-105'
                    : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Traffic Jam Banner Alert */}
        {(() => {
          const nearestJam = alerts.find(
            (a) => a.type === 'TRAFFIC' && userLocation && haversine(userLocation, a.point) < 4000
          );
          if (!nearestJam) return null;
          const distMeters = Math.round(haversine(userLocation, nearestJam.point));
          return (
            <div id="traffic-jam-alert-banner" className="mt-2 bg-gradient-to-r from-red-950/95 via-slate-900/95 to-red-950/95 border-2 border-red-500/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-top duration-200 text-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/60 text-red-400 font-bold flex items-center justify-center text-xl shrink-0 animate-pulse">
                  🚦
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                    <span>TRAFFIC JAM AHEAD</span>
                    <span className="text-[10px] bg-red-900/90 text-red-200 px-1.5 py-0.5 rounded font-mono border border-red-500/50">
                      ~{distMeters}m
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                    {nearestJam.description}
                  </div>
                </div>
              </div>
              <button
                onClick={onOpenReportModal}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shrink-0 shadow-lg shadow-red-950/50 transition-all active:scale-95"
              >
                Report Update
              </button>
            </div>
          );
        })()}
      </div>

      {/* Leaflet Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Action Buttons (Right Side) */}
      <div id="map-action-buttons" className="absolute right-3 bottom-20 z-[1000] flex flex-col gap-2 items-end">
        {/* Layer Selector Popover */}
        {showLayerMenu && (
          <div className="bg-slate-900/95 border border-slate-700/80 p-2 rounded-2xl shadow-2xl backdrop-blur-md mb-1 space-y-1 w-44 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">Map Layer</div>
            <button
              onClick={() => {
                settings.mapProvider = 'osm';
                setShowLayerMenu(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl font-bold flex items-center justify-between ${
                settings.mapProvider === 'osm' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>🗺️ Standard Map</span>
            </button>
            <button
              onClick={() => {
                settings.mapProvider = 'google';
                setShowLayerMenu(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl font-bold flex items-center justify-between ${
                settings.mapProvider === 'google' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>📍 Google Layer</span>
            </button>
            <button
              onClick={() => {
                settings.mapProvider = 'nasa_gibs';
                setShowLayerMenu(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl font-bold flex items-center justify-between ${
                settings.mapProvider === 'nasa_gibs' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>🛰️ NASA Satellite</span>
            </button>
            <button
              onClick={() => {
                settings.mapProvider = 'nasa_night';
                setShowLayerMenu(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl font-bold flex items-center justify-between ${
                settings.mapProvider === 'nasa_night' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>🌃 NASA Earth Night</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xl backdrop-blur-md transition-transform active:scale-95 ${
            settings.mapProvider.startsWith('nasa')
              ? 'bg-blue-600 border-blue-400 text-white'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white'
          }`}
          title="Switch Map / NASA Satellite Layer"
        >
          <Layers className="w-6 h-6" />
        </button>

        <button
          onClick={() => setShowNasaHazards(!showNasaHazards)}
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xl backdrop-blur-md transition-transform active:scale-95 ${
            showNasaHazards
              ? 'bg-amber-600 border-amber-400 text-white animate-pulse'
              : 'bg-slate-900/90 border-slate-700/80 text-amber-400 hover:text-amber-300'
          }`}
          title="Toggle NASA Hazards Overlay"
        >
          <Flame className="w-6 h-6" />
        </button>

        <button
          onClick={handleRecenter}
          className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-cyan-400 hover:text-cyan-300 flex items-center justify-center shadow-xl backdrop-blur-md transition-transform active:scale-95"
          title="Recenter Location"
        >
          <LocateFixed className="w-6 h-6" />
        </button>

        <button
          id="quick-report-btn"
          onClick={onOpenReportModal}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 flex items-center justify-center shadow-xl font-black transition-transform active:scale-95"
          title={t('report_here', settings.language)}
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </button>
      </div>

      {/* Destination Selected Banner at Bottom */}
      {destination && !isNavigating && (
        <div id="destination-action-card" className="absolute bottom-16 left-3 right-3 z-[1000] max-w-lg mx-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 text-slate-100 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div className="text-xs uppercase text-cyan-400 font-bold tracking-wider">Destination Selected</div>
              <div className="text-base font-bold text-white truncate max-w-xs">{destinationName}</div>
              {route && (
                <div className="text-xs text-slate-400 mt-0.5">
                  {(route.totalDistanceMeters / 1000).toFixed(1)} km • approx {Math.ceil(route.durationSeconds / 60)} min
                </div>
              )}
            </div>
            <button
              onClick={() => onSelectDestination(null as unknown as GeoPoint, '')}
              className="text-xs text-slate-400 hover:text-red-400 p-1"
            >
              Cancel
            </button>
          </div>

          <button
            id="start-nav-btn"
            onClick={onStartNavigation}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-sm transition-all"
          >
            <Navigation2 className="w-5 h-5 fill-slate-950" />
            <span>{t('start_navigation', settings.language)}</span>
          </button>
        </div>
      )}
    </div>
  );
};
