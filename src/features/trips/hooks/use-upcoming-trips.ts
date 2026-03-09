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
      const data = await tripsService.getUpcomingTrips(startDate, endDate);
      console.log('Upcoming trips data:', data);
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
      .channel('schema-db-changes')
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
  }, []);

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
