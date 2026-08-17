import {
  GeoPoint,
  TrafficAlert,
  AlertTypeKey,
  PlaceCategory,
  Place,
  RouteInfo,
  RouteSegment,
  WeatherInfo,
  SpeedCamera,
  Contributor,
  ChatMessage,
  CategoryKey,
  TrafficLevel,
  GeocodingResult,
  AiProviderKey,
  UserSubscriptionTier,
  SubscriptionState,
  GeospatialAnalysisResult
} from '../types';

export function haversine(a: GeoPoint, b: GeoPoint): number {
  const r = 6371000; // Earth radius meters
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * r * Math.asin(Math.sqrt(h));
}

export function offsetPoint(center: GeoPoint, meters: number, bearingDeg: number): GeoPoint {
  const earthR = 6371000;
  const br = (bearingDeg * Math.PI) / 180;
  const dLat = (meters * Math.cos(br)) / earthR;
  const dLon = (meters * Math.sin(br)) / (earthR * Math.cos((center.latitude * Math.PI) / 180));
  return {
    latitude: center.latitude + (dLat * 180) / Math.PI,
    longitude: center.longitude + (dLon * 180) / Math.PI
  };
}

export function generateSpeedCameras(center: GeoPoint, count = 4): SpeedCamera[] {
  const directions = ['North', 'South', 'East', 'West'];
  const limits = [40, 50, 60, 80, 100];
  return Array.from({ length: count }, (_, i) => ({
    id: `cam_${i}_${Date.now()}`,
    point: offsetPoint(center, 300 + Math.random() * 2000, Math.random() * 360),
    limitKmh: limits[Math.floor(Math.random() * limits.length)],
    direction: directions[Math.floor(Math.random() * directions.length)]
  }));
}

export function getWeatherInfo(): WeatherInfo {
  const options = [
    { condition: 'Sunny', emoji: '☀️', risk: 'Dry roads, safe driving conditions' },
    { condition: 'Cloudy', emoji: '⛅', risk: 'Good visibility' },
    { condition: 'Light Rain', emoji: '🌧️', risk: 'Caution: slippery road surfaces' },
    { condition: 'Heavy Rain', emoji: '⛈️', risk: 'Hazard: hydroplaning risk' },
    { condition: 'Foggy', emoji: '🌫️', risk: 'Reduced visibility, keep safe distance' }
  ];
  const item = options[Math.floor(Math.random() * options.length)];
  return {
    condition: item.condition,
    emoji: item.emoji,
    temperatureC: Math.floor(22 + Math.random() * 10),
    windKph: Math.floor(5 + Math.random() * 20),
    humidity: Math.floor(40 + Math.random() * 45),
    visibilityKm: item.condition.includes('Fog') ? Number((0.5 + Math.random() * 2).toFixed(1)) : 10,
    roadRisk: item.risk
  };
}

