import { useState, useEffect } from 'react';
import { tripsService, type Trip } from '../api/trips.service';
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

  return {
    trip,
    isLoading,
    error
  };
}
