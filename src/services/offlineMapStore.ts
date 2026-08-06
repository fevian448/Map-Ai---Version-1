import { GeoPoint } from '../types';

export interface OfflineMapPack {
  regionName: string;
  downloadedAt: number;
  tileCount: number;
  sizeMb: number;
  isAutoDownloaded: boolean;
  center: GeoPoint;
}

const OFFLINE_CACHE_NAME = 'mapai-offline-tiles-v1';
const OFFLINE_PACK_KEY = 'mapai_offline_pack_meta';

// List of free live server backends for automatic fallback and uninterrupted live runtime
export const FREE_BACKEND_SERVERS = [
  { name: 'Render Free Server (Primary)', url: 'https://map-ai-backend.onrender.com', status: 'Online' },
  { name: 'Railway Free Node Runtime', url: 'https://map-ai-live.railway.app', status: 'Online' },
  { name: 'Local Express Socket Server', url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000', status: 'Online' }
];

// Helper to convert lat/lon to tile coordinates (XYZ)
function deg2num(lat: number, lon: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const xtile = Math.floor(((lon + 180) / 360) * n);
  const ytile = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x: xtile, y: ytile };
}

// Downloads compact tile set (~1.2MB - 2.5MB) for current radius
export async function downloadCompactOfflineMap(
  center: GeoPoint,
  onProgress?: (percent: number, loaded: number, total: number) => void
): Promise<OfflineMapPack> {
  const zooms = [12, 13, 14, 15]; // Compact zoom levels for minimal storage footprint
  const tileUrls: string[] = [];

  for (const z of zooms) {
    const { x, y } = deg2num(center.latitude, center.longitude, z);
    // 3x3 grid around current location per zoom level
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const tx = x + dx;
        const ty = y + dy;
        const url = `https://tile.openstreetmap.org/${z}/${tx}/${ty}.png`;
        tileUrls.push(url);
      }
    }
  }

  const cache = await caches.open(OFFLINE_CACHE_NAME);
  let loaded = 0;
  const total = tileUrls.length;

  for (const url of tileUrls) {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) {
        await cache.put(url, response.clone());
      }
    } catch (_e) {
      // Ignore individual tile fetch error
    }
    loaded++;
    if (onProgress) {
      onProgress(Math.round((loaded / total) * 100), loaded, total);
    }
  }

  const meta: OfflineMapPack = {
    regionName: `Local Region (${center.latitude.toFixed(2)}, ${center.longitude.toFixed(2)})`,
    downloadedAt: Date.now(),
    tileCount: loaded,
    sizeMb: Number(((loaded * 18) / 1024).toFixed(2)), // Approx 18KB per tile
    isAutoDownloaded: true,
    center
  };

  localStorage.setItem(OFFLINE_PACK_KEY, JSON.stringify(meta));
  return meta;
}

export function getOfflineMapPackMeta(): OfflineMapPack | null {
  try {
    const data = localStorage.getItem(OFFLINE_PACK_KEY);
    return data ? JSON.parse(data) : null;
  } catch (_e) {
    return null;
  }
}

export async function clearOfflineMapData(): Promise<void> {
  await caches.delete(OFFLINE_CACHE_NAME);
  localStorage.removeItem(OFFLINE_PACK_KEY);
}

// Auto-run offline pre-download on initial install / first app launch
export async function autoDownloadOfflineOnFirstInstall(
  center: GeoPoint,
  onProgress?: (percent: number) => void
) {
  const existing = getOfflineMapPackMeta();
  if (!existing) {
    console.log('⚡ Auto Downloading compact offline map tiles on first launch...');
    await downloadCompactOfflineMap(center, (pct) => {
      if (onProgress) onProgress(pct);
    });
  }
}
