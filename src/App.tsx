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
  CategoryKey,
  SystemLog,
  SubscriptionState
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
  haversine,
  fetchTierStatus
} from './services/api';
import { speakPrompt, playSpeedWarning } from './lib/audio';
import { autoDownloadOfflineOnFirstInstall, getOfflineMapPackMeta } from './services/offlineMapStore';
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
import { TvInstallModal } from './components/TvInstallModal';
import { AppBuilderStudioModal } from './components/AppBuilderStudioModal';
import { FloatingAiCopilot } from './components/FloatingAiCopilot';
import { GalleryVaultTab } from './components/GalleryVaultTab';
import { GoogleWorkspaceHub } from './components/GoogleWorkspaceHub';
import { GitLabHub } from './components/GitLabHub';
import { SubscriptionModal } from './components/SubscriptionModal';
import { GeospatialAiModal } from './components/GeospatialAiModal';
import { Map, ShieldAlert, Gauge, Compass, Bot, Radio, User, Settings as SettingsIcon, Smartphone, Tv, HardDrive, Camera, Sparkles, Gitlab } from 'lucide-react';
import { t } from './lib/i18n';
import { ActiveDriver } from './types';
import { fetchActiveDrivers } from './services/api';

// Default Location: Central Jakarta (-6.2088, 106.8456) or Default Metros
const DEFAULT_LOCATION: GeoPoint = { latitude: -6.2088, longitude: 106.8456 };