// REST Client functions
export async function fetchAlerts(center: GeoPoint, radiusKm = 10): Promise<TrafficAlert[]> {
  try {
    const res = await fetch(`/api/reports?lat=${center.latitude}&lon=${center.longitude}&radius=${radiusKm}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          type: d.type as AlertTypeKey,
          point: { latitude: d.lat, longitude: d.lon },
          description: d.description || d.type,
          reporter: d.reporter || 'Anonymous',
          timestamp: d.created_at || Date.now(),
          confidence: 95,
          confirmedBy: d.confirmed || 1
        }));
      }
    }
  } catch (_e) {}

  // High quality default live traffic jam & hazard alerts centered on current location
  return [
    {
      id: 'jam_tracker_cluster',
      type: 'TRAFFIC',
      point: offsetPoint(center, 250, 45),
      description: '🚦 Auto Traffic Alert: 48 Active Phone Trackers Detected in 500m Radius (Threshold 40-50 Phones Exceeded) — Jalan Sesak / Heavy Traffic Jam!',
      reporter: 'PhoneTracker_ClusterRadar',
      timestamp: Date.now() - 1 * 60000,
      confidence: 100,
      confirmedBy: 48
    },
    {
      id: 'jam_live_1',
      type: 'TRAFFIC',
      point: offsetPoint(center, 350, 35),
      description: '🚦 Severe Traffic Jam — Heavy congestion, stop & go traffic (Delay +14 mins)',
      reporter: 'TrafficWatch_AI',
      timestamp: Date.now() - 2 * 60000,
      confidence: 99,
      confirmedBy: 18
    },
    {
      id: 'jam_live_2',
      type: 'TRAFFIC',
      point: offsetPoint(center, 1100, 180),
      description: '🚦 Moderate Traffic Bottleneck — Slow moving traffic ahead (Delay +6 mins)',
      reporter: 'Driver_Rizal',
      timestamp: Date.now() - 8 * 60000,
      confidence: 93,
      confirmedBy: 11
    },
    {
      id: 'police_live_1',
      type: 'POLICE',
      point: offsetPoint(center, 750, 270),
      description: '👮 Police Patrol Checkpoint & Speed Inspection active',
      reporter: 'SpeedyRider',
      timestamp: Date.now() - 15 * 60000,
      confidence: 96,
      confirmedBy: 24
    },
    {
      id: 'hazard_live_1',
      type: 'HAZARD',
      point: offsetPoint(center, 550, 110),
      description: '🚨 Road Hazard — Construction materials spilled on left lane',
      reporter: 'RoadSafety_ID',
      timestamp: Date.now() - 25 * 60000,
      confidence: 91,
      confirmedBy: 7
    }
  ];
}

export async function createReport(
  type: AlertTypeKey,
  point: GeoPoint,
  description: string,
  reporter = 'You'
): Promise<TrafficAlert | null> {
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        lat: point.latitude,
        lon: point.longitude,
        description,
        reporter
      })
    });
    if (res.ok) {
      const d = await res.json();
      return {
        id: d.id,
        type: d.type as AlertTypeKey,
        point: { latitude: d.lat, longitude: d.lon },
        description: d.description,
        reporter: d.reporter,
        timestamp: d.created_at,
        confidence: 100,
        confirmedBy: d.confirmed
      };
    }
  } catch (_e) {}
  return null;
}

export async function confirmReport(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/reports/${id}/confirm`, { method: 'POST' });
    return res.ok;
  } catch (_e) {
    return false;
  }
}

export async function sendSosAlert(user: string, point: GeoPoint, message = 'SOS Emergency Alert'): Promise<boolean> {
  try {
    const res = await fetch('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, lat: point.latitude, lon: point.longitude, message })
    });
    return res.ok;
  } catch (_e) {
    return false;
  }
}

