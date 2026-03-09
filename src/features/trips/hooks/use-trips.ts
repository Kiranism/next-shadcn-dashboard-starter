import { useState, useEffect } from 'react';
import { tripsService, type Trip } from '../api/trips.service';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      const data = await tripsService.getTrips();
      setTrips(data);
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(`Failed to fetch trips: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('trips-all-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips'
        },
        (payload) => {
          console.log('Real-time update for all trips received:', payload);
          fetchTrips();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    trips,
    isLoading,
    error,
    refresh: fetchTrips
  };
}

export function useTrip(id: string | null) {
  const [trip, setTrip] = useState<any>(null); // Using any to reflect joined data for now
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchTrip = async () => {
      try {
        setIsLoading(true);
        const data = await tripsService.getTripById(id);
        setTrip(data);
        setError(null);
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast.error(`Failed to fetch trip details: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrip();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchTrip = async () => {
      try {
        setIsLoading(true);
        const data = await tripsService.getTripById(id);
        setTrip(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    const supabase = createClient();
    const channel = supabase
      .channel(`trip-${id}-changes`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log(`Real-time update for trip ${id} received:`, payload);
          fetchTrip();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  return {
    trip,
    isLoading,
    error
  };
}
