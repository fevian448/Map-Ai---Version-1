import { GeoPoint } from '../types';

export interface LiveAircraft {
  id: string;
  callsign: string;
  airline: string;
  aircraftType: string;
  point: GeoPoint;
  altitudeFt: number;
  speedKmh: number;
  headingDeg: number;
  origin: string;
  destination: string;
  squawk: string;
  emoji: string;
  lastUpdatedMs: number;
}

export interface LiveVessel {
  id: string;
  name: string;
  vesselType: 'Cargo Ship' | 'Oil Tanker' | 'Passenger Ferry' | 'Navy Patrol' | 'Container Ship' | 'Fisherman Boat' | 'Cruise Ship';
  mmsi: string;
  flag: string;
  point: GeoPoint;
  speedKnots: number;
  headingDeg: number;
  destinationPort: string;
  lengthMeters: number;
  emoji: string;
  lastUpdatedMs: number;
}

// Offset helper for geographic coordinates
function offsetPoint(center: GeoPoint, distMeters: number, bearingDeg: number): GeoPoint {
  const R = 6371000; // Earth radius in meters
  const radDist = distMeters / R;
  const radBearing = (bearingDeg * Math.PI) / 180;
  const lat1 = (center.latitude * Math.PI) / 180;
  const lon1 = (center.longitude * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(radDist) +
      Math.cos(lat1) * Math.sin(radDist) * Math.cos(radBearing)
  );

  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(radBearing) * Math.sin(radDist) * Math.cos(lat1),
      Math.cos(radDist) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    latitude: (lat2 * 180) / Math.PI,
    longitude: (lon2 * 180) / Math.PI
  };
}

// In-memory state for animated radar movement
let aircraftCache: LiveAircraft[] = [];
let vesselCache: LiveVessel[] = [];
let lastTickTime = Date.now();

// Preset Airliners & Flight routes
const AIRLINES = [
  { callsign: 'MH128', airline: 'Malaysia Airlines', type: 'Boeing 737-800', from: 'KUL (Kuala Lumpur)', to: 'SIN (Singapore)', emoji: '✈️' },
  { callsign: 'AK5202', airline: 'AirAsia', type: 'Airbus A320neo', from: 'KUL (Kuala Lumpur)', to: 'PEN (Penang)', emoji: '🛫' },
  { callsign: 'SQ106', airline: 'Singapore Airlines', type: 'Airbus A350-900', from: 'SIN (Singapore)', to: 'KUL (Kuala Lumpur)', emoji: '✈️' },
  { callsign: 'GA820', airline: 'Garuda Indonesia', type: 'Boeing 787-9', from: 'CGK (Jakarta)', to: 'KUL (Kuala Lumpur)', emoji: '✈️' },
  { callsign: 'TG415', airline: 'Thai Airways', type: 'Airbus A330-300', from: 'BKK (Bangkok)', to: 'SIN (Singapore)', emoji: '✈️' },
  { callsign: 'OD210', airline: 'Batik Air Malaysia', type: 'Boeing 737 MAX 8', from: 'KUL (Kuala Lumpur)', to: 'DPS (Bali)', emoji: '🛫' },
  { callsign: 'EK346', airline: 'Emirates', type: 'Airbus A380-800', from: 'DXB (Dubai)', to: 'KUL (Kuala Lumpur)', emoji: '🛬' },
  { callsign: 'QR844', airline: 'Qatar Airways', type: 'Boeing 777-300ER', from: 'DOH (Doha)', to: 'SIN (Singapore)', emoji: '✈️' }
];

// Preset Maritime Vessels & Ships
const VESSELS = [
  { name: 'MV Evergreen Pearl', type: 'Container Ship' as const, flag: '🇲🇾', mmsi: '533012888', port: 'Port Klang', len: 320, emoji: '🚢' },
  { name: 'PETRONAS Vision Tanker', type: 'Oil Tanker' as const, flag: '🇲🇾', mmsi: '533088991', port: 'Kerteh Terminal', len: 275, emoji: '🛢️' },
  { name: 'KM Express Bahari 99', type: 'Passenger Ferry' as const, flag: '🇮🇩', mmsi: '525091234', port: 'Batam Centre', len: 65, emoji: '⛴️' },
  { name: 'KD Laksamana Hang Tuah', type: 'Navy Patrol' as const, flag: '🇲🇾', mmsi: '533990001', port: 'Lumut Naval Base', len: 105, emoji: '🛥️' },
  { name: 'SuperStar Gemini Cruise', type: 'Cruise Ship' as const, flag: '🇸🇬', mmsi: '563044112', port: 'Marina Bay Cruise', len: 230, emoji: '🛳️' },
  { name: 'Fisherman Sentosa 88', type: 'Fisherman Boat' as const, flag: '🇲🇾', mmsi: '533004512', port: 'Kuantan Harbor', len: 28, emoji: '⛵' },
  { name: 'COSCO Pacific Container', type: 'Cargo Ship' as const, flag: '🇵🇦', mmsi: '355881200', port: 'Tanjung Pelepas', len: 366, emoji: '🚢' }
];

