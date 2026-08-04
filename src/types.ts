export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export type AlertTypeKey =
  | 'HAZARD'
  | 'POLICE'
  | 'ACCIDENT'
  | 'ROADWORK'
  | 'SPEED_CAM'
  | 'TRAFFIC'
  | 'RADAR'
  | 'ROBOT'
  | 'TRAIN'
  | 'BUS';

export interface AlertTypeInfo {
  key: AlertTypeKey;
  label: string;
  emoji: string;
}

export const ALERT_TYPES: Record<AlertTypeKey, AlertTypeInfo> = {
  HAZARD: { key: 'HAZARD', label: 'Hazard', emoji: '🚨' },
  POLICE: { key: 'POLICE', label: 'Police', emoji: '👮' },
  ACCIDENT: { key: 'ACCIDENT', label: 'Accident', emoji: '💥' },
  ROADWORK: { key: 'ROADWORK', label: 'Roadwork', emoji: '🚧' },
  SPEED_CAM: { key: 'SPEED_CAM', label: 'Speed Cam', emoji: '📸' },
  TRAFFIC: { key: 'TRAFFIC', label: 'Traffic Jam', emoji: '🚦' },
  RADAR: { key: 'RADAR', label: 'Radar Zone', emoji: '📡' },
  ROBOT: { key: 'ROBOT', label: 'AI Bot Cross', emoji: '🤖' },
  TRAIN: { key: 'TRAIN', label: 'Train/LRT', emoji: '🚆' },
  BUS: { key: 'BUS', label: 'Bus Stop/Lane', emoji: '🚌' }
};

export type TrafficLevel = 'FREE' | 'SLOW' | 'JAM';

export interface TrafficAlert {
  id: string;
  type: AlertTypeKey;
  point: GeoPoint;
  description: string;
  reporter: string;
  timestamp: number;
  confidence: number;
  confirmedBy: number;
}

export type CategoryKey = 'fuel' | 'food' | 'delivery' | 'parking' | 'hospital' | 'atm';

export interface PlaceCategory {
  key: CategoryKey;
  label: string;
  emoji: string;
}

export const PLACE_CATEGORIES: PlaceCategory[] = [
  { key: 'delivery', label: 'Maxim, Grab & Foodpanda', emoji: '🛵' },
  { key: 'food', label: 'Food & Dining', emoji: '🍽️' },
  { key: 'fuel', label: 'Fuel & EV', emoji: '⛽' },
  { key: 'parking', label: 'Parking', emoji: '🅿️' },
  { key: 'hospital', label: 'Hospital', emoji: '🏥' },
  { key: 'atm', label: 'ATM & Banks', emoji: '🏧' }
];

export interface Place {
  id: string;
  name: string;
  category: CategoryKey;
  point: GeoPoint;
  distanceMeters: number;
  rating: number;
  isOpen: boolean;
  fuelPrice?: string | null;
  extra?: string | null;
}

export interface RouteSegment {
  from: GeoPoint;
  to: GeoPoint;
  distanceMeters: number;
  traffic: TrafficLevel;
  roadName: string;
}

export interface RouteInfo {
  points: GeoPoint[];
  segments: RouteSegment[];
  totalDistanceMeters: number;
  durationSeconds: number;
  freeFlowDurationSeconds: number;
  hasTolls: boolean;
  overallTraffic: TrafficLevel;
}

export interface WeatherInfo {
  condition: string;
  emoji: string;
  temperatureC: number;
  windKph: number;
  humidity: number;
  visibilityKm: number;
  roadRisk: string;
}

export interface SpeedCamera {
  id: string;
  point: GeoPoint;
  limitKmh: number;
  direction: string;
}

export interface Contributor {
  id: string;
  name: string;
  points: number;
  reports: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: number;
}

export type LanguageCode = 'en' | 'id' | 'es' | 'ar' | 'fr' | 'zh';

export interface SettingsState {
  serverUrl: string;
  mapProvider: 'osm' | 'google' | 'nasa_gibs' | 'nasa_night';
  voiceGuidance: boolean;
  darkMode: boolean;
  speedUnit: 'kmh' | 'mph';
  language: LanguageCode;
}
