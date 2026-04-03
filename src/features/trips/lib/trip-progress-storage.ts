import type { Place } from '@/app/dashboard/trips/[tripid]/components/map';

const COMPLETED_PLACE_PREFIX = 'dashboard.trips.completed-places.v1';
const LOYALTY_POINTS_STORAGE_KEY = 'dashboard.loyalty.points.v1';
const LOYALTY_POINTS_CHANGE_EVENT = 'loyalty-points-change';

function getCompletedPlaceStorageKey(tripId: string): string {
  return `${COMPLETED_PLACE_PREFIX}.${tripId}`;
}

function readStringArray(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function writeStringArray(key: string, values: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(values));
}

function getStoredNumber(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function readCompletedPlaceNames(tripId: string): string[] {
  if (typeof window === 'undefined') return [];
  return readStringArray(window.localStorage.getItem(getCompletedPlaceStorageKey(tripId)));
}

export function markPlaceCompleted(tripId: string, placeName: string): boolean {
  if (typeof window === 'undefined') return false;

  const storageKey = getCompletedPlaceStorageKey(tripId);
  const current = readStringArray(window.localStorage.getItem(storageKey));

  if (current.includes(placeName)) {
    return false;
  }

  writeStringArray(storageKey, [...current, placeName]);
  return true;
}

export function isPlaceCompleted(tripId: string, placeName: string): boolean {
  return readCompletedPlaceNames(tripId).includes(placeName);
}

export function readLoyaltyPoints(fallback = 185): number {
  return getStoredNumber(LOYALTY_POINTS_STORAGE_KEY, fallback);
}

export function addLoyaltyPoints(points: number): number {
  if (typeof window === 'undefined') return points;

  const current = readLoyaltyPoints();
  const next = current + Math.max(0, Math.round(points));
  window.localStorage.setItem(LOYALTY_POINTS_STORAGE_KEY, String(next));
  window.dispatchEvent(new Event(LOYALTY_POINTS_CHANGE_EVENT));
  return next;
}

export function subscribeToLoyaltyPointsChanges(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key === LOYALTY_POINTS_STORAGE_KEY) {
      handler();
    }
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener(LOYALTY_POINTS_CHANGE_EVENT, handler);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(LOYALTY_POINTS_CHANGE_EVENT, handler);
  };
}

export function getPlaceLoyaltyPoints(place: Place): number {
  return place.loyaltyPoints ?? 25;
}
