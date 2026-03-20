'use client';

import * as React from 'react';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { tripsService, type Trip } from '@/features/trips/api/trips.service';

// ─── Types ─────────────────────────────────────────────────────────────────

export type DriverOption = { id: string; name: string };

export type DispatchTrip = Pick<
  Trip,
  | 'id'
  | 'client_name'
  | 'pickup_address'
  | 'dropoff_address'
  | 'scheduled_at'
  | 'greeting_style'
> & {
  requested_date?: string | null;
  linked_trip?: { scheduled_at?: string | null } | null;
  tripDate: string;
};

export interface DispatchInboxData {
  /** Trips scheduled for today with no driver assigned. */
  unassignedToday: DispatchTrip[];
  /** Trips for today with no scheduled_at (need time + driver). */
  openTours: DispatchTrip[];
  /** CSV-imported trips where driver name matching failed. */
  csvPending: DispatchTrip[];
  drivers: DriverOption[];
  isLoading: boolean;
  isAssigning: Record<string, boolean>;
  selectedDriverByTrip: Record<string, string>;
  setSelectedDriverByTrip: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  handleAssign: (tripId: string, timeString?: string) => Promise<void>;
  /** Total actionable items (all three categories). */
  totalCount: number;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useDispatchInbox(
  filter: 'today' | 'all' = 'today'
): DispatchInboxData {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAssigning, setIsAssigning] = React.useState<Record<string, boolean>>(
    {}
  );
  const [unassignedToday, setUnassignedToday] = React.useState<DispatchTrip[]>(
    []
  );
  const [openTours, setOpenTours] = React.useState<DispatchTrip[]>([]);
  const [csvPending, setCsvPending] = React.useState<DispatchTrip[]>([]);
  const [drivers, setDrivers] = React.useState<DriverOption[]>([]);
  const [selectedDriverByTrip, setSelectedDriverByTrip] = React.useState<
    Record<string, string>
  >({});

