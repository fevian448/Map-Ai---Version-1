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
  SettingsState,
  GeocodingResult,
  ActiveDriver,
  RecentDestination,
  EarthquakeFeedItem
} from '../types';
import { Navigation2, Search, Plus, MapPin, Compass, LocateFixed, Fuel, Utensils, ParkingSquare, Building2, Banknote, Globe, Flame, Layers, Loader2, Users, Plane, Ship, Radio, Smartphone, Truck, ShieldAlert, Cpu, Sparkles, SlidersHorizontal, ZoomIn, ZoomOut, History, Clock, RotateCcw, Trash2, X, ChevronRight, Activity, Waves } from 'lucide-react';
import { t } from '../lib/i18n';
import { fetchNasaEonetEvents, NasaEonetEvent, haversine, searchGeocoding, fetchActiveDrivers, fetchLiveEarthquakes } from '../services/api';
import { fetchLiveAircraftRadar, fetchLiveSeaVesselsRadar, LiveAircraft, LiveVessel } from '../services/liveRadarStore';
import { getLiveGpsTrackableObjects, GpsTrackableObject, GpsTrackableCategory } from '../services/gpsTrackingStore';
import { getRecentDestinations, saveRecentDestination, removeRecentDestination, clearRecentDestinations } from '../services/recentDestinationsStore';

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
  activeDrivers?: ActiveDriver[];
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
  settings,
  activeDrivers = []
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const trackableGroupRef = useRef<L.LayerGroup | null>(null);
  const nasaLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const earthquakeGroupRef = useRef<L.LayerGroup | null>(null);
  const aircraftGroupRef = useRef<L.LayerGroup | null>(null);
  const vesselGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    id: string;
    name: string;
    subtitle?: string;
    point: GeoPoint;
    distanceMeters?: number;
  }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<any>(null);
  const [showNasaHazards, setShowNasaHazards] = useState(false);
  const [showEarthquakes, setShowEarthquakes] = useState(true);
  const [showFlightRadar, setShowFlightRadar] = useState(true);
  const [showMaritimeRadar, setShowMaritimeRadar] = useState(true);
  const [showGpsTrackers, setShowGpsTrackers] = useState(true);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showTrackerMenu, setShowTrackerMenu] = useState(false);
  const [nasaEvents, setNasaEvents] = useState<NasaEonetEvent[]>([]);
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeedItem[]>([]);
  const [liveAircraft, setLiveAircraft] = useState<LiveAircraft[]>([]);
  const [liveVessels, setLiveVessels] = useState<LiveVessel[]>([]);
  const [liveGpsObjects, setLiveGpsObjects] = useState<GpsTrackableObject[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Icon Size & Animated Movement Settings
  type IconScale = 'sm' | 'md' | 'lg' | 'xl';
  const [iconScale, setIconScale] = useState<IconScale>(() => {
    return (localStorage.getItem('mapai_icon_scale') as IconScale) || 'md';
  });
  const [isAnimatedMotion, setIsAnimatedMotion] = useState<boolean>(() => {
    const saved = localStorage.getItem('mapai_icon_motion');
    return saved !== null ? saved === 'true' : true;
  });

  const handleSetIconScale = (scale: IconScale) => {
    setIconScale(scale);
    localStorage.setItem('mapai_icon_scale', scale);
  };

  const handleToggleMotion = () => {
    setIsAnimatedMotion((prev) => {
      const next = !prev;
      localStorage.setItem('mapai_icon_motion', String(next));
      return next;
    });
  };

  const scaleMultipliers: Record<IconScale, number> = {
    sm: 0.75,
    md: 1.0,
    lg: 1.35,
    xl: 1.75
  };
  const currentScale = scaleMultipliers[iconScale] || 1.0;

  // Dismissable Alerts State
  const [isTrackerBadgeDismissed, setIsTrackerBadgeDismissed] = useState(false);
  const [dismissedJamAlertIds, setDismissedJamAlertIds] = useState<string[]>([]);

  // Recent Destinations State & Sync with localStorage (last 5 destinations)
  const [recentDestinations, setRecentDestinations] = useState<RecentDestination[]>(() => getRecentDestinations());
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [showRecentRibbon, setShowRecentRibbon] = useState<boolean>(true);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setRecentDestinations(e.detail);
      } else {
        setRecentDestinations(getRecentDestinations());
      }
    };
    window.addEventListener('mapai_recent_destinations_updated', handleUpdate);
    return () => {
      window.removeEventListener('mapai_recent_destinations_updated', handleUpdate);
    };
  }, []);

  const handleSelectRecentDestination = (dest: RecentDestination) => {
    onSelectDestination(dest.point, dest.name);
    saveRecentDestination(dest.name, dest.point, dest.category, dest.address);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
    if (mapRef.current) {
      mapRef.current.flyTo([dest.point.latitude, dest.point.longitude], 15, {
        duration: 1.5
      });
    }
  };

  const handleRemoveRecent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = removeRecentDestination(id);
    setRecentDestinations(updated);
  };

  const handleClearAllRecents = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentDestinations();
    setRecentDestinations([]);
  };

  const formatTimeAgo = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return settings.language === 'id' ? 'Baru saja' : 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d`;
  };

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
      trackableGroupRef.current = L.layerGroup().addTo(map);
      nasaLayerGroupRef.current = L.layerGroup().addTo(map);
      earthquakeGroupRef.current = L.layerGroup().addTo(map);
      aircraftGroupRef.current = L.layerGroup().addTo(map);
      vesselGroupRef.current = L.layerGroup().addTo(map);

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

  // Load USGS Real-Time Earthquakes (Poll every 30 seconds)
  useEffect(() => {
    let eqInterval: any;
    const loadEarthquakes = async () => {
      if (showEarthquakes) {
        const res = await fetchLiveEarthquakes(0, userLocation, 35);
        if (res && res.items) {
          setEarthquakes(res.items);
        }
      }
    };

    loadEarthquakes();
    eqInterval = setInterval(loadEarthquakes, 30000);
    return () => {
      if (eqInterval) clearInterval(eqInterval);
    };
  }, [showEarthquakes, userLocation]);

  // Render USGS Real-Time Earthquakes on Map
  useEffect(() => {
    if (!earthquakeGroupRef.current) return;
    earthquakeGroupRef.current.clearLayers();

    if (showEarthquakes && earthquakes.length > 0) {
      earthquakes.forEach((eq) => {
        if (!eq.latitude || !eq.longitude) return;

        let ringColor = '#22c55e'; // Green
        let badgeBg = 'bg-emerald-600';
        let animPulse = '';
        if (eq.magnitude >= 6.5) {
          ringColor = '#ef4444'; // Red
          badgeBg = 'bg-red-600';
          animPulse = 'animate-ping';
        } else if (eq.magnitude >= 5.0) {
          ringColor = '#f97316'; // Orange
          badgeBg = 'bg-orange-600';
          animPulse = 'animate-pulse';
        } else if (eq.magnitude >= 4.0) {
          ringColor = '#eab308'; // Yellow
          badgeBg = 'bg-amber-600';
        }

        // 1. Epicenter Seismic Wave Ring (Circle)
        const radiusMeters = Math.max(eq.magnitude * 15000, 30000);
        const circle = L.circle([eq.latitude, eq.longitude], {
          radius: radiusMeters,
          color: ringColor,
          weight: eq.magnitude >= 5.5 ? 2.5 : 1.5,
          fillColor: ringColor,
          fillOpacity: 0.15,
          dashArray: eq.magnitude >= 6 ? '4, 4' : undefined
        });
        earthquakeGroupRef.current?.addLayer(circle);

        // 2. Epicenter Center Marker with Magnitude
        const icon = L.divIcon({
          className: 'earthquake-marker-epicenter',
          html: `<div class="relative flex items-center justify-center cursor-pointer group">
                   <div class="absolute w-8 h-8 rounded-full ${badgeBg} opacity-40 ${animPulse}"></div>
                   <div class="${badgeBg} text-white font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-2xl border-2 border-white flex items-center gap-0.5 z-10 scale-100 group-hover:scale-110 transition-transform">
                     <span>🌋</span>
                     <span>M${eq.magnitude}</span>
                     ${eq.tsunami ? '<span class="text-[9px]">🌊</span>' : ''}
                   </div>
                 </div>`,
          iconSize: [40, 24],
          iconAnchor: [20, 12]
        });

        const timeStr = new Date(eq.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date(eq.time).toLocaleDateString([], { month: 'short', day: 'numeric' });

        const m = L.marker([eq.latitude, eq.longitude], { icon }).bindPopup(
          `<div class="p-2 font-sans text-slate-900 min-w-[220px]">
             <div class="flex items-center justify-between border-b pb-1">
               <span class="font-black text-sm text-red-600 flex items-center gap-1">
                 🌋 M ${eq.magnitude.toFixed(1)} ${eq.magType.toUpperCase()}
               </span>
               <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeBg} text-white uppercase">
                 ${eq.severityLevel}
               </span>
             </div>
             <div class="font-bold text-xs text-slate-800 mt-1.5">${eq.place}</div>
             <div class="text-[11px] text-slate-600 space-y-0.5 mt-1">
               <div>📍 Kedalaman: <b>${eq.depthKm} km</b></div>
               <div>⏱️ Masa: <b>${dateStr}, ${timeStr}</b></div>
               ${eq.distanceKm ? `<div>📏 Jarak dari anda: <b class="text-blue-600">${eq.distanceKm} km</b></div>` : ''}
               ${eq.tsunami ? '<div class="text-red-600 font-bold bg-red-50 p-1 rounded mt-1">🌊 AMARAN TSUNAMI AKTIF</div>' : ''}
               ${eq.felt ? `<div>👥 Laporan dirasai: <b>${eq.felt} orang</b></div>` : ''}
             </div>
             <div class="mt-2 pt-1 border-t flex items-center justify-between">
               <span class="text-[9px] text-slate-400 font-mono">USGS Seismic Feed</span>
               <a href="${eq.url}" target="_blank" rel="noreferrer" class="text-[11px] font-bold text-blue-600 hover:underline">
                 Lihat di USGS ↗
               </a>
             </div>
           </div>`
        );
        earthquakeGroupRef.current?.addLayer(m);
      });
    }
  }, [showEarthquakes, earthquakes]);

  // Polling interval for all live GPS trackable objects & radars (Every 2 seconds)
  useEffect(() => {
    let interval: any;

    const pollAllTrackables = async () => {
      if (userLocation) {
        // 1. All GPS trackable objects (Phones, Riders, Fleet, Emergency, Asset tags, Satellites)
        if (showGpsTrackers) {
          const objs = getLiveGpsTrackableObjects(userLocation);
          setLiveGpsObjects(objs);
        }

        // 2. Air Traffic Flights
        if (showFlightRadar) {
          const flights = await fetchLiveAircraftRadar(userLocation);
          setLiveAircraft(flights);
        }

        // 3. Maritime Sea Vessels
        if (showMaritimeRadar) {
          const vessels = await fetchLiveSeaVesselsRadar(userLocation);
          setLiveVessels(vessels);
        }
      }
    };

    pollAllTrackables();
    interval = setInterval(pollAllTrackables, 2000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showGpsTrackers, showFlightRadar, showMaritimeRadar, userLocation]);

  // Render All Live GPS Trackable Objects on Map
  useEffect(() => {
    if (!trackableGroupRef.current) return;
    trackableGroupRef.current.clearLayers();

    if (showGpsTrackers && liveGpsObjects.length > 0) {
      const filtered = activeCategoryFilter === 'all'
        ? liveGpsObjects
        : liveGpsObjects.filter((o) => o.category === activeCategoryFilter);

      const s = currentScale;

      filtered.forEach((item) => {
        let badgeBg = 'bg-slate-900 border-cyan-400 text-cyan-200';
        let pingColor = 'bg-cyan-400';

        if (item.category === 'emergency') {
          badgeBg = 'bg-red-950 border-red-500 text-red-200 animate-pulse';
          pingColor = 'bg-red-500';
        } else if (item.category === 'rider') {
          badgeBg = 'bg-emerald-950 border-emerald-400 text-emerald-200';
          pingColor = 'bg-emerald-400';
        } else if (item.category === 'fleet') {
          badgeBg = 'bg-amber-950 border-amber-400 text-amber-200';
          pingColor = 'bg-amber-400';
        } else if (item.category === 'phone') {
          badgeBg = 'bg-indigo-950 border-indigo-400 text-indigo-200';
          pingColor = 'bg-indigo-400';
        } else if (item.category === 'satellite') {
          badgeBg = 'bg-purple-950 border-purple-400 text-purple-200';
          pingColor = 'bg-purple-400';
        }

        const icon = L.divIcon({
          className: 'gps-trackable-marker',
          html: `<div class="relative group cursor-pointer ${isAnimatedMotion ? 'animate-mapai-float' : ''}" style="transform: scale(${s}); transform-origin: center;">
                   <div class="absolute -inset-1 rounded-full ${pingColor}/50 ${isAnimatedMotion ? 'animate-ping' : ''}"></div>
                   <div class="relative ${badgeBg} border-2 text-xs px-2 py-0.5 rounded-xl shadow-2xl flex items-center gap-1 backdrop-blur-md hover:scale-110 transition-all">
                     <span class="text-sm">${item.emoji}</span>
                     <span class="text-[10px] font-black truncate max-w-[75px]">${item.name.split('(')[0].trim()}</span>
                   </div>
                 </div>`,
          iconSize: [Math.round(95 * s), Math.round(26 * s)],
          iconAnchor: [Math.round(47.5 * s), Math.round(13 * s)]
        });

        const popupContent = `
          <div class="p-2 font-sans text-slate-900 bg-white rounded-xl shadow-xl min-w-[210px]">
            <div class="flex items-center justify-between border-b pb-1.5 gap-2">
              <span class="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                <span>${item.emoji}</span>
                <span>${item.name}</span>
              </span>
              <span class="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black font-mono">${item.status}</span>
            </div>
            <div class="text-[11px] text-slate-600 mt-1.5 font-semibold">
              🏷️ Jenis: <strong>${item.typeLabel}</strong>
            </div>
            ${item.details.modelOrMake ? `<div class="text-[11px] text-slate-600 mt-0.5">📦 Model: <strong>${item.details.modelOrMake}</strong></div>` : ''}
            ${item.details.operatorOrOwner ? `<div class="text-[11px] text-slate-600 mt-0.5">🏢 Pemilik: <strong>${item.details.operatorOrOwner}</strong></div>` : ''}
            <div class="text-[10px] text-slate-600 mt-1 grid grid-cols-2 gap-1 font-mono bg-slate-50 p-1.5 rounded border border-slate-200">
              <div>Kelajuan: <strong>${item.speedKmh} km/h</strong></div>
              <div>Bateri: <strong>${item.batteryPercent !== undefined ? `${item.batteryPercent}%` : 'N/A'}</strong></div>
              <div class="col-span-2 text-[9px] text-slate-500 truncate">📡 Chipset: ${item.gpsChipset}</div>
              <div class="col-span-2 text-[9px] text-emerald-700 font-bold">⏱️ ${item.details.lastPingText}</div>
            </div>
          </div>
        `;

        const m = L.marker([item.point.latitude, item.point.longitude], { icon }).bindPopup(popupContent);
        trackableGroupRef.current?.addLayer(m);
      });
    }
  }, [showGpsTrackers, liveGpsObjects, activeCategoryFilter, iconScale, isAnimatedMotion]);

  // Render Live Aircraft on Map
  useEffect(() => {
    if (!aircraftGroupRef.current) return;
    aircraftGroupRef.current.clearLayers();

    if (showFlightRadar && liveAircraft.length > 0) {
      const s = currentScale;
      liveAircraft.forEach((ac) => {
        const icon = L.divIcon({
          className: 'aircraft-marker',
          html: `<div class="relative group cursor-pointer ${isAnimatedMotion ? 'animate-mapai-float' : ''}" style="transform: scale(${s}); transform-origin: center;">
                   <div class="bg-sky-950/90 border-2 border-sky-400 text-sky-200 text-xs px-2 py-1 rounded-xl shadow-2xl flex items-center gap-1 backdrop-blur-md hover:scale-110 transition-all" style="transform: rotate(${ac.headingDeg - 90}deg);">
                     <span class="text-base">${ac.emoji}</span>
                   </div>
                   <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-sky-300 font-mono text-[9px] font-black px-1.5 py-0.5 rounded border border-sky-500/40 whitespace-nowrap opacity-90 shadow-lg">
                     ${ac.callsign} • ${ac.altitudeFt}ft
                   </div>
                 </div>`,
          iconSize: [Math.round(42 * s), Math.round(32 * s)],
          iconAnchor: [Math.round(21 * s), Math.round(16 * s)]
        });

        const m = L.marker([ac.point.latitude, ac.point.longitude], { icon }).bindPopup(
          `<div class="p-2 font-sans text-slate-900 bg-white rounded-lg shadow-xl">
             <div class="flex items-center justify-between border-b pb-1">
               <span class="font-extrabold text-sky-700 text-sm">✈️ ${ac.callsign}</span>
               <span class="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-mono font-bold">${ac.squawk}</span>
             </div>
             <div class="text-xs font-bold text-slate-800 mt-1.5">${ac.airline} • ${ac.aircraftType}</div>
             <div class="text-xs text-slate-600 mt-1 grid grid-cols-2 gap-x-2 font-mono">
               <div>Kelajuan: <strong>${ac.speedKmh} km/h</strong></div>
               <div>Altitud: <strong>${ac.altitudeFt.toLocaleString()} ft</strong></div>
               <div>Arah: <strong>${ac.headingDeg}°</strong></div>
               <div>Mod: <strong class="text-emerald-600">LIVE RADAR</strong></div>
             </div>
             <div class="mt-2 text-[11px] bg-slate-100 p-1.5 rounded font-bold text-slate-700 border">
               🗺️ Laluan: ${ac.origin} ➔ ${ac.destination}
             </div>
           </div>`
        );
        aircraftGroupRef.current?.addLayer(m);
      });
    }
  }, [showFlightRadar, liveAircraft, iconScale, isAnimatedMotion]);

  // Render Live Sea Vessels on Map
  useEffect(() => {
    if (!vesselGroupRef.current) return;
    vesselGroupRef.current.clearLayers();

    if (showMaritimeRadar && liveVessels.length > 0) {
      const s = currentScale;
      liveVessels.forEach((v) => {
        const icon = L.divIcon({
          className: 'vessel-marker',
          html: `<div class="relative group cursor-pointer ${isAnimatedMotion ? 'animate-mapai-float' : ''}" style="transform: scale(${s}); transform-origin: center;">
                   <div class="bg-blue-950/90 border-2 border-cyan-400 text-cyan-200 text-xs px-2 py-1 rounded-xl shadow-2xl flex items-center gap-1 backdrop-blur-md hover:scale-110 transition-all">
                     <span class="text-base">${v.emoji}</span>
                   </div>
                   <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/90 text-cyan-300 font-mono text-[9px] font-black px-1.5 py-0.5 rounded border border-cyan-500/40 whitespace-nowrap opacity-90 shadow-lg">
                     ${v.flag} ${v.name}
                   </div>
                 </div>`,
          iconSize: [Math.round(40 * s), Math.round(32 * s)],
          iconAnchor: [Math.round(20 * s), Math.round(16 * s)]
        });

        const m = L.marker([v.point.latitude, v.point.longitude], { icon }).bindPopup(
          `<div class="p-2 font-sans text-slate-900 bg-white rounded-lg shadow-xl">
             <div class="flex items-center justify-between border-b pb-1">
               <span class="font-extrabold text-blue-700 text-sm">${v.flag} ${v.name}</span>
               <span class="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono font-bold">MMSI: ${v.mmsi}</span>
             </div>
             <div class="text-xs font-bold text-slate-800 mt-1.5">Kapal Laut: ${v.vesselType} (${v.lengthMeters}m)</div>
             <div class="text-xs text-slate-600 mt-1 grid grid-cols-2 gap-x-2 font-mono">
               <div>Kelajuan: <strong>${v.speedKnots} knots</strong></div>
               <div>Arah: <strong>${v.headingDeg}°</strong></div>
               <div>Status: <strong class="text-blue-600">EN ROUTE</strong></div>
               <div>Pelabuhan: <strong>${v.destinationPort}</strong></div>
             </div>
           </div>`
        );
        vesselGroupRef.current?.addLayer(m);
      });
    }
  }, [showMaritimeRadar, liveVessels, iconScale, isAnimatedMotion]);

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

    // 4. Live Active Online Drivers & Riders (Internet / Server Connected)
    if (activeDrivers && activeDrivers.length > 0) {
      const s = currentScale;
      activeDrivers.forEach((drv) => {
        const icon = L.divIcon({
          className: 'active-driver-marker',
          html: `<div class="relative group cursor-pointer ${isAnimatedMotion ? 'animate-mapai-float' : ''}" style="transform: scale(${s}); transform-origin: center;">
                   <div class="absolute -inset-1 rounded-full bg-emerald-500/40 ${isAnimatedMotion ? 'animate-ping' : ''}"></div>
                   <div class="relative bg-slate-900 border-2 border-emerald-400 text-white text-xs px-2 py-0.5 rounded-xl shadow-xl flex items-center gap-1 backdrop-blur-md">
                     <span class="text-sm">${drv.vehicleEmoji}</span>
                     <span class="text-[10px] font-extrabold text-emerald-300 truncate max-w-[70px]">${drv.name.split('_')[0]}</span>
                   </div>
                 </div>`,
          iconSize: [Math.round(85 * s), Math.round(26 * s)],
          iconAnchor: [Math.round(42.5 * s), Math.round(13 * s)]
        });

        const m = L.marker([drv.point.latitude, drv.point.longitude], { icon }).bindPopup(
          `<div class="p-1 font-sans text-slate-900">
             <div class="font-bold flex items-center gap-1 text-emerald-700 text-sm">
               <span>${drv.vehicleEmoji}</span>
               <span>${drv.name}</span>
             </div>
             <div class="text-xs font-semibold text-slate-700 mt-1">Role: ${drv.role} • Status: <span class="text-emerald-600 font-bold">${drv.status}</span></div>
             <div class="text-[10px] text-slate-500 mt-0.5">Speed: ${drv.speedKmh} km/h • Active 1m ago</div>
           </div>`
        );
        markersGroupRef.current?.addLayer(m);
      });
    }

    // 5. Destination Marker
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
  }, [alerts, places, speedCameras, destination, activeDrivers, iconScale, isAnimatedMotion]);

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

  // Quick Search Filter & Global Worldwide Geocoding
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!q.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Check if query is latitude, longitude coordinate format (e.g., "3.139, 101.686")
    const coordMatch = q.trim().match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[3]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        const coordPoint: GeoPoint = { latitude: lat, longitude: lon };
        setSearchResults([
          {
            id: `coord_${lat}_${lon}`,
            name: `📍 Coordinate: ${lat.toFixed(5)}, ${lon.toFixed(5)}`,
            subtitle: 'Worldwide Custom Coordinates Target',
            point: coordPoint,
            distanceMeters: userLocation ? haversine(userLocation, coordPoint) : undefined
          }
        ]);
        setIsSearching(false);
        return;
      }
    }

    // 1. Instant local POI filter
    const localFiltered = places
      .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.category.includes(q.toLowerCase()))
      .map((p) => ({
        id: p.id,
        name: p.name,
        subtitle: `${p.category.toUpperCase()} • Nearby POI`,
        point: p.point,
        distanceMeters: p.distanceMeters
      }));

    setSearchResults(localFiltered);
    setIsSearching(true);

    // 2. Debounced API Geocoding Call for cities / global addresses anywhere on Earth
    searchTimeoutRef.current = setTimeout(async () => {
      const geoResults = await searchGeocoding(q, userLocation);
      setIsSearching(false);

      if (geoResults && geoResults.length > 0) {
        const globalItems = geoResults.map((g) => ({
          id: g.id,
          name: g.name,
          subtitle: g.address,
          point: g.point,
          distanceMeters: g.distanceMeters
        }));

        // Merge local and global items without duplicate IDs
        const existingIds = new Set(localFiltered.map((item) => item.id));
        const combined = [...localFiltered];

        globalItems.forEach((item) => {
          if (!existingIds.has(item.id)) {
            combined.push(item);
          }
        });

        setSearchResults(combined);
      }
    }, 300);
  };

  const handleSelectSearchResult = (item: {
    id: string;
    name: string;
    point: GeoPoint;
    subtitle?: string;
  }) => {
    onSelectDestination(item.point, item.name);
    saveRecentDestination(item.name, item.point, 'search', item.subtitle);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
    if (mapRef.current) {
      mapRef.current.flyTo([item.point.latitude, item.point.longitude], 14, {
        duration: 1.5
      });
    }
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
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-cyan-400 ml-3 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-slate-400 ml-3" />
          )}
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => {
              setIsSearchFocused(true);
              handleSearch(e.target.value);
            }}
            placeholder={t('search_placeholder', settings.language)}
            className="w-full bg-transparent border-none px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                handleSearch('');
                setIsSearchFocused(false);
              }}
              className="px-2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          ) : recentDestinations.length > 0 ? (
            <button
              onClick={() => setIsSearchFocused(!isSearchFocused)}
              className={`p-1.5 mr-1 rounded-xl text-xs flex items-center gap-1 transition-all ${
                isSearchFocused
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800'
              }`}
              title="Tunjuk / Tutup Destinasi Terkini"
            >
              <History className="w-4 h-4" />
              <span className="text-[10px] font-bold font-mono bg-purple-950/80 text-purple-300 px-1 py-0.2 rounded border border-purple-500/30">
                {recentDestinations.length}
              </span>
            </button>
          ) : null}
        </div>

        {/* Search Results Dropdown & Recent Destinations Popup */}
        {searchResults.length > 0 ? (
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-2 shadow-2xl max-h-72 overflow-y-auto space-y-1">
            <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Hasil Carian ({searchResults.length})
            </div>
            {searchResults.map((place) => (
              <button
                key={place.id}
                onClick={() => handleSelectSearchResult(place)}
                className="w-full p-2.5 rounded-xl hover:bg-slate-800/90 flex items-center justify-between text-left transition-colors border border-transparent hover:border-slate-700/60"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-sm font-bold text-slate-100 truncate">{place.name}</div>
                  {place.subtitle && (
                    <div className="text-xs text-slate-400 truncate mt-0.5">{place.subtitle}</div>
                  )}
                  {place.distanceMeters !== undefined && (
                    <div className="text-[11px] text-cyan-400 font-semibold mt-0.5">
                      {(place.distanceMeters / 1000).toFixed(1)} km away
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        ) : isSearchFocused && recentDestinations.length > 0 && !searchQuery ? (
          <div className="bg-slate-900/95 backdrop-blur-md border border-purple-900/60 rounded-2xl p-2 shadow-2xl max-h-72 overflow-y-auto space-y-1 animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800/80 mb-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                <History className="w-3.5 h-3.5 text-purple-400" />
                <span>{t('recent_destinations', settings.language)}</span>
                <span className="text-[10px] bg-purple-950 text-purple-300 font-mono px-1.5 py-0.2 rounded border border-purple-500/30">
                  {recentDestinations.length}/5
                </span>
              </div>
              <button
                onClick={handleClearAllRecents}
                className="text-[11px] font-bold text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
                title={t('clear_recents', settings.language)}
              >
                <Trash2 className="w-3 h-3" />
                <span>{t('clear_recents', settings.language)}</span>
              </button>
            </div>
            {recentDestinations.map((dest) => {
              const distKm = userLocation ? (haversine(userLocation, dest.point) / 1000).toFixed(1) : null;
              return (
                <div
                  key={dest.id}
                  onClick={() => handleSelectRecentDestination(dest)}
                  className="w-full p-2.5 rounded-xl bg-slate-950/50 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="min-w-0 pr-2 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-100 group-hover:text-purple-200 transition-colors truncate">
                        {dest.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                        {distKm && (
                          <span className="text-cyan-400 font-semibold font-mono">
                            {distKm} km away
                          </span>
                        )}
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 font-mono">
                          {formatTimeAgo(dest.timestamp)}
                        </span>
                      </div>
                      {dest.address && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {dest.address}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRecentDestination(dest);
                      }}
                      className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black flex items-center gap-1 shadow transition-all active:scale-95"
                      title={t('quick_reroute', settings.language)}
                    >
                      <span>⚡ {t('quick_reroute', settings.language)}</span>
                    </button>
                    <button
                      onClick={(e) => handleRemoveRecent(e, dest.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Padam"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Categories Chips (Clean & Spacious) */}
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

        {/* Recent Destinations Quick-Access Ribbon (Direct Quick Re-routing) */}
        {recentDestinations.length > 0 && showRecentRibbon && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-purple-950/90 border border-purple-500/50 text-purple-200 text-[11px] font-extrabold shrink-0 shadow-md">
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('recent_destinations', settings.language)}:</span>
            </div>
            {recentDestinations.map((dest) => {
              const distKm = userLocation ? (haversine(userLocation, dest.point) / 1000).toFixed(1) : null;
              return (
                <div
                  key={dest.id}
                  onClick={() => handleSelectRecentDestination(dest)}
                  className="group flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-purple-900/40 border border-slate-700/80 hover:border-purple-500/60 text-slate-200 text-xs font-semibold shrink-0 cursor-pointer backdrop-blur-md shadow-md transition-all active:scale-95"
                  title={`Re-route to ${dest.name}`}
                >
                  <Clock className="w-3 h-3 text-cyan-400 group-hover:text-purple-400 transition-colors shrink-0" />
                  <span className="truncate max-w-[110px] font-bold text-slate-100">{dest.name}</span>
                  {distKm && (
                    <span className="text-[10px] text-cyan-400 font-mono font-bold shrink-0">
                      {distKm}km
                    </span>
                  )}
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1 py-0.2 rounded font-bold group-hover:bg-purple-500 group-hover:text-white transition-all shrink-0">
                    ⚡
                  </span>
                  <button
                    onClick={(e) => handleRemoveRecent(e, dest.id)}
                    className="text-slate-500 hover:text-red-400 p-0.5 rounded-full hover:bg-slate-800 transition-colors ml-0.5"
                    title="Padam"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            <button
              onClick={handleClearAllRecents}
              className="px-2 py-1 rounded-xl bg-slate-900/80 hover:bg-red-950/80 border border-slate-800 hover:border-red-600/60 text-slate-400 hover:text-red-300 text-[10px] font-bold shrink-0 transition-all flex items-center gap-1"
              title={t('clear_recents', settings.language)}
            >
              <Trash2 className="w-3 h-3" />
              <span>{t('clear_recents', settings.language)}</span>
            </button>
          </div>
        )}

        {/* Live Traffic Jam Banner Alert (Dismissable & Skip/Close Button) */}
        {(() => {
          const nearestJam = alerts.find(
            (a) => a.type === 'TRAFFIC' && userLocation && haversine(userLocation, a.point) < 4000 && !dismissedJamAlertIds.includes(a.id)
          );
          if (!nearestJam) return null;
          const distMeters = Math.round(haversine(userLocation, nearestJam.point));
          return (
            <div id="traffic-jam-alert-banner" className="mt-2 bg-gradient-to-r from-red-950/95 via-slate-900/95 to-red-950/95 border-2 border-red-500/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-top duration-200 text-slate-100 flex items-center justify-between gap-2">
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

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={onOpenReportModal}
                  className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-red-950/50 transition-all active:scale-95"
                >
                  Update
                </button>
                <button
                  onClick={() => setDismissedJamAlertIds((prev) => [...prev, nearestJam.id])}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-xl border border-slate-600 transition-all active:scale-95 flex items-center gap-1"
                  title="Tutup / Skip Alert Ini"
                >
                  <span>Skip / Tutup</span>
                  <span>✕</span>
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Leaflet Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Action Buttons (Right Side) */}
      <div id="map-action-buttons" className="absolute right-3 bottom-20 z-[1000] flex flex-col gap-2 items-end">
        {/* GPS Trackable Devices & Icon Sizing Selector Popover */}
        {showTrackerMenu && (
          <div className="bg-slate-900/95 border border-slate-700/80 p-2.5 rounded-2xl shadow-2xl backdrop-blur-md mb-1 space-y-2 w-56 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Alat Penjejak ({liveGpsObjects.length})</span>
              <button
                onClick={() => setShowGpsTrackers(!showGpsTrackers)}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${showGpsTrackers ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}
              >
                {showGpsTrackers ? 'ON' : 'OFF'}
              </button>
            </div>
            {[
              { key: 'all', label: 'Semua Alat Penjejak', icon: '📡', count: liveGpsObjects.length },
              { key: 'phone', label: 'Telefon Pintar (GPS)', icon: '📱', count: liveGpsObjects.filter(o => o.category === 'phone').length },
              { key: 'rider', label: 'Rider & Motosikal', icon: '🛵', count: liveGpsObjects.filter(o => o.category === 'rider').length },
              { key: 'fleet', label: 'Kenderaan / Lori', icon: '🚚', count: liveGpsObjects.filter(o => o.category === 'fleet').length },
              { key: 'emergency', label: 'Ambulans & Kecemasan', icon: '🚨', count: liveGpsObjects.filter(o => o.category === 'emergency').length },
              { key: 'tag', label: 'Tag Penjejak Aset', icon: '🏷️', count: liveGpsObjects.filter(o => o.category === 'tag').length },
              { key: 'satellite', label: 'Satelit Orbit GPS', icon: '🛰️', count: liveGpsObjects.filter(o => o.category === 'satellite').length }
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategoryFilter(cat.key)}
                className={`w-full text-left px-2 py-1 rounded-xl font-bold flex items-center justify-between transition-all ${
                  activeCategoryFilter === cat.key ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40' : 'text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{cat.icon}</span>
                  <span className="text-[11px] truncate max-w-[110px]">{cat.label}</span>
                </span>
                <span className="text-[10px] font-mono opacity-80">{cat.count}</span>
              </button>
            ))}

            {/* Icon Size Scale & Animated Motion Controls */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>📐 Saiz Ikon</span>
                <span className="text-cyan-400 font-mono">
                  {iconScale === 'sm' ? 'Kecil (0.75x)' : iconScale === 'md' ? 'Sedang (1.0x)' : iconScale === 'lg' ? 'Besar (1.35x)' : 'XL (1.75x)'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { key: 'sm', label: 'Kecil' },
                  { key: 'md', label: 'Sedang' },
                  { key: 'lg', label: 'Besar' },
                  { key: 'xl', label: 'XL' }
                ].map((sz) => (
                  <button
                    key={sz.key}
                    onClick={() => handleSetIconScale(sz.key as any)}
                    className={`py-1 text-[10px] font-black rounded-lg border transition-all text-center ${
                      iconScale === sz.key
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow font-black'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>

              {/* Animated Motion Switch */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400 font-bold">⚡ Gerakan Ikon</span>
                <button
                  onClick={handleToggleMotion}
                  className={`text-[10px] font-black px-2 py-0.5 rounded-lg border transition-all ${
                    isAnimatedMotion ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isAnimatedMotion ? 'AKTIF 🚀' : 'STATIK ⏸️'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* All GPS Trackable Devices Toggle Button */}
        <button
          onClick={() => setShowTrackerMenu(!showTrackerMenu)}
          className={`relative w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xl backdrop-blur-md transition-transform active:scale-95 ${
            showGpsTrackers
              ? 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-400 text-white'
              : 'bg-slate-900/90 border-slate-700/80 text-emerald-400 hover:text-emerald-300'
          }`}
          title="Alat Penjejak GPS (Telefon, Rider, Kenderaan, Aset)"
        >
          <Radio className="w-6 h-6 animate-pulse" />
          {showGpsTrackers && liveGpsObjects.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-emerald-400 text-slate-950 font-black text-[9px] px-1 rounded-full border border-slate-950 shadow">
              {liveGpsObjects.length}
            </span>
          )}
        </button>

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

        {/* Live Flight Radar Toggle Button (Airplanes) */}
        <button
          onClick={() => setShowFlightRadar(!showFlightRadar)}
          className={`relative w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xl backdrop-blur-md transition-transform active:scale-95 ${
            showFlightRadar
              ? 'bg-sky-600 border-sky-400 text-white'
              : 'bg-slate-900/90 border-slate-700/80 text-sky-400 hover:text-sky-300'
          }`}
          title="Toggle Live Airplanes / Flight Radar"
        >
          <Plane className="w-6 h-6" />
          {showFlightRadar && liveAircraft.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-sky-400 text-slate-950 font-black text-[9px] px-1 rounded-full border border-slate-950 shadow">
              {liveAircraft.length}
            </span>
          )}
        </button>

        {/* Live Maritime Sea Radar Toggle Button (Ships & Boats) */}
        <button
          onClick={() => setShowMaritimeRadar(!showMaritimeRadar)}
          className={`relative w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xl backdrop-blur-md transition-transform active:scale-95 ${
            showMaritimeRadar
              ? 'bg-blue-700 border-cyan-400 text-white'
              : 'bg-slate-900/90 border-slate-700/80 text-cyan-400 hover:text-cyan-300'
          }`}
          title="Toggle Live Maritime Ships & Sea Radar"
        >
          <Ship className="w-6 h-6" />
          {showMaritimeRadar && liveVessels.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-cyan-400 text-slate-950 font-black text-[9px] px-1 rounded-full border border-slate-950 shadow">
              {liveVessels.length}
            </span>
          )}
        </button>

        {/* Live Earthquake & Seismic Hazard Radar Toggle Button */}
        <button
          onClick={() => setShowEarthquakes(!showEarthquakes)}
          className={`relative w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xl backdrop-blur-md transition-transform active:scale-95 ${
            showEarthquakes
              ? 'bg-rose-600 border-rose-400 text-white'
              : 'bg-slate-900/90 border-slate-700/80 text-rose-400 hover:text-rose-300'
          }`}
          title="Toggle USGS Real-Time Earthquake & Seismic Radar"
        >
          <Activity className="w-6 h-6 animate-pulse" />
          {showEarthquakes && earthquakes.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-400 text-slate-950 font-black text-[9px] px-1 rounded-full border border-slate-950 shadow">
              {earthquakes.length}
            </span>
          )}
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