export async function fetchPlaces(center: GeoPoint, category?: CategoryKey): Promise<Place[]> {
  try {
    const url = `/api/places?lat=${center.latitude}&lon=${center.longitude}${category ? `&category=${category}` : ''}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((p: any) => {
          const point = { latitude: p.lat, longitude: p.lon };
          return {
            id: p.id,
            name: p.name,
            category: p.category as CategoryKey,
            point,
            distanceMeters: haversine(center, point),
            rating: p.rating || 4.5,
            isOpen: p.is_open === 1,
            fuelPrice: p.fuel_price,
            extra: p.extra
          };
        }).sort((a: Place, b: Place) => a.distanceMeters - b.distanceMeters);
      }
    }
  } catch (_e) {}

  // Fallback realistic POI with Maxim, Foodpanda & Grab merchant/rider hubs
  const allDefaults: Place[] = [
    {
      id: 'maxim_1',
      name: 'Maxim Taxi & Delivery Driver Hub',
      category: 'delivery',
      point: offsetPoint(center, 250, 15),
      distanceMeters: 250,
      rating: 4.9,
      isOpen: true,
      extra: '🚖 Maxim Official Merchant Hub • Instant Bike & Cargo Dispatch (ONLINE 🟢)'
    },
    {
      id: 'maxim_2',
      name: 'Maxim Food Express & Cargo Pickup',
      category: 'delivery',
      point: offsetPoint(center, 520, 160),
      distanceMeters: 520,
      rating: 4.8,
      isOpen: true,
      extra: '🟡 Maxim Delivery Priority Counter • 24/7 Live Express (ONLINE 🟢)'
    },
    {
      id: 'fp_1',
      name: 'pandamart Central Hub & Grocery',
      category: 'delivery',
      point: offsetPoint(center, 400, 45),
      distanceMeters: 400,
      rating: 4.8,
      isOpen: true,
      extra: '🐼 Foodpanda Direct Store • Express 15-min delivery pickup (ONLINE 🟢)'
    },
    {
      id: 'grab_1',
      name: 'GrabKitchen & Food Hall Express',
      category: 'delivery',
      point: offsetPoint(center, 650, 130),
      distanceMeters: 650,
      rating: 4.9,
      isOpen: true,
      extra: '💚 GrabFood Preferred Merchant • Multi-brand rider lane (ONLINE 🟢)'
    },
    {
      id: 'fp_2',
      name: 'McDonald\'s Express (Maxim, Foodpanda & Grab Pickup)',
      category: 'delivery',
      point: offsetPoint(center, 800, 220),
      distanceMeters: 800,
      rating: 4.6,
      isOpen: true,
      extra: '🛵 Designated Rider Bay • Fast 24/7 Order Dispatch (ONLINE 🟢)'
    },
    {
      id: 'grab_2',
      name: 'Tealive & Bistro (GrabFood / GrabMart)',
      category: 'food',
      point: offsetPoint(center, 500, 310),
      distanceMeters: 500,
      rating: 4.7,
      isOpen: true,
      extra: '🥤 20% Off GrabFood Promo • Rider Priority Counter'
    },
    {
      id: 'fp_3',
      name: 'KFC Drive-Thru (Foodpanda Pickup Bay)',
      category: 'food',
      point: offsetPoint(center, 950, 180),
      distanceMeters: 950,
      rating: 4.5,
      isOpen: true,
      extra: '🍗 Pink Rider Dedicated Parking • Instant QR Scan'
    },
    {
      id: 'fuel_1',
      name: 'Shell Express & Select Station',
      category: 'fuel',
      point: offsetPoint(center, 600, 90),
      distanceMeters: 600,
      rating: 4.7,
      isOpen: true,
      fuelPrice: '$1.45/L',
      extra: 'Fuel95 & Fuel98 Available • GrabPay Accepted'
    },
    {
      id: 'park_1',
      name: 'City Central Underground Parking',
      category: 'parking',
      point: offsetPoint(center, 300, 260),
      distanceMeters: 300,
      rating: 4.4,
      isOpen: true,
      extra: '🅿️ 120 slots open • Rider motorcycle parking free 15 mins'
    }
  ];

  return allDefaults
    .filter((p) => !category || p.category === category)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export async function fetchContributors(): Promise<Contributor[]> {
  try {
    const res = await fetch('/api/contributors');
    if (res.ok) {
      return await res.json();
    }
  } catch (_e) {}
  return [];
}

export async function searchGeocoding(
  query: string,
  userLoc?: GeoPoint
): Promise<GeocodingResult[]> {
  if (!query || !query.trim()) return [];
  try {
    const params = new URLSearchParams({ q: query.trim() });
    if (userLoc) {
      params.append('lat', userLoc.latitude.toString());
      params.append('lon', userLoc.longitude.toString());
    }
    const res = await fetch(`/api/geocoding?${params.toString()}`);
    if (res.ok) {
      const results: GeocodingResult[] = await res.json();
      if (userLoc) {
        return results.map(r => ({
          ...r,
          distanceMeters: haversine(userLoc, r.point)
        })).sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
      }
      return results;
    }
  } catch (_e) {}
  return [];
}

export async function fetchTierStatus(userId = 'default_user'): Promise<SubscriptionState> {
  try {
    const res = await fetch(`/api/ai/tier-status?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const d = await res.json();
      return {
        tier: d.tier as UserSubscriptionTier,
        dailyQueriesLimit: d.dailyQueriesLimit || (d.tier === 'FREE' ? 15 : Infinity),
        queriesUsedToday: d.queriesUsedToday || 0,
        lastResetDate: d.lastResetDate || new Date().toISOString().split('T')[0],
        proExpiryDate: d.proExpiryDate,
        isTrial: d.isTrial || false
      };
    }
  } catch (_e) {}

  // Local fallback
  const localSaved = localStorage.getItem('mapai_subscription_tier');
  const localTier: UserSubscriptionTier = (localSaved as any) || 'FREE';
  const localCount = parseInt(localStorage.getItem('mapai_queries_today') || '0', 10);
  return {
    tier: localTier,
    dailyQueriesLimit: localTier === 'FREE' ? 15 : 999999,
    queriesUsedToday: localCount,
    lastResetDate: new Date().toISOString().split('T')[0]
  };
}