export function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'drive' | 'tracker' | 'gallery' | 'explore' | 'chat' | 'sos' | 'profile' | 'settings' | 'workspace' | 'gitlab'>('map');
  const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([]);

  // System Logs & Telemetry
  const [logs, setLogs] = useState<SystemLog[]>([
    {
      id: 'log_1',
      timestamp: new Date().toLocaleTimeString(),
      category: 'SYSTEM',
      level: 'info',
      message: 'MapAi system initialized with full permissions & Google AI Studio monitor'
    },
    {
      id: 'log_2',
      timestamp: new Date().toLocaleTimeString(),
      category: 'PERMISSIONS',
      level: 'success',
      message: 'Frame permissions verified: Geolocation, Camera, Microphone'
    }
  ]);

  const addLog = useCallback(
    (
      category: 'GPS' | 'AI' | 'PERMISSIONS' | 'SOCKET' | 'SYSTEM' | 'NAVIGATION',
      level: 'info' | 'warn' | 'error' | 'success',
      message: string
    ) => {
      setLogs((prev) => [
        {
          id: `log_${Date.now()}_${Math.random()}`,
          timestamp: new Date().toLocaleTimeString(),
          category,
          level,
          message
        },
        ...prev.slice(0, 99)
      ]);
    },
    []
  );

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
  const [tvModalOpen, setTvModalOpen] = useState<boolean>(false);
  const [appBuilderModalOpen, setAppBuilderModalOpen] = useState<boolean>(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState<boolean>(false);
  const [geospatialModalOpen, setGeospatialModalOpen] = useState<boolean>(false);

  // User Subscription & Rate Limit Quota State
  const [subscription, setSubscription] = useState<SubscriptionState>(() => {
    const saved = localStorage.getItem('mapai_user_tier');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_e) {}
    }
    return {
      tier: 'FREE',
      dailyQueriesLimit: 15,
      queriesUsedToday: 0,
      lastResetDate: new Date().toISOString().split('T')[0]
    };
  });

  useEffect(() => {
    fetchTierStatus('current_user')
      .then((status) => {
        setSubscription(status);
        localStorage.setItem('mapai_user_tier', JSON.stringify(status));
      })
      .catch((_err) => {
        // Fallback silently if offline
      });
  }, []);

  const [settings, setSettings] = useState<SettingsState>({
    serverUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    mapProvider: 'osm',
    voiceGuidance: true,
    darkMode: true,
    speedUnit: 'kmh',
    language: 'en',
    aiProvider: 'gemini_flash',
    enableFloatingAi: true,
    floatingAiMode: 'float',
    floatingUiLayout: 'standard',
    autoConfigMonitoring: true
  });

  // Auto download compact offline map tiles on initial install / first launch
  const [offlineMapNotice, setOfflineMapNotice] = useState<string | null>(null);

  useEffect(() => {
    const meta = getOfflineMapPackMeta();
    if (!meta) {
      setOfflineMapNotice('📥 Memuat turun data peta offline secara automatik (~1.5MB tile cache)...');
      autoDownloadOfflineOnFirstInstall(userLocation, (pct) => {
        if (pct < 100) {
          setOfflineMapNotice(`📥 Auto Download Peta Offline HP (${pct}%)...`);
        } else {
          setOfflineMapNotice('✅ Data Peta Offline Siap Di-cache ke Telefon!');
          addLog('OFFLINE_MAP', 'success', 'Auto-downloaded compact offline map tiles on app install');
          setTimeout(() => setOfflineMapNotice(null), 4000);
        }
      });
    }
  }, [userLocation, addLog]);

  // Get User Real Geolocation with Continuous Live GPS Watcher & Worldwide Fallback
  useEffect(() => {
    let watchId: number | null = null;

    const locateByIp = async () => {
      try {
        addLog('GPS', 'info', 'Attempting Worldwide IP Geolocation fallback...');
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            const loc = { latitude: data.latitude, longitude: data.longitude };
            setUserLocation(loc);
            addLog('GPS', 'success', `Worldwide Location acquired via IP (${data.city || 'City'}, ${data.country_name || 'World'}): [${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}]`);
          }
        }
      } catch (_e) {
        addLog('GPS', 'info', 'Using standard worldwide central coordinates');
      }
    };

    if ('geolocation' in navigator) {
      addLog('PERMISSIONS', 'info', 'Starting Continuous Real-Time GPS Tracking...');
      
      // 1. Immediate initial position fix
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setUserLocation(loc);
          addLog('GPS', 'success', `Initial GPS fix acquired: (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`);
        },
        (err) => {
          addLog('GPS', 'warn', `GPS initial warning (${err.code}): ${err.message}. Triggering worldwide fallback...`);
          locateByIp();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // 2. Continuous real-time location stream watcher
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setUserLocation(loc);
          if (pos.coords.speed !== null && pos.coords.speed > 0) {
            setSpeedKmh(Math.round(pos.coords.speed * 3.6));
          }
        },
        (err) => {
          // Non-blocking watch warning
          if (err.code === 1) {
            addLog('GPS', 'warn', 'Location permission denied by user. Please allow Location in browser/device settings.');
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
      );
    } else {
      locateByIp();
    }

    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [addLog]);

  // Fetch initial alerts, places, cameras, contributors, and active drivers
  const loadData = useCallback(async () => {
    const [fetchedAlerts, fetchedPlaces, fetchedContribs, fetchedDrivers] = await Promise.all([
      fetchAlerts(userLocation),
      fetchPlaces(userLocation, selectedCategory.key),
      fetchContributors(),
      fetchActiveDrivers(userLocation)
    ]);

    setAlerts(fetchedAlerts);
    setPlaces(fetchedPlaces);
    setContributors(fetchedContribs);
    setActiveDrivers(fetchedDrivers);
    setSpeedCameras(generateSpeedCameras(userLocation, 4));
  }, [userLocation, selectedCategory]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      fetchActiveDrivers(userLocation).then((drvs) => setActiveDrivers(drvs));
    }, 10000);
    return () => clearInterval(interval);
  }, [loadData, userLocation]);

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
      {/* Auto Offline Map Download Notice Banner */}
      {offlineMapNotice && (
        <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-slate-950 font-black text-xs py-1.5 px-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span>{offlineMapNotice}</span>
            <span className="text-[10px] bg-slate-950 text-cyan-300 px-2 py-0.5 rounded font-mono hidden sm:inline-block">
              COMPACT TILE CACHE
            </span>
          </div>
          <button
            onClick={() => setOfflineMapNotice(null)}
            className="ml-2 bg-slate-950/80 hover:bg-slate-950 text-cyan-300 hover:text-white px-2 py-0.5 rounded text-[11px] font-bold border border-cyan-400/50 transition-all flex items-center gap-1 shrink-0"
            title="Tutup / Skip Alert Ini"
          >
            <span>Skip / Close</span>
            <span>✕</span>
          </button>
        </div>
      )}

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
            activeDrivers={activeDrivers}
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

        {activeTab === 'gallery' && <GalleryVaultTab userLocation={userLocation} settings={settings} />}

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
            subscription={subscription}
            onOpenUpgradeModal={() => setSubscriptionModalOpen(true)}
            onOpenGeospatialModal={() => setGeospatialModalOpen(true)}
            onUpdateSubscription={(sub) => {
              setSubscription(sub);
              localStorage.setItem('mapai_user_tier', JSON.stringify(sub));
            }}
          />
        )}

        {activeTab === 'sos' && <SosTab userLocation={userLocation} settings={settings} />}

        {activeTab === 'profile' && (
          <ProfileTab
            contributors={contributors}
            settings={settings}
            subscription={subscription}
            onOpenUpgradeModal={() => setSubscriptionModalOpen(true)}
            onUpdateSubscription={(sub) => {
              setSubscription(sub);
              localStorage.setItem('mapai_user_tier', JSON.stringify(sub));
            }}
          />
        )}

        {activeTab === 'workspace' && (
          <GoogleWorkspaceHub
            userLocation={userLocation}
            destinationName={destinationName}
            onSelectDestination={handleSelectDestination}
            onStartNavigation={handleStartNavigation}
            settings={settings}
          />
        )}

        {activeTab === 'gitlab' && (
          <GitLabHub
            userLocation={userLocation}
            destinationName={destinationName}
            settings={settings}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            onUpdateSettings={updateSettings}
            onOpenInstallStudio={() => setTvModalOpen(true)}
            onOpenAppBuilder={() => setAppBuilderModalOpen(true)}
            logs={logs}
            onClearLogs={() => setLogs([])}
            userLocation={userLocation}
            speedKmh={speedKmh}
          />
        )}
      </main>

      {/* Floating AI Copilot Widget (Active on Map & main views when enabled) */}
      {settings.enableFloatingAi && activeTab !== 'chat' && (
        <FloatingAiCopilot
          settings={settings}
          userLocation={userLocation}
          places={places}
          onSelectDestination={handleSelectDestination}
          onStartNavigation={handleStartNavigation}
          onAddLog={addLog}
          onToggleDock={() => updateSettings({ enableFloatingAi: false, floatingAiMode: 'docked' })}
          subscription={subscription}
          onOpenUpgradeModal={() => setSubscriptionModalOpen(true)}
          onUpdateSubscription={(sub) => {
            setSubscription(sub);
            localStorage.setItem('mapai_user_tier', JSON.stringify(sub));
          }}
        />
      )}

      {/* Subscription / Plan Upgrade Modal */}
      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        currentTier={subscription.tier}
        onUpgradeSuccess={(newTier) => {
          const updated: SubscriptionState = {
            tier: newTier,
            dailyQueriesLimit: newTier === 'PRO' || newTier === 'ENTERPRISE' ? 999999 : 15,
            queriesUsedToday: subscription.queriesUsedToday,
            lastResetDate: subscription.lastResetDate
          };
          setSubscription(updated);
          localStorage.setItem('mapai_user_tier', JSON.stringify(updated));
          addLog('AI', 'success', `User account successfully upgraded to ${newTier} plan!`);
        }}
      />

      {/* Geospatial AI & Location Intelligence Modal */}
      <GeospatialAiModal
        isOpen={geospatialModalOpen}
        onClose={() => setGeospatialModalOpen(false)}
        userLocation={userLocation}
        subscriptionTier={subscription.tier}
        onOpenUpgradeModal={() => {
          setGeospatialModalOpen(false);
          setSubscriptionModalOpen(true);
        }}
      />

      {/* Report Modal */}
      {reportModalOpen && (
        <ReportModal
          onClose={() => setReportModalOpen(false)}
          onSubmit={handleCreateReport}
          userLocation={userLocation}
          settings={settings}
        />
      )}

      {/* Universal Installation & Smart TV Modal */}
      <TvInstallModal isOpen={tvModalOpen} onClose={() => setTvModalOpen(false)} />

      {/* Custom App Creator & SDK Studio Modal */}
      <AppBuilderStudioModal
        isOpen={appBuilderModalOpen}
        onClose={() => setAppBuilderModalOpen(false)}
        settings={settings}
      />

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
          onClick={() => setActiveTab('gallery')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
            activeTab === 'gallery' ? 'text-cyan-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-5 h-5" />
          <span className="text-[10px]">{t('nav_gallery', settings.language)}</span>
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
          onClick={() => setActiveTab('workspace')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all relative ${
            activeTab === 'workspace' ? 'text-cyan-400 scale-105 font-bold' : 'text-cyan-400/80 hover:text-cyan-300'
          }`}
        >
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span className="text-[10px] font-bold">Workspace</span>
          <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        </button>

        <button
          onClick={() => setActiveTab('gitlab')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
            activeTab === 'gitlab' ? 'text-orange-400 scale-105 font-bold' : 'text-orange-400/80 hover:text-orange-300'
          }`}
        >
          <Gitlab className="w-5 h-5 text-orange-400" />
          <span className="text-[10px] font-bold">GitLab</span>
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
