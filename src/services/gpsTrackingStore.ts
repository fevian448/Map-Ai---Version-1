import { GeoPoint } from '../types';

export type GpsTrackableCategory =
  | 'phone'
  | 'rider'
  | 'vehicle'
  | 'fleet'
  | 'emergency'
  | 'asset'
  | 'aircraft'
  | 'vessel'
  | 'satellite';

export interface GpsTrackableObject {
  id: string;
  name: string;
  category: GpsTrackableCategory;
  typeLabel: string;
  emoji: string;
  point: GeoPoint;
  speedKmh: number;
  headingDeg: number;
  batteryPercent?: number;
  signalQuality: 'Strong' | 'Good' | 'Fair';
  gpsChipset: string;
  status: 'ONLINE' | 'MOVING' | 'IDLE' | 'EMERGENCY' | 'TRANSIT';
  details: {
    modelOrMake?: string;
    operatorOrOwner?: string;
    altitudeMeters?: number;
    destination?: string;
    imeiOrMmsi?: string;
    lastPingText: string;
  };
}

// Coordinate offset helper
function offsetPoint(center: GeoPoint, distMeters: number, bearingDeg: number): GeoPoint {
  const R = 6371000;
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

let cachedTrackers: GpsTrackableObject[] = [];
let lastTick = Date.now();

export function getLiveGpsTrackableObjects(center: GeoPoint): GpsTrackableObject[] {
  const now = Date.now();
  const dtSec = Math.max(1, (now - lastTick) / 1000);
  lastTick = now;

  if (cachedTrackers.length === 0) {
    cachedTrackers = [
      // 1. Phone Trackers
      {
        id: 'gps_phone_sarah',
        name: 'Family Tracker (Sarah)',
        category: 'phone',
        typeLabel: 'Mobile Phone GPS',
        emoji: '📱',
        point: offsetPoint(center, 420, 45),
        speedKmh: 4,
        headingDeg: 110,
        batteryPercent: 84,
        signalQuality: 'Strong',
        gpsChipset: 'Qualcomm Dual-Freq GNSS (L1+L5)',
        status: 'ONLINE',
        details: {
          modelOrMake: 'iPhone 15 Pro',
          operatorOrOwner: 'Family Safety Circle',
          imeiOrMmsi: '354892019482910',
          lastPingText: 'Live (2s ago)'
        }
      },
      {
        id: 'gps_phone_ali',
        name: 'Technician Phone (Ali)',
        category: 'phone',
        typeLabel: 'Field Worker Phone',
        emoji: '📱',
        point: offsetPoint(center, 890, 220),
        speedKmh: 24,
        headingDeg: 215,
        batteryPercent: 71,
        signalQuality: 'Strong',
        gpsChipset: 'MediaTek Dimensity GNSS',
        status: 'MOVING',
        details: {
          modelOrMake: 'Samsung Galaxy A54',
          operatorOrOwner: 'MapAi Field Operations',
          imeiOrMmsi: '869201048291039',
          lastPingText: 'Live (1s ago)'
        }
      },

      // 2. Riders with GPS (Maxim, Grab, Foodpanda)
      {
        id: 'gps_rider_maxim',
        name: 'Maxim Rider #104',
        category: 'rider',
        typeLabel: 'E-Hailing Delivery Bike',
        emoji: '🛵',
        point: offsetPoint(center, 650, 130),
        speedKmh: 46,
        headingDeg: 125,
        batteryPercent: 91,
        signalQuality: 'Strong',
        gpsChipset: 'Infinix Note 30 GPS Tracker',
        status: 'MOVING',
        details: {
          modelOrMake: 'Yamaha Y15ZR (Plate QAA 4821)',
          operatorOrOwner: 'Maxim Delivery Express',
          destination: 'Order Pick-up Hub',
          lastPingText: 'Live (Just now)'
        }
      },
      {
        id: 'gps_rider_grab',
        name: 'GrabFood Express Rider',
        category: 'rider',
        typeLabel: 'Food Express Delivery',
        emoji: '🛵',
        point: offsetPoint(center, 1100, 310),
        speedKmh: 38,
        headingDeg: 300,
        batteryPercent: 88,
        signalQuality: 'Strong',
        gpsChipset: 'Xiaomi Redmi Note 12 GPS',
        status: 'MOVING',
        details: {
          modelOrMake: 'Honda RS150R (Plate JQS 8812)',
          operatorOrOwner: 'GrabFood Delivery',
          destination: 'Customer Dropoff',
          lastPingText: 'Live (1s ago)'
        }
      },
      {
        id: 'gps_rider_panda',
        name: 'Foodpanda Pink Rider #88',
        category: 'rider',
        typeLabel: 'Pandamart Express',
        emoji: '🛵',
        point: offsetPoint(center, 780, 85),
        speedKmh: 32,
        headingDeg: 80,
        batteryPercent: 79,
        signalQuality: 'Strong',
        gpsChipset: 'Vivo Y36 GPS Receiver',
        status: 'MOVING',
        details: {
          modelOrMake: 'Honda Vario 160 (Plate WTR 9021)',
          operatorOrOwner: 'Foodpanda Malaysia',
          destination: 'Pandamart Hub',
          lastPingText: 'Live (3s ago)'
        }
      },

      // 3. Vehicles & Logistics Fleet
      {
        id: 'gps_fleet_lorry',
        name: 'Heavy Cargo Truck #18',
        category: 'fleet',
        typeLabel: 'Logistics Container Lorry',
        emoji: '🚚',
        point: offsetPoint(center, 1800, 195),
        speedKmh: 62,
        headingDeg: 190,
        batteryPercent: 100,
        signalQuality: 'Strong',
        gpsChipset: 'Teltonika FMB920 OBD-II GPS',
        status: 'MOVING',
        details: {
          modelOrMake: 'Scania R500 (Plate BKV 9911)',
          operatorOrOwner: 'Nationwide Logistics Fleet',
          destination: 'Central Distribution Warehouse',
          lastPingText: 'Live Telematics (1s ago)'
        }
      },
      {
        id: 'gps_fleet_van',
        name: 'ShopeeXpress Delivery Van',
        category: 'fleet',
        typeLabel: 'Courier Parcel Van',
        emoji: '🚐',
        point: offsetPoint(center, 1350, 15),
        speedKmh: 40,
        headingDeg: 25,
        batteryPercent: 95,
        signalQuality: 'Strong',
        gpsChipset: 'Concox GT06N GPS Tracker',
        status: 'MOVING',
        details: {
          modelOrMake: 'Toyota HiAce (Plate VAP 3381)',
          operatorOrOwner: 'ShopeeXpress Sorting Dept',
          destination: 'Residential Route',
          lastPingText: 'Live Telematics (2s ago)'
        }
      },
      {
        id: 'gps_fleet_bus',
        name: 'Rapid City Transit Bus #07',
        category: 'fleet',
        typeLabel: 'Public Bus Transit',
        emoji: '🚌',
        point: offsetPoint(center, 2100, 160),
        speedKmh: 35,
        headingDeg: 165,
        batteryPercent: 100,
        signalQuality: 'Strong',
        gpsChipset: 'Volvo Fleet Telematic GPS',
        status: 'MOVING',
        details: {
          modelOrMake: 'Scania K250UB City Bus',
          operatorOrOwner: 'Public Transport Authority',
          destination: 'Central Bus Terminal',
          lastPingText: 'Live (Just now)'
        }
      },

      // 4. Emergency & Public Safety Services
      {
        id: 'gps_emerg_ambulance',
        name: 'Emergency Ambulance #02',
        category: 'emergency',
        typeLabel: 'Hospital Emergency Unit',
        emoji: '🚑',
        point: offsetPoint(center, 1500, 270),
        speedKmh: 75,
        headingDeg: 260,
        batteryPercent: 100,
        signalQuality: 'Strong',
        gpsChipset: 'Emergency Priority GPS Beacon',
        status: 'EMERGENCY',
        details: {
          modelOrMake: 'Mercedes Sprinter Intensive Care',
          operatorOrOwner: 'General Hospital Response',
          destination: 'Trauma Care Emergency Call',
          lastPingText: 'Live High Priority (1s ago)'
        }
      },
      {
        id: 'gps_emerg_police',
        name: 'Police Highway Patrol #12',
        category: 'emergency',
        typeLabel: 'Traffic Patrol Cruiser',
        emoji: '🚓',
        point: offsetPoint(center, 1950, 60),
        speedKmh: 68,
        headingDeg: 55,
        batteryPercent: 100,
        signalQuality: 'Strong',
        gpsChipset: 'Police Radio Telematics GPS',
        status: 'MOVING',
        details: {
          modelOrMake: 'Honda Civic Patrol (Plate W 9901 P)',
          operatorOrOwner: 'Traffic Enforcement Unit',
          destination: 'Highway Sector 4 Patrol',
          lastPingText: 'Live Patrol (Just now)'
        }
      },

      // 5. GPS Asset Tags & Pet Collars
      {
        id: 'gps_asset_tag_hilux',
        name: 'Toyota Hilux 4x4 OBD Tracker',
        category: 'asset',
        typeLabel: 'Hardwired Vehicle GPS',
        emoji: '🚗',
        point: offsetPoint(center, 520, 260),
        speedKmh: 0,
        headingDeg: 0,
        batteryPercent: 99,
        signalQuality: 'Strong',
        gpsChipset: 'Coban TK103B Satellite GPS',
        status: 'IDLE',
        details: {
          modelOrMake: 'Toyota Hilux GR Sport',
          operatorOrOwner: 'Private Vehicle Asset',
          imeiOrMmsi: '864920194829100',
          lastPingText: 'Parked & Geofence Active (30s ago)'
        }
      },
      {
        id: 'gps_asset_tag_pet',
        name: 'Maxi Pet Smart GPS Collar',
        category: 'asset',
        typeLabel: 'Pet & Livestock GPS',
        emoji: '🐕',
        point: offsetPoint(center, 310, 180),
        speedKmh: 3,
        headingDeg: 190,
        batteryPercent: 82,
        signalQuality: 'Good',
        gpsChipset: 'Micro-GPS Collar Tag',
        status: 'ONLINE',
        details: {
          modelOrMake: 'Tractive GPS Pet Collar',
          operatorOrOwner: 'Family Pet Safety',
          lastPingText: 'Safe In Geofence (5s ago)'
        }
      },
      {
        id: 'gps_asset_cargo_box',
        name: 'Solar Smart Container Box #44',
        category: 'asset',
        typeLabel: 'Asset Satellite Tracker',
        emoji: '📦',
        point: offsetPoint(center, 2400, 110),
        speedKmh: 54,
        headingDeg: 105,
        batteryPercent: 96,
        signalQuality: 'Strong',
        gpsChipset: 'Iridium Satellite + GPS Tag',
        status: 'TRANSIT',
        details: {
          modelOrMake: 'Globalstar SmartOne Solar',
          operatorOrOwner: 'High-Value Cargo Security',
          destination: 'Port Loading Bay',
          lastPingText: 'Live Solar Beacon (1m ago)'
        }
      },

      // 6. NASA Space Station & Orbiting GPS Satellites
      {
        id: 'gps_sat_iss',
        name: 'ISS International Space Station',
        category: 'satellite',
        typeLabel: 'Manned Space Station',
        emoji: '🛰️',
        point: offsetPoint(center, 8500, 320),
        speedKmh: 27600,
        headingDeg: 45,
        signalQuality: 'Strong',
        gpsChipset: 'NASA Orbital GPS Telemetry',
        status: 'MOVING',
        details: {
          modelOrMake: 'Zarya / ISS Space Station',
          operatorOrOwner: 'NASA / ESA / JAXA Orbit',
          altitudeMeters: 418000,
          lastPingText: 'Live Orbit Feed (Real-Time)'
        }
      },
      {
        id: 'gps_sat_navstar',
        name: 'GPS NAVSTAR Satellite #24',
        category: 'satellite',
        typeLabel: 'Global Positioning Constellation',
        emoji: '🛰️',
        point: offsetPoint(center, 12000, 140),
        speedKmh: 14000,
        headingDeg: 135,
        signalQuality: 'Strong',
        gpsChipset: 'USSF GPS Block III Satellite',
        status: 'ONLINE',
        details: {
          modelOrMake: 'Lockheed Martin GPS III',
          operatorOrOwner: 'US Space Force GNSS',
          altitudeMeters: 20200000,
          lastPingText: 'Transmitting L1/L2/L5 Signals'
        }
      }
    ];
  }

  // Smooth live physics animation updates
  cachedTrackers.forEach((tracker) => {
    if (tracker.speedKmh > 0 && tracker.status !== 'IDLE') {
      const distTraveled = (tracker.speedKmh * 1000 * dtSec) / 3600;
      tracker.point = offsetPoint(tracker.point, distTraveled, tracker.headingDeg);

      // Keep within radius around center by gently curving bearing if drifted too far
      const distFromCenter = Math.hypot(
        (tracker.point.latitude - center.latitude) * 111000,
        (tracker.point.longitude - center.longitude) * 111000
      );

      if (distFromCenter > 25000) {
        tracker.headingDeg = (tracker.headingDeg + 180 + (Math.random() * 40 - 20)) % 360;
      }
    }
  });

  return [...cachedTrackers];
}
