import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { startOfDay, endOfDay, addDays } from 'date-fns';
import { Client } from '@/features/clients/api/clients.service';

export interface PendingClient extends Client {
  trips?: { id: string; scheduled_at: string | null }[];
}

export function usePendingTours() {
  const [pendingClients, setPendingClients] = useState<PendingClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPendingTours = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      const tomorrow = addDays(new Date(), 1);
      const startOfTomorrow = startOfDay(tomorrow);
      const endOfTomorrow = endOfDay(tomorrow);

      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select(
          `
          *,
          trips (
            id,
            scheduled_at
          )
        `
        )
        .eq('requires_daily_scheduling', true);

      if (clientsError) {
        throw clientsError;
      }

      // Filter clients to only those who DO NOT have a trip scheduled for tomorrow
      const pending = clients.filter((client: any) => {
        const hasTripTomorrow = client.trips?.some((trip: any) => {
          if (!trip.scheduled_at) return false;
          const tripDate = new Date(trip.scheduled_at);
          return tripDate >= startOfTomorrow && tripDate <= endOfTomorrow;
        });
        return !hasTripTomorrow;
      });

      setPendingClients(pending as PendingClient[]);
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(`Fehler beim Laden der offenen Touren: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTours();
  }, []);

  // Set up realtime subscription to listen to changes on the trips or clients tables
  useEffect(() => {
    const supabase = createClient();
    const tripsChannel = supabase
      .channel('schema-db-changes-pending-trips')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips' },
        () => {
          fetchPendingTours();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => {
          fetchPendingTours();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tripsChannel);
    };
  }, []);

  return {
    pendingClients,
    isLoading,
    error,
    refresh: fetchPendingTours
  };
}