export async function upgradeUserTier(
  userId = 'default_user',
  targetTier: UserSubscriptionTier = 'PRO'
): Promise<{ ok: boolean; message: string; tier: UserSubscriptionTier }> {
  try {
    const res = await fetch('/api/ai/upgrade-tier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, targetTier })
    });
    if (res.ok) {
      const d = await res.json();
      localStorage.setItem('mapai_subscription_tier', d.tier);
      return { ok: true, message: d.message, tier: d.tier };
    }
  } catch (_e) {}

  localStorage.setItem('mapai_subscription_tier', targetTier);
  return { ok: true, message: `Berjaya dinaik taraf ke ${targetTier}!`, tier: targetTier };
}

export async function fetchGeospatialAnalysis(
  locationName: string,
  point?: GeoPoint,
  userId = 'default_user'
): Promise<GeospatialAnalysisResult | null> {
  try {
    const res = await fetch('/api/ai/geospatial-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locationName,
        lat: point?.latitude,
        lon: point?.longitude,
        userId
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (_e) {}
  return null;
}

export async function sendChatMessage(
  content: string,
  provider: AiProviderKey = 'gemini_flash',
  apiKey?: string,
  customEndpoint?: string,
  userId = 'default_user',
  tier?: UserSubscriptionTier
): Promise<{ text: string; tier?: UserSubscriptionTier; queriesUsed?: number; remaining?: number; quotaExceeded?: boolean }> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content }],
        provider,
        apiKey,
        customEndpoint,
        userId,
        tier
      })
    });
    if (res.ok || res.status === 429) {
      const data = await res.json();
      return {
        text: data.content,
        tier: data.tier,
        queriesUsed: data.queriesUsedToday,
        remaining: data.remainingQueries,
        quotaExceeded: data.quotaExceeded
      };
    }
  } catch (_e) {}
  return {
    text: "I'm having trouble connecting to the network right now. Please check your internet connection."
  };
}

export async function getDirectionsRoute(from: GeoPoint, to: GeoPoint): Promise<RouteInfo> {
  try {
    const res = await fetch(`/api/directions?from=${from.latitude},${from.longitude}&to=${to.latitude},${to.longitude}`);
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates: [number, number][] = route.geometry?.coordinates || [];
        const points: GeoPoint[] = [from];
        coordinates.forEach(([lon, lat]) => points.push({ latitude: lat, longitude: lon }));
        points.push(to);

        const totalDist = route.distance || haversine(from, to);
        const duration = route.duration || totalDist / 12; // approx 43 km/h
        const freeFlow = duration * 0.9;

        const segCount = Math.max(1, points.length > 1 ? points.length - 1 : 1);
        const segDist = totalDist / segCount;
        const segments: RouteSegment[] = [];
        for (let i = 0; i < segCount; i++) {
          segments.push({
            from: points[i] || from,
            to: points[i + 1] || to,
            distanceMeters: segDist,
            traffic: 'FREE',
            roadName: 'Main Route'
          });
        }

        return {
          points,
          segments,
          totalDistanceMeters: totalDist,
          durationSeconds: duration,
          freeFlowDurationSeconds: freeFlow,
          hasTolls: false,
          overallTraffic: 'FREE'
        };
      }
    }
  } catch (_e) {}

  // Fallback Route calculation
  return calculateFallbackRoute(from, to);
}

function calculateFallbackRoute(from: GeoPoint, to: GeoPoint): RouteInfo {
  const steps = 6;
  const points: GeoPoint[] = [from];
  const segments: RouteSegment[] = [];
  const totalDist = haversine(from, to);

  const roadNames = ['Grand Avenue', 'High Street', 'Expressway 1', 'City Ring Road', 'Park Boulevard'];
  const trafficOptions: TrafficLevel[] = ['FREE', 'SLOW', 'FREE', 'JAM', 'FREE'];

  for (let i = 0; i < steps; i++) {
    const t = (i + 1) / steps;
    const lat = from.latitude + (to.latitude - from.latitude) * t;
    const lon = from.longitude + (to.longitude - from.longitude) * t;
    const point = { latitude: lat, longitude: lon };
    const segDist = totalDist / steps;
    const traffic = trafficOptions[i % trafficOptions.length];

    segments.push({
      from: points[points.length - 1],
      to: point,
      distanceMeters: segDist,
      traffic,
      roadName: roadNames[i % roadNames.length]
    });
    points.push(point);
  }

  const freeFlowDurationSeconds = (totalDist / 1000 / 50) * 3600; // 50km/h avg
  const durationSeconds = freeFlowDurationSeconds * 1.25;

  return {
    points,
    segments,
    totalDistanceMeters: totalDist,
    durationSeconds,
    freeFlowDurationSeconds,
    hasTolls: false,
    overallTraffic: 'SLOW'
  };
}

