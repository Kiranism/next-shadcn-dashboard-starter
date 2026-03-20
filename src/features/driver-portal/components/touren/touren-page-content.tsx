'use client';

/**
 * TourenPageContent — Touren page orchestrator.
 *
 * Features:
 *   - Text search (debounced 300 ms) by name / address
 *   - Status filter chips (Alle / Geplant / Unterwegs / Abgeschlossen / Storniert)
 *   - Date picker to browse a specific day (empty = all future/past trips)
 *   - Paginated list of DriverTripCard with showNotes=true
 *
 * Filter state lives in component state (not URL params) to stay lightweight
 * and avoid full-page navigations on filter changes.
 * Future: migrate to nuqs if deep-linking to filtered views is needed.
 */

import { DriverTripCard } from '@/features/driver-portal/components/shared/driver-trip-card';
import { TourenFilterBar } from '@/features/driver-portal/components/touren/touren-filter-bar';
import { TourenSearchBar } from '@/features/driver-portal/components/touren/touren-search-bar';
import { getDriverTrips } from '@/features/driver-portal/api/driver-trips.service';
import { shiftsService } from '@/features/driver-portal/api/shifts.service';
import type {
  DriverTrip,
  TripStatusFilter
} from '@/features/driver-portal/types/trips.types';
import { createClient } from '@/lib/supabase/client';
import { IconRoute } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';

export function TourenPageContent() {
  const [driverId, setDriverId] = useState<string | null>(null);
  const [shiftActive, setShiftActive] = useState(false);
  const [trips, setTrips] = useState<DriverTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TripStatusFilter>('all');
  const [date, setDate] = useState('');

  // Load driver ID + check for active shift once on mount
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;
      setDriverId(user.id);
      // Check for active shift to gate Tour starten
      try {
        const shift = await shiftsService.getActiveShift(user.id);
        setShiftActive(
          !!shift && (shift.status === 'active' || shift.status === 'on_break')
        );
      } catch {
        setShiftActive(false);
      }
    };
    void init();
  }, []);

  // Fetch trips whenever filters or driverId change
  const fetchTrips = useCallback(async () => {
    if (!driverId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getDriverTrips(driverId, {
        search,
        statusFilter,
        date,
        limit: 100
      });
      setTrips(data);
    } catch {
      setError('Touren konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [driverId, search, statusFilter, date]);

  useEffect(() => {
    void fetchTrips();
  }, [fetchTrips]);

  /**
   * Sync optimistic status updates from child cards into local state.
   */
  const handleStatusChange = (tripId: string, newStatus: string) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: newStatus } : t))
    );
  };

  return (
    <div className='flex flex-col gap-4 p-4'>
      {/* Page title */}
      <h1 className='text-foreground text-xl font-semibold'>Touren</h1>

      {/* Search bar */}
      <TourenSearchBar value={search} onChange={setSearch} />

      {/* Filter chips + date */}
      <TourenFilterBar
        statusFilter={statusFilter}
        date={date}
        onStatusChange={setStatusFilter}
        onDateChange={setDate}
      />

      {/* Results */}
      {loading && (
        <div className='flex flex-col gap-3'>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className='bg-muted h-36 animate-pulse rounded-xl border'
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className='rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30'>
          <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
        </div>
      )}

      {!loading && !error && trips.length === 0 && (
        <div className='flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center'>
          <IconRoute className='text-muted-foreground h-10 w-10' />
          <div>
            <p className='text-foreground text-sm font-medium'>
              Keine Touren gefunden
            </p>
            <p className='text-muted-foreground text-xs'>
              Versuche, Filter oder Suche anzupassen.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && trips.length > 0 && (
        <div className='flex flex-col gap-3'>
          {/* Result count */}
          <p className='text-muted-foreground text-xs'>
            {trips.length} {trips.length === 1 ? 'Tour' : 'Touren'}
          </p>
          {trips.map((trip) => (
            <DriverTripCard
              key={trip.id}
              trip={trip}
              showNotes
              shiftActive={shiftActive}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