  const load = React.useCallback(async () => {
    setIsLoading(true);
    const supabase = createSupabaseClient();

    // ── Calendar bounds for 'today' filter ──────────────────────────────
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // ── Auth & company scope ────────────────────────────────────────────
    const {
      data: { user }
    } = await supabase.auth.getUser();

    let companyId: string | null = null;
    if (user?.id) {
      const { data: profile } = await supabase
        .from('accounts')
        .select('company_id')
        .eq('id', user.id)
        .single();
      companyId = profile?.company_id ?? null;
    }

    // ── Run all queries + drivers in parallel ──────────────────────────
    const TRIP_FIELDS =
      'id, client_name, pickup_address, dropoff_address, scheduled_at, requested_date, status, greeting_style, linked_trip:trips!linked_trip_id(scheduled_at)';

    const driversQueryBase = supabase
      .from('accounts')
      .select('id, name')
      .eq('role', 'driver')
      .eq('is_active', true);

    const upcomingQuery = supabase
      .from('trips')
      .select(TRIP_FIELDS)
      .is('driver_id', null)
      .not('scheduled_at', 'is', null)
      .neq('status', 'cancelled')
      .order('scheduled_at', { ascending: true })
      .limit(100);

    const openQuery = supabase
      .from('trips')
      .select(TRIP_FIELDS)
      .is('driver_id', null)
      .is('scheduled_at', null)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(100);

    const [driversResult, todayResult, openToursResult, csvResult] =
      await Promise.all([
        companyId
          ? driversQueryBase.eq('company_id', companyId)
          : driversQueryBase,

        upcomingQuery,
        openQuery,

        // 3. CSV imports where driver matching failed
        supabase
          .from('trips')
          .select(TRIP_FIELDS)
          .eq('needs_driver_assignment', true)
          .is('driver_id', null)
          .neq('status', 'cancelled')
          .order('scheduled_at', { ascending: true, nullsFirst: false })
          .limit(50)
      ]);

    setDrivers(
      (driversResult.data || []).map((d: any) => ({
        id: d.id as string,
        name: (d.name as string) || 'Unbenannter Fahrer'
      }))
    );

    const toTrip = (t: any): DispatchTrip => {
      // ── Date Fallback Hierarchy ───────────────
      // Sourcing the exact date an unassigned trip actually falls on is complex if
      // the trip lacks a dedicated requested_date. This mimics the dashboard widget.
      // Priority: own scheduled_at → requested_date → linked outbound trip's scheduled_at → fallback to today.
      const computedTripDate = (() => {
        if (t.scheduled_at)
          return new Date(t.scheduled_at).toISOString().slice(0, 10);
        if (t.requested_date) return t.requested_date;
        const linkedAt = t.linked_trip?.scheduled_at;
        if (linkedAt) return new Date(linkedAt).toISOString().slice(0, 10);
        return new Date().toISOString().slice(0, 10);
      })();

      return {
        id: t.id,
        client_name: t.client_name ?? null,
        greeting_style: t.greeting_style ?? null,
        pickup_address: t.pickup_address ?? null,
        dropoff_address: t.dropoff_address ?? null,
        scheduled_at: t.scheduled_at ?? null,
        requested_date: t.requested_date ?? null,
        linked_trip: t.linked_trip ?? null,
        tripDate: computedTripDate
      };
    };

    let todayTripsRaw = (todayResult.data || []).map(toTrip);
    let openToursRaw = (openToursResult.data || []).map(toTrip);

    // ── Client-Side Filtering ───────────────
    // If we only selected `requested_date = today` from Supabase, we would inherently
    // drop trips that only have a valid date from a linked outbound trip. By fetching
    // the whole unassigned list and strictly filtering the calculated Javascript string,
    // "Heute" seamlessly captures those connected trips perfectly.
    if (filter === 'today') {
      todayTripsRaw = todayTripsRaw.filter((t) => t.tripDate === todayStr);
      openToursRaw = openToursRaw.filter((t) => t.tripDate === todayStr);
    }

    setUnassignedToday(todayTripsRaw);
    setOpenTours(openToursRaw);

    // Deduplicate CSV list against already-shown trips
    const shownIds = new Set([
      ...todayTripsRaw.map((t) => t.id),
      ...openToursRaw.map((t) => t.id)
    ]);

    let csvTripsRaw = (csvResult.data || [])
      .filter((t: any) => !shownIds.has(t.id))
      .map(toTrip);

    if (filter === 'today') {
      csvTripsRaw = csvTripsRaw.filter((t) => t.tripDate === todayStr);
    }

    setCsvPending(csvTripsRaw);
    setIsLoading(false);
  }, [filter]);

  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    load();
  }, [load]);

  const handleAssign = async (tripId: string, timeString?: string) => {
    const driverId = selectedDriverByTrip[tripId];
    // If neither time nor driver is provided, nothing to do
    if (!driverId && !timeString) return;

    setIsAssigning((prev) => ({ ...prev, [tripId]: true }));
    try {
      const allTrips = [...unassignedToday, ...openTours, ...csvPending];
      const trip = allTrips.find((t) => t.id === tripId);

      const updates: Partial<Trip> = {};

      if (driverId) {
        updates.driver_id = driverId;
        updates.needs_driver_assignment = false;
      }

      // Pre-fill date logic matching the widget's fallback hierarchy
      // This calculates the 'base string' date that will be morphed with the dispatcher's time input.
      const tripDate = (() => {
        if (trip?.scheduled_at)
          return new Date(trip.scheduled_at).toISOString().slice(0, 10);
        if (trip?.requested_date) return trip.requested_date;
        const linkedAt = trip?.linked_trip?.scheduled_at;
        if (linkedAt) return new Date(linkedAt).toISOString().slice(0, 10);
        return new Date().toISOString().slice(0, 10);
      })();

      // If the dispatcher securely typed a departure time, construct the timestamp
      if (timeString) {
        // Build "YYYY-MM-DDT14:30:00". Because JS Date initializes
        // string-parsed dates strictly inside the user's localized browser timezone,
        // toISOString safely wraps this directly into the DB without offset mismatch.
        const localIso = `${tripDate}T${timeString}:00`;
        const dateObj = new Date(localIso);
        if (!isNaN(dateObj.getTime())) {
          updates.scheduled_at = dateObj.toISOString();
        }
      }

      await tripsService.updateTrip(tripId, updates);

      if (driverId) {
        // Assigned a driver -> remove from lists
        setUnassignedToday((prev) => prev.filter((t) => t.id !== tripId));
        setOpenTours((prev) => prev.filter((t) => t.id !== tripId));
        setCsvPending((prev) => prev.filter((t) => t.id !== tripId));
      } else {
        // Just updated the time. Rather than doing piecemeal array updates,
        // just reload the board so it flows exactly into the right section.
        await load();
      }
    } finally {
      setIsAssigning((prev) => ({ ...prev, [tripId]: false }));
    }
  };

  const totalCount =
    unassignedToday.length + openTours.length + csvPending.length;

  return {
    isLoading,
    isAssigning,
    unassignedToday,
    openTours,
    csvPending,
    drivers,
    selectedDriverByTrip,
    setSelectedDriverByTrip,
    handleAssign,
    totalCount
  };
}
