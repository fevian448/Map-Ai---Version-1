import React, { useState, useEffect, useCallback } from 'react';
import {
  GeoPoint,
  TrafficAlert,
  Place,
  RouteInfo,
  PlaceCategory,
  PLACE_CATEGORIES,
  SpeedCamera,
  WeatherInfo,
  Contributor,
  SettingsState,
  AlertTypeKey,
  CategoryKey
} from './types';
import {
  fetchAlerts,
  createReport,
  confirmReport,
  fetchPlaces,
  fetchContributors,
  getDirectionsRoute,
  generateSpeedCameras,
  getWeatherInfo,
  haversine
} from './services/api';
import { speakPrompt, playSpeedWarning } from './lib/audio';
import { NavigationHeader } from './components/NavigationHeader';
import { MapView } from './components/MapView';
import { AlertsTab } from './components/AlertsTab';
import { DriveTab } from './components/DriveTab';
import { PhoneTrackerTab } from './components/PhoneTrackerTab';
import { ExploreTab } from './components/ExploreTab';
import { ChatTab } from './components/ChatTab';
import { SosTab } from './components/SosTab';
import { ProfileTab } from './components/ProfileTab';
import { SettingsTab } from './components/SettingsTab';
import { ReportModal } from './components/ReportModal';
import { Map, ShieldAlert, Gauge, Compass, Bot, Radio, User, Settings as SettingsIcon, Smartphone } from 'lucide-react';
import { t } from './lib/i18n';

// Default Location: Central Jakarta (-6.2088, 106.8456) or Default Metros
const DEFAULT_LOCATION: GeoPoint = { latitude: -6.2088, longitude: 106.8456 };

