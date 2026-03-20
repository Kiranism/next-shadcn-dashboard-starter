'use client';

/**
 * TodaysTripsList — Startseite list of trips assigned to the driver for today.
 *
 * Fetches trips from the driver-trips service on mount (and on refresh trigger).
 * Shows a skeleton while loading, an empty state if no trips are found,
 * and the ordered list of DriverTripCard components otherwise.
 *
 * Trip cards handle their own status mutation optimistically; this component
 * syncs the in-memory data so the status chip stays up-to-date without
 * requiring a full refetch.
 */

import { DriverTripCard } from '@/features/driver-portal/components/shared/driver-trip-card';
import { getTodaysTrips } from '@/features/driver-portal/api/driver-trips.service';
import type { DriverTrip } from '@/features/driver-portal/types/trips.types';
import { IconCalendarOff } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';

interface TodaysTripsListProps {
  driverId: string;
  /** Whether the driver currently has an active shift — gates Tour starten */
  shiftActive: boolean;
}

export function TodaysTripsList({
  driverId,
  shiftActive
}: TodaysTripsListProps) {
  const [trips, setTrips] = useState<DriverTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTodaysTrips(driverId);
      setTrips(data);
    } catch {
      setError('Touren konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    void fetchTrips();
  }, [fetchTrips]);

  /**
   * When a trip card mutates the status optimistically,
   * reflect the change in local state without a full refetch.
   */
  const handleStatusChange = (tripId: string, newStatus: string) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: newStatus } : t))
    );
  };

  // ------------------------------------------------------------------
  // Loading skeleton
  // ------------------------------------------------------------------

  if (loading) {
    return (
      <div className='flex flex-col gap-3'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='bg-muted h-32 animate-pulse rounded-xl border'
          />
        ))}
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Error state
  // ------------------------------------------------------------------

  if (error) {
    return (
      <div className='rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30'>
        <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Empty state
  // ------------------------------------------------------------------

  if (trips.length === 0) {
    return (
      <div className='flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center'>
        <IconCalendarOff className='text-muted-foreground h-10 w-10' />
        <div>
          <p className='text-foreground text-sm font-medium'>
            Keine Touren heute
          </p>
          <p className='text-muted-foreground text-xs'>
            Für heute sind keine Fahrten zugewiesen.
          </p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Trip list
  // ------------------------------------------------------------------

  return (
    <div className='flex flex-col gap-3'>
      {trips.map((trip) => (
        <DriverTripCard
          key={trip.id}
          trip={trip}
          shiftActive={shiftActive}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}