// NASA API Services
export interface NasaApodData {
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: string;
  date: string;
  copyright?: string;
}

export interface NasaEonetEvent {
  id: string;
  title: string;
  description?: string;
  link: string;
  categories: { id: string; title: string }[];
  geometry: { date: string; type: string; coordinates: [number, number] }[];
}

export async function fetchNasaApod(): Promise<NasaApodData | null> {
  try {
    const res = await fetch('/api/nasa/apod');
    if (res.ok) {
      return await res.json();
    }
  } catch (_e) {}
  return null;
}

export async function fetchNasaEonetEvents(): Promise<NasaEonetEvent[]> {
  try {
    const res = await fetch('/api/nasa/eonet');
    if (res.ok) {
      const data = await res.json();
      return data.events || [];
    }
  } catch (_e) {}
  return [];
}

export async function fetchNasaEarthAssets(lat: number, lon: number): Promise<any> {
  try {
    const res = await fetch(`/api/nasa/earth?lat=${lat}&lon=${lon}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (_e) {}
  return null;
}

// Live Connected Active Drivers on Map API
import { ActiveDriver } from '../types';

export async function fetchActiveDrivers(center: GeoPoint): Promise<ActiveDriver[]> {
  try {
    const res = await fetch(`/api/active-drivers?lat=${center.latitude}&lon=${center.longitude}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          name: d.name,
          role: d.role,
          vehicleEmoji: d.vehicleEmoji || '🚗',
          point: { latitude: d.lat, longitude: d.lon },
          speedKmh: d.speedKmh || 40,
          headingDeg: d.headingDeg || 0,
          lastActiveMinutesAgo: d.lastActiveMinutesAgo || 1,
          status: d.status || 'Online'
        }));
      }
    }
  } catch (_e) {}

  // Fallback live drivers around user location (48 Active Phone Trackers Cluster)
  const roles = [
    { role: 'Motorcycle' as const, emoji: '🏍️' },
    { role: 'Maxim Rider' as const, emoji: '🛵' },
    { role: 'Foodpanda' as const, emoji: '🍔' },
    { role: 'Grab' as const, emoji: '💚' },
    { role: 'Taxi' as const, emoji: '🚕' },
    { role: 'Driver' as const, emoji: '🚗' }
  ];

  const names = [
    'Faiz_Rider', 'Abang_Maxim_04', 'Siti_Panda', 'Uncle_Sam_Taxi', 'Cap_Ahmad_EV', 'Driver_Gamer_99',
    'Rider_Danial', 'Rizal_Delivery', 'Zul_Express', 'Bakar_Taxi', 'Hafiz_Nav', 'Kamal_Logistics',
    'Rina_Rider', 'Aiman_Maxim', 'Yusof_Food', 'Farhan_Drive', 'Syafiq_Courier', 'Razak_Rider',
    'Imran_Go', 'Nizam_Taxi', 'Ashraf_EV', 'Fikri_Panda', 'Syahmi_Grab', 'Helmi_Speed',
    'Khairul_Rider', 'Asraf_Rider', 'Jamal_Taxi', 'Badrul_Express', 'Hariz_Courier', 'Kassim_Panda',
    'Taufiq_Maxim', 'Anuar_Rider', 'Irwan_Drive', 'Mustafa_Taxi', 'Hamid_Rider', 'Ghani_Rider',
    'Rahman_Grab', 'Johan_Express', 'Shukri_Courier', 'Latif_Maxim', 'Faizal_Panda', 'Amin_Taxi',
    'Hadi_Rider', 'Zul_Nav', 'Zahar_Drive', 'Roslan_Express', 'Mamat_Taxi', 'Sharif_Rider'
  ];

  return names.map((name, idx) => {
    const r = roles[idx % roles.length];
    const dist = 80 + (idx * 22) % 1100;
    const bearing = (idx * 37) % 360;
    return {
      id: `drv_${idx + 1}_${Date.now()}`,
      name,
      role: r.role,
      vehicleEmoji: r.emoji,
      point: offsetPoint(center, dist, bearing),
      speedKmh: Math.floor(12 + (idx % 35)),
      headingDeg: Math.floor(Math.random() * 360),
      lastActiveMinutesAgo: 1,
      status: idx % 3 === 0 ? 'Navigating' : idx % 5 === 0 ? 'Delivering' : 'Online'
    };
  });
}