export function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'drive' | 'tracker' | 'explore' | 'chat' | 'sos' | 'profile' | 'settings'>('map');

  // State
  const [userLocation, setUserLocation] = useState<GeoPoint>(DEFAULT_LOCATION);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [speedLimitKmh, setSpeedLimitKmh] = useState<number>(60);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [destinationName, setDestinationName] = useState<string>('');
  const [route, setRoute] = useState<RouteInfo | null>(null);

  const [alerts, setAlerts] = useState<TrafficAlert[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [speedCameras, setSpeedCameras] = useState<SpeedCamera[]>([]);
  const [weather, setWeather] = useState<WeatherInfo>(getWeatherInfo());
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>(PLACE_CATEGORIES[0]);

  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);

  const [settings, setSettings] = useState<SettingsState>({
    serverUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    mapProvider: 'osm',
    voiceGuidance: true,
    darkMode: true,
    speedUnit: 'kmh',
    language: 'en'
  });

  // Get User Real Geolocation if available
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setUserLocation(loc);
        },
        (_err) => {
          // Fall back to default location
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Fetch initial alerts, places, cameras, contributors
  const loadData = useCallback(async () => {
    const [fetchedAlerts, fetchedPlaces, fetchedContribs] = await Promise.all([
      fetchAlerts(userLocation),
      fetchPlaces(userLocation, selectedCategory.key),
      fetchContributors()
    ]);

    setAlerts(fetchedAlerts);
    setPlaces(fetchedPlaces);
    setContributors(fetchedContribs);
    setSpeedCameras(generateSpeedCameras(userLocation, 4));
  }, [userLocation, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Navigation / Drive simulation movement
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isNavigating && destination && route && route.points.length > 1) {
      let stepIdx = 0;
      interval = setInterval(() => {
        stepIdx = (stepIdx + 1) % route.points.length;
        const currentPt = route.points[stepIdx];
        setUserLocation(currentPt);

        // Simulate speed fluctuation
        const simSpeed = 45 + Math.sin(stepIdx) * 25;
        setSpeedKmh(simSpeed);

        if (simSpeed > speedLimitKmh && settings.voiceGuidance) {
          playSpeedWarning();
        }

        // Voice prompt at start
        if (stepIdx === 1 && settings.voiceGuidance) {
          speakPrompt(`Navigating to ${destinationName}. Drive safely.`, settings.language);
        }
      }, 3000);
    } else {
      setSpeedKmh(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isNavigating, destination, route, speedLimitKmh, settings.voiceGuidance, settings.language, destinationName]);

  // Actions
  const handleSelectDestination = async (point: GeoPoint | null, name: string) => {
    if (!point) {
      setDestination(null);
      setDestinationName('');
      setRoute(null);
      setIsNavigating(false);
      return;
    }

    setDestination(point);
    setDestinationName(name || 'Selected Destination');
    setActiveTab('map');

    const calculatedRoute = await getDirectionsRoute(userLocation, point);
    setRoute(calculatedRoute);
  };

  const handleStartNavigation = () => {
    if (!destination) return;
    setIsNavigating(true);
    if (settings.voiceGuidance) {
      speakPrompt(`Starting navigation to ${destinationName}`, settings.language);
    }
  };

  const handleStopNavigation = () => {
    setIsNavigating(false);
    setSpeedKmh(0);
  };

  const handleCreateReport = async (type: AlertTypeKey, description: string) => {
    const newReport = await createReport(type, userLocation, description, 'You');
    if (newReport) {
      setAlerts((prev) => [newReport, ...prev]);
    }
    setReportModalOpen(false);
  };

  const handleConfirmAlert = async (id: string) => {
    await confirmReport(id);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, confirmedBy: a.confirmedBy + 1 } : a))
    );
  };

  const handleSelectCategory = async (cat: PlaceCategory) => {
    setSelectedCategory(cat);
    const updatedPlaces = await fetchPlaces(userLocation, cat.key);
    setPlaces(updatedPlaces);
  };

  const updateSettings = (newSettings: Partial<SettingsState>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Banner when Navigating */}
      {isNavigating && (
        <NavigationHeader
          destinationName={destinationName}
          route={route}
          speedKmh={speedKmh}
          speedLimitKmh={speedLimitKmh}
          onStop={handleStopNavigation}
          settings={settings}
        />
      )}

      {/* Main Tab View Content */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {activeTab === 'map' && (
          <MapView
            userLocation={userLocation}
            destination={destination}
            destinationName={destinationName}
            route={route}
            alerts={alerts}
            places={places}
            speedCameras={speedCameras}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            onSelectDestination={handleSelectDestination}
            onOpenReportModal={() => setReportModalOpen(true)}
            onStartNavigation={handleStartNavigation}
            isNavigating={isNavigating}
            settings={settings}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsTab
            alerts={alerts}
            onConfirmAlert={handleConfirmAlert}
            onOpenReportModal={() => setReportModalOpen(true)}
            settings={settings}
          />
        )}

        {activeTab === 'drive' && (
          <DriveTab
            speedKmh={speedKmh}
            speedLimitKmh={speedLimitKmh}
            speedCameras={speedCameras}
            weather={weather}
            isNavigating={isNavigating}
            onStartNavigation={handleStartNavigation}
            onStopNavigation={handleStopNavigation}
            alerts={alerts}
            onOpenReportModal={() => setReportModalOpen(true)}
            settings={settings}
          />
        )}

        {activeTab === 'tracker' && (
          <PhoneTrackerTab
            userLocation={userLocation}
            onLocateOnMap={(pt) => {
              setUserLocation(pt);
              setActiveTab('map');
            }}
            settings={settings}
          />
        )}

        {activeTab === 'explore' && (
          <ExploreTab
            places={places}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            onSelectDestination={handleSelectDestination}
            settings={settings}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab
            settings={settings}
            userLocation={userLocation}
            places={places}
            onSelectDestination={handleSelectDestination}
            onStartNavigation={handleStartNavigation}
          />
        )}

        {activeTab === 'sos' && <SosTab userLocation={userLocation} settings={settings} />}

        {activeTab === 'profile' && <ProfileTab contributors={contributors} settings={settings} />}

        {activeTab === 'settings' && (
          <SettingsTab settings={settings} onUpdateSettings={updateSettings} />
        )}
      </main>

      {/* Report Modal */}
      {reportModalOpen && (
        <ReportModal
          onClose={() => setReportModalOpen(false)}
          onSubmit={handleCreateReport}
          userLocation={userLocation}
          settings={settings}
        />
      )}

      {/* Bottom Dock / Navigation Bar */}
      <nav id="bottom-navigation-dock" className="fixed bottom-0 left-0 right-0 z-[1500] bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
            activeTab === 'map' ? 'text-cyan-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[10px]">{t('nav_map', settings.language)}</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all relative ${
            activeTab === 'alerts' ? 'text-amber-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-5 h-5" />
          <span className="text-[10px]">{t('nav_alerts', settings.language)}</span>
          {alerts.length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('drive')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
            activeTab === 'drive' ? 'text-cyan-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-5 h-5" />
          <span className="text-[10px]">{t('nav_drive', settings.language)}</span>
        </button>

        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all relative ${
            activeTab === 'tracker' ? 'text-cyan-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-5 h-5 text-cyan-400" />
          <span className="text-[10px]">{t('nav_tracker', settings.language)}</span>
          <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </button>

        <button
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
            activeTab === 'explore' ? 'text-cyan-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">{t('nav_explore', settings.language)}</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
            activeTab === 'chat' ? 'text-cyan-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-5 h-5" />
          <span className="text-[10px]">{t('nav_chat', settings.language)}</span>
        </button>

        <button
          onClick={() => setActiveTab('sos')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
            activeTab === 'sos' ? 'text-red-500 scale-105 font-bold' : 'text-red-400/70 hover:text-red-400'
          }`}
        >
          <Radio className="w-5 h-5 animate-pulse" />
          <span className="text-[10px] font-bold">{t('nav_sos', settings.language)}</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
            activeTab === 'profile' ? 'text-cyan-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">{t('nav_profile', settings.language)}</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
            activeTab === 'settings' ? 'text-cyan-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[10px]">{t('nav_settings', settings.language)}</span>
        </button>
      </nav>
    </div>
  );
}
