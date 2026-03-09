import { useState, useEffect } from 'react';
import { tripsService } from '../api/trips.service';
import { toast } from 'sonner';
import { startOfDay, endOfDay, addDays, endOfWeek, formatISO } from 'date-fns';

export type TripFilter = 'today' | 'tomorrow' | 'week';

export function useUpcomingTrips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [filter, setFilter] = useState<TripFilter>('today');
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

  return {
    trips,
    filter,
    setFilter,
    isLoading,
    error,
    refresh: fetchUpcomingTrips
  };
}
