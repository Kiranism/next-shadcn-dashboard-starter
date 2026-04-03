import type { TripListItem } from '@/features/trips/data';
import { sortPlacesByTimeline } from '@/features/trips/lib/place-timeline';

export const TRIPS_STORAGE_KEY = 'dashboard.trips.concierge.v1';

export type ConciergeSelections = Record<string, string[]>;

export type StoredCustomTrip = {
  trip: TripListItem;
  answers: ConciergeSelections;
  notes: string;
  createdAt: string;
};

export function readStoredTrips(): StoredCustomTrip[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(TRIPS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as StoredCustomTrip[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredTrips(items: StoredCustomTrip[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(items));
}

export function updateStoredTripPlaces(tripId: string, places: TripListItem['places']) {
  const storedTrips = readStoredTrips();
  const sortedPlaces = sortPlacesByTimeline(places);
  const updatedTrips = storedTrips.map((item) =>
    item.trip.id === tripId
      ? {
          ...item,
          trip: {
            ...item.trip,
            places: sortedPlaces
          }
        }
      : item
  );

  saveStoredTrips(updatedTrips);
}
