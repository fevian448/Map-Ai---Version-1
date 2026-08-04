import React, { useState, useEffect } from 'react';
import { GeoPoint, SettingsState } from '../types';
import { Smartphone, Radio, BatteryCharging, Navigation, ShieldCheck, Copy, Bell, Play, RefreshCw, Plus, MapPin, Zap, Volume2, Share2, Check, AlertCircle } from 'lucide-react';
import { startSirenSound, stopSirenSound } from '../lib/audio';
import { t } from '../lib/i18n';

interface PhoneTrackerTabProps {
  userLocation: GeoPoint;
  onLocateOnMap: (pt: GeoPoint) => void;
  settings: SettingsState;
}

interface TrackedDevice {
  id: string;
  name: string;
  model: string;
  location: GeoPoint;
  battery: number;
  isCharging: boolean;
  status: 'ONLINE' | 'MOVING' | 'OFFLINE';
  speedKmh: number;
  lastPingTime: string;
  isCurrentDevice?: boolean;
}

export const PhoneTrackerTab: React.FC<PhoneTrackerTabProps> = ({
  userLocation,
  onLocateOnMap,
  settings
}) => {
  const [backgroundServiceActive, setBackgroundServiceActive] = useState<boolean>(true);
  const [batteryLevel, setBatteryLevel] = useState<number>(88);
  const [isCharging, setIsCharging] = useState<boolean>(true);
  const [satellites, setSatellites] = useState<number>(22);
  const [accuracyMeters, setAccuracyMeters] = useState<number>(2.4);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [ringingDeviceId, setRingingDeviceId] = useState<string | null>(null);
  const [pairingModalOpen, setPairingModalOpen] = useState<boolean>(false);
  const [newDeviceName, setNewDeviceName] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');

  // Initial Tracked Devices List (All Online)
  const [devices, setDevices] = useState<TrackedDevice[]>([
    {
      id: 'dev_self',
      name: 'My Main Phone (Driver App)',
      model: 'Samsung Galaxy S24 Ultra (Android 14)',
      location: userLocation,
      battery: 98,
      isCharging: true,
      status: 'ONLINE',
      speedKmh: 0,
      lastPingTime: 'ONLINE 🟢 (Just now)',
      isCurrentDevice: true
    },
    {
      id: 'dev_maxim_1',
      name: 'Maxim Bike Driver #104',
      model: 'Infinix Note 30 (Android 13)',
      location: {
        latitude: userLocation.latitude + 0.003,
        longitude: userLocation.longitude - 0.005
      },
      battery: 89,
      isCharging: false,
      status: 'MOVING',
      speedKmh: 42,
      lastPingTime: 'ONLINE 🟢 (5s ago)'
    },
    {
      id: 'dev_grab_1',
      name: 'GrabFood Rider (Express)',
      model: 'Xiaomi Redmi Note 12 (Android 13)',
      location: {
        latitude: userLocation.latitude + 0.006,
        longitude: userLocation.longitude + 0.004
      },
      battery: 92,
      isCharging: true,
      status: 'MOVING',
      speedKmh: 36,
      lastPingTime: 'ONLINE 🟢 (2s ago)'
    },
    {
      id: 'dev_panda_1',
      name: 'Foodpanda Pink Rider #88',
      model: 'Vivo Y36 (Android 13)',
      location: {
        latitude: userLocation.latitude - 0.005,
        longitude: userLocation.longitude + 0.008
      },
      battery: 85,
      isCharging: false,
      status: 'MOVING',
      speedKmh: 28,
      lastPingTime: 'ONLINE 🟢 (8s ago)'
    },
    {
      id: 'dev_family_1',
      name: 'Family Member Phone (Sarah)',
      model: 'Google Pixel 8 Pro (Android 14)',
      location: {
        latitude: userLocation.latitude + 0.008,
        longitude: userLocation.longitude + 0.006
      },
      battery: 94,
      isCharging: false,
      status: 'ONLINE',
      speedKmh: 0,
      lastPingTime: 'ONLINE 🟢 (Just now)'
    }
  ]);

  // Keep self location updated
  useEffect(() => {
    setDevices((prev) =>
      prev.map((d) => (d.isCurrentDevice ? { ...d, location: userLocation } : d))
    );
  }, [userLocation]);

  // Handle Share Tracking Link
  const handleCopyLink = () => {
    const link = `https://mapai-tracker.app/live/${userLocation.latitude.toFixed(4)},${userLocation.longitude.toFixed(4)}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Ring remote device
  const handleRingDevice = (devId: string) => {
    if (ringingDeviceId === devId) {
      stopSirenSound();
      setRingingDeviceId(null);
    } else {
      startSirenSound();
      setRingingDeviceId(devId);
    }
  };

  // Add new device
  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;
    const newDev: TrackedDevice = {
      id: `dev_${Date.now()}`,
      name: newDeviceName.trim(),
      model: 'Android Device (Fused GPS)',
      location: {
        latitude: userLocation.latitude + (Math.random() - 0.5) * 0.02,
        longitude: userLocation.longitude + (Math.random() - 0.5) * 0.02
      },
      battery: Math.floor(Math.random() * 40) + 60,
      isCharging: false,
      status: 'ONLINE',
      speedKmh: 0,
      lastPingTime: 'Just now'
    };
    setDevices([...devices, newDev]);
    setNewDeviceName('');
    setPairingCode('');
    setPairingModalOpen(false);
  };

  return (
    <div id="phone-tracker-tab-screen" className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 space-y-4 pb-24">
      {/* Phone Tracker Main Status Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/80 border border-cyan-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/10">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase font-extrabold tracking-wider text-cyan-400 flex items-center gap-1.5">
                <span>ANDROID PHONE TRACKER</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h2 className="text-sm font-bold text-white">FusedLocationProvider Active</h2>
            </div>
          </div>

          <button
            onClick={() => setBackgroundServiceActive(!backgroundServiceActive)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              backgroundServiceActive
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {backgroundServiceActive ? 'Foreground Service ON' : 'Service Paused'}
          </button>
        </div>

        {/* GPS Live Telemetry Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <BatteryCharging className="w-3 h-3 text-emerald-400" />
              <span>Battery</span>
            </div>
            <div className="text-sm font-bold text-emerald-400 mt-1">
              {batteryLevel}% {isCharging && '⚡'}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400" />
              <span>Accuracy</span>
            </div>
            <div className="text-sm font-bold text-cyan-300 mt-1">±{accuracyMeters} m</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Satellites</span>
            </div>
            <div className="text-sm font-bold text-amber-300 mt-1">{satellites} Fixed</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-purple-400" />
              <span>Ping Interval</span>
            </div>
            <div className="text-sm font-bold text-purple-300 mt-1">Real-time (1s)</div>
          </div>
        </div>

        {/* Live Coordinates Display */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-mono text-cyan-300 truncate">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
            </span>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-[11px] flex items-center gap-1 shrink-0"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied!' : 'Share Live GPS'}</span>
          </button>
        </div>
      </div>

      {/* Paired Android Devices List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Tracked Android Phones</span>
            </h3>
            <p className="text-[11px] text-slate-400">Live position, speed & battery status</p>
          </div>

          <button
            onClick={() => setPairingModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Pair Phone</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {devices.map((dev) => {
            const isRinging = ringingDeviceId === dev.id;
            return (
              <div
                key={dev.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-2.5 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        dev.isCurrentDevice
                          ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                          : 'bg-slate-800 border border-slate-700 text-slate-300'
                      }`}
                    >
                      📱
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{dev.name}</span>
                        {dev.isCurrentDevice && (
                          <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-mono font-bold">
                            THIS PHONE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{dev.model}</div>
                    </div>
                  </div>

                  <div
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      dev.status === 'MOVING'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {dev.status === 'MOVING' ? `⚡ ${dev.speedKmh} km/h` : 'ONLINE'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <BatteryCharging className="w-3.5 h-3.5" />
                      {dev.battery}%
                    </span>
                    <span>• {dev.lastPingTime}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRingDevice(dev.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
                        isRinging
                          ? 'bg-red-600 text-white border-red-400 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isRinging ? 'Stop Alarm' : 'Ring Device'}</span>
                    </button>

                    <button
                      onClick={() => onLocateOnMap(dev.location)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Locate</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Geofence & Anti-Theft Safety Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Geofence & Anti-Theft Protection</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-white">Safe Zone Alerts</div>
              <div className="text-[10px] text-slate-400">Home & Work (1km Radius)</div>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">
              ACTIVE
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-white">Remote SOS Siren</div>
              <div className="text-[10px] text-slate-400">Loud theft alarm on lost phone</div>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">
              READY
            </span>
          </div>
        </div>
      </div>

      {/* Pair Device Modal */}
      {pairingModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <span>Pair New Android Phone</span>
              </h3>
              <button
                onClick={() => setPairingModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDevice} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Phone Name / Owner</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kid's Phone, Fleet #3..."
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">6-Digit Pairing Code / IMEI</label>
                <input
                  type="text"
                  placeholder="e.g. 892-104"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPairingModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20"
                >
                  Pair Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
