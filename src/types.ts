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
  | 'FLOOD'
  | 'POTHOLE'
  | 'ROADBLOCK'
  | 'STALLED'
  | 'HEAVY_RAIN'
  | 'ANIMAL'
  | 'CLOSURE'
  | 'OIL_SPILL'
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
  POLICE: { key: 'POLICE', label: 'Police Trap', emoji: '👮' },
  ACCIDENT: { key: 'ACCIDENT', label: 'Accident', emoji: '💥' },
  ROADWORK: { key: 'ROADWORK', label: 'Roadwork', emoji: '🚧' },
  SPEED_CAM: { key: 'SPEED_CAM', label: 'Speed Cam', emoji: '📸' },
  TRAFFIC: { key: 'TRAFFIC', label: 'Traffic Jam', emoji: '🚦' },
  FLOOD: { key: 'FLOOD', label: 'Flood', emoji: '🌊' },
  POTHOLE: { key: 'POTHOLE', label: 'Pothole', emoji: '🕳️' },
  ROADBLOCK: { key: 'ROADBLOCK', label: 'Roadblock', emoji: '🛑' },
  STALLED: { key: 'STALLED', label: 'Stalled Vehicle', emoji: '🚗⚡' },
  HEAVY_RAIN: { key: 'HEAVY_RAIN', label: 'Heavy Downpour', emoji: '🌧️' },
  ANIMAL: { key: 'ANIMAL', label: 'Animal Crossing', emoji: '🐄' },
  CLOSURE: { key: 'CLOSURE', label: 'Road Closed', emoji: '⛔' },
  OIL_SPILL: { key: 'OIL_SPILL', label: 'Oil Slick', emoji: '🛢️' },
  RADAR: { key: 'RADAR', label: 'Radar Zone', emoji: '📡' },
  ROBOT: { key: 'ROBOT', label: 'AI Bot Cross', emoji: '🤖' },
  TRAIN: { key: 'TRAIN', label: 'Train/LRT', emoji: '🚆' },
  BUS: { key: 'BUS', label: 'Bus Stop/Lane', emoji: '🚌' }
};

export interface ActiveDriver {
  id: string;
  name: string;
  role: 'Driver' | 'Motorcycle' | 'Maxim Rider' | 'Grab' | 'Foodpanda' | 'Taxi';
  vehicleEmoji: string;
  point: GeoPoint;
  speedKmh: number;
  headingDeg: number;
  lastActiveMinutesAgo: number;
  status: 'Online' | 'Navigating' | 'Delivering' | 'In SOS Radar';
}

export interface MediaVaultItem {
  id: string;
  title: string;
  type: 'image' | 'video';
  dataUrl: string; // Base64 or Object URL
  timestamp: string;
  locationName: string;
  point?: GeoPoint;
  category: 'Dashcam' | 'Incident' | 'Scenic' | 'Hazard Proof';
  fileSizeMb?: string;
}

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

export type AiProviderKey = 'gemini_flash' | 'gemini_pro' | 'groq' | 'openrouter' | 'anthropic' | 'deepseek' | 'openai' | 'huggingface';

export interface GeocodingResult {
  id: string;
  name: string;
  address: string;
  point: GeoPoint;
  distanceMeters?: number;
  type?: string;
  country?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  category: 'GPS' | 'AI' | 'PERMISSIONS' | 'SOCKET' | 'SYSTEM' | 'NAVIGATION';
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: any;
}

export interface SettingsState {
  serverUrl: string;
  mapProvider: 'osm' | 'google' | 'nasa_gibs' | 'nasa_night';
  voiceGuidance: boolean;
  darkMode: boolean;
  speedUnit: 'kmh' | 'mph';
  language: LanguageCode;
  aiProvider: AiProviderKey;
  aiApiKey?: string;
  aiCustomEndpoint?: string;
  privacyMode?: boolean;
  encryptedLocalStorageOnly?: boolean;
  emergencyAiVoiceAlerts?: boolean;
  enableFloatingAi: boolean;
  floatingAiMode: 'float' | 'docked';
  floatingUiLayout: 'standard' | 'minimal' | 'expanded';
  autoConfigMonitoring: boolean;
}
