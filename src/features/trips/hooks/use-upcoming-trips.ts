import { useState, useEffect } from 'react';
import { tripsService } from '../api/trips.service';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { startOfDay, endOfDay, addDays, endOfWeek, formatISO } from 'date-fns';

export type TripFilter = 'today' | 'tomorrow' | 'week';
export type StatusFilter = 'all' | 'completed' | 'open' | 'assigned';

export function useUpcomingTrips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [filter, setFilter] = useState<TripFilter>('today');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUpcomingTrips = async () => {
    try {
      setIsLoading(true);

      const now = new Date();
      let startDate = '';
      let endDate = '';

      if (filter === 'tomorrow') {
        const tomorrow = addDays(now, 1);
        startDate = startOfDay(tomorrow).toISOString();
        endDate = endOfDay(tomorrow).toISOString();
      } else if (filter === 'week') {
        startDate = startOfDay(now).toISOString();
        endDate = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
      } else {
        startDate = startOfDay(now).toISOString();
        endDate = endOfDay(now).toISOString();
      }

      console.log('Fetching upcoming trips:', { filter, startDate, endDate });
      const raw = await tripsService.getUpcomingTrips(startDate, endDate);
      console.log('Upcoming trips data:', raw);

      // Cross-reference linked partners within the same result set.
      // This covers the common case where both Hin- and Rückfahrt fall in the
      // same time window and adds zero extra DB queries.
      const idToTrip = new Map(raw.map((t: any) => [t.id, t]));
      const data = raw.map((trip: any) => {
        let linkedPartnerStatus: string | null = null;

        if (trip.linked_trip_id) {
          // Forward link: I am the Rückfahrt, partner is the Hinfahrt
          const partner = idToTrip.get(trip.linked_trip_id);
          if (partner) linkedPartnerStatus = partner.status ?? null;
        } else {
          // Inverse link: I am the Hinfahrt, find the Rückfahrt pointing to me
          const partner = raw.find((t: any) => t.linked_trip_id === trip.id);
          if (partner) linkedPartnerStatus = partner.status ?? null;
        }

        return { ...trip, linked_partner_status: linkedPartnerStatus };
      });

      setTrips(data);
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(`Failed to fetch upcoming trips: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingTrips();
  }, [filter]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`schema-db-changes-${filter}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchUpcomingTrips();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const filteredTrips = trips.filter((trip) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'open') {
      return ['pending', 'open', 'assigned', 'in_progress', 'driving'].includes(
        trip.status
      );
    }
    return trip.status === statusFilter;
  });

  return {
    trips: filteredTrips,
    allTrips: trips,
    filter,
    setFilter,
    statusFilter,
    setStatusFilter,
    isLoading,
    error,
    refresh: fetchUpcomingTrips
  };
}
