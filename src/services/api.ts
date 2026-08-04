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
  TrafficLevel
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

export async function sendChatMessage(content: string): Promise<string> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content }] })
    });
    if (res.ok) {
      const data = await res.json();
      return data.content;
    }
  } catch (_e) {}
  return "I'm having trouble connecting to the network right now. Please check your internet connection.";
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