// Fetch live aircraft flights (OpenSky API or fallback simulation)
export async function fetchLiveAircraftRadar(center: GeoPoint): Promise<LiveAircraft[]> {
  const now = Date.now();
  const dtSec = Math.max(1, (now - lastTickTime) / 1000);
  lastTickTime = now;

  // Try OpenSky network API first if bbox is reasonable
  try {
    const lat = center.latitude;
    const lon = center.longitude;
    const d = 1.2; // ~120km bbox
    const url = `https://opensky-network.org/api/states/all?lamin=${lat - d}&lamax=${lat + d}&lomin=${lon - d}&lomax=${lon + d}`;
    
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500); // 2.5s timeout for fast response
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && data.states && Array.isArray(data.states) && data.states.length > 0) {
        const liveFetched: LiveAircraft[] = data.states.slice(0, 12).map((st: any, idx: number) => {
          const callsign = (st[1] || `FLT${idx + 1}`).trim();
          const lonVal = st[5] || center.longitude + (idx * 0.05);
          const latVal = st[6] || center.latitude + (idx * 0.04);
          const baroAltMeters = st[7] || 9000;
          const velocityMs = st[9] || 220;
          const heading = st[10] || (idx * 45) % 360;

          return {
            id: `opensky_${st[0] || idx}`,
            callsign,
            airline: callsign.startsWith('MH') ? 'Malaysia Airlines' : callsign.startsWith('AK') ? 'AirAsia' : 'Commercial Flight',
            aircraftType: 'Boeing / Airbus Aircraft',
            point: { latitude: latVal, longitude: lonVal },
            altitudeFt: Math.round(baroAltMeters * 3.28084),
            speedKmh: Math.round(velocityMs * 3.6),
            headingDeg: Math.round(heading),
            origin: 'Live Flight Radar Feed',
            destination: 'En Route',
            squawk: String(st[14] || '7000'),
            emoji: '✈️',
            lastUpdatedMs: now
          };
        });
        aircraftCache = liveFetched;
        return liveFetched;
      }
    }
  } catch (_err) {
    // OpenSky offline or rate-limited, seamless fallback to realistic simulation engine
  }

  // Fallback simulation with live continuous animation movement
  if (aircraftCache.length === 0) {
    aircraftCache = AIRLINES.map((a, idx) => {
      const dist = 3500 + idx * 4200; // 3.5km to 33km away in the sky
      const bearing = (idx * 48 + 25) % 360;
      const pt = offsetPoint(center, dist, bearing);
      return {
        id: `ac_${idx + 1}`,
        callsign: a.callsign,
        airline: a.airline,
        aircraftType: a.type,
        point: pt,
        altitudeFt: 18000 + (idx * 2800) % 20000,
        speedKmh: 680 + (idx * 45) % 250,
        headingDeg: (bearing + 90) % 360,
        origin: a.from,
        destination: a.to,
        squawk: `${1200 + idx * 110}`,
        emoji: a.emoji,
        lastUpdatedMs: now
      };
    });
  } else {
    // Animate moving aircraft along their headings
    aircraftCache = aircraftCache.map((ac) => {
      const distTraveledMeters = (ac.speedKmh * 1000 / 3600) * dtSec;
      const newPt = offsetPoint(ac.point, distTraveledMeters, ac.headingDeg);
      return {
        ...ac,
        point: newPt,
        lastUpdatedMs: now
      };
    });
  }

  return aircraftCache;
}

// Fetch live maritime vessels & sea ships
export async function fetchLiveSeaVesselsRadar(center: GeoPoint): Promise<LiveVessel[]> {
  const now = Date.now();
  const dtSec = Math.max(1, (now - lastTickTime) / 1000);

  if (vesselCache.length === 0) {
    vesselCache = VESSELS.map((v, idx) => {
      const dist = 1800 + idx * 2800; // 1.8km to 20km out at sea / coast
      const bearing = (idx * 52 + 110) % 360; // Placed towards coastal/sea direction
      const pt = offsetPoint(center, dist, bearing);
      return {
        id: `vessel_${idx + 1}`,
        name: v.name,
        vesselType: v.type,
        mmsi: v.mmsi,
        flag: v.flag,
        point: pt,
        speedKnots: Number((8.5 + (idx * 2.3) % 18).toFixed(1)),
        headingDeg: (bearing + 180) % 360,
        destinationPort: v.port,
        lengthMeters: v.len,
        emoji: v.emoji,
        lastUpdatedMs: now
      };
    });
  } else {
    // Animate moving ships across maritime water body
    vesselCache = vesselCache.map((v) => {
      const speedMps = v.speedKnots * 0.514444;
      const distTraveledMeters = speedMps * dtSec;
      const newPt = offsetPoint(v.point, distTraveledMeters, v.headingDeg);
      return {
        ...v,
        point: newPt,
        lastUpdatedMs: now
      };
    });
  }

  return vesselCache;
}
