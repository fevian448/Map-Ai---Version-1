import { GeoPoint, RecentDestination } from '../types';

const STORAGE_KEY = 'mapai_recent_destinations';
const MAX_RECENT_DESTINATIONS = 5;

/**
 * Retrieve the last 5 recent destinations from localStorage
 */
export function getRecentDestinations(): RecentDestination[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: RecentDestination[] = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_RECENT_DESTINATIONS);
    }
    return [];
  } catch (error) {
    console.error('Failed to load recent destinations from localStorage:', error);
    return [];
  }
}

/**
 * Save a new destination to the top of recent destinations (max 5)
 */
export function saveRecentDestination(
  name: string,
  point: GeoPoint,
  category?: string,
  address?: string
): RecentDestination[] {
  if (typeof window === 'undefined' || !name || !point) return [];

  try {
    const current = getRecentDestinations();
    
    // Check if the destination already exists (by close coordinates or matching name)
    const filtered = current.filter((item) => {
      const isSameName = item.name.trim().toLowerCase() === name.trim().toLowerCase();
      const isVeryClose =
        Math.abs(item.point.latitude - point.latitude) < 0.0005 &&
        Math.abs(item.point.longitude - point.longitude) < 0.0005;
      return !isSameName && !isVeryClose;
    });

    const newEntry: RecentDestination = {
      id: `recent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      point: {
        latitude: point.latitude,
        longitude: point.longitude
      },
      timestamp: Date.now(),
      category: category || 'destination',
      address
    };

    // Prepend the new destination and keep only the last 5
    const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_DESTINATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Notify any active listeners across components
    window.dispatchEvent(new CustomEvent('mapai_recent_destinations_updated', { detail: updated }));

    return updated;
  } catch (error) {
    console.error('Failed to save recent destination to localStorage:', error);
    return getRecentDestinations();
  }
}

/**
 * Remove a single recent destination by id
 */
export function removeRecentDestination(id: string): RecentDestination[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getRecentDestinations();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('mapai_recent_destinations_updated', { detail: updated }));
    return updated;
  } catch (error) {
    console.error('Failed to remove recent destination:', error);
    return getRecentDestinations();
  }
}

/**
 * Clear all recent destinations
 */
export function clearRecentDestinations(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('mapai_recent_destinations_updated', { detail: [] }));
  } catch (error) {
    console.error('Failed to clear recent destinations:', error);
  }
}
