import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { startOfWeek, endOfWeek } from 'date-fns';
import type { Trip } from '@/features/trips/api/trips.service';

export type UnplannedTrip = Trip & {
  requested_date?: string | null;
  linked_trip?: { scheduled_at: string | null } | null;
};

export type UnplannedFilter = 'today' | 'week' | 'all';

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isThisWeek(date: Date): boolean {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  return date >= weekStart && date <= weekEnd;
}

export function useUnplannedTrips(filter: UnplannedFilter) {
  const [trips, setTrips] = useState<UnplannedTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUnplannedTrips = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      const { data: unplannedRows, error: fetchError } = await supabase
        .from('trips')
        .select('*, requested_date')
        .is('scheduled_at', null)
        .not('status', 'in', '("cancelled","completed")')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const rows = (unplannedRows || []) as UnplannedTrip[];

      const linkedIds = Array.from(
        new Set(
          rows.map((t) => t.linked_trip_id).filter((id): id is string => !!id)
        )
      );

      let linkedMap: Record<string, string | null> = {};
      if (linkedIds.length > 0) {
        const { data: linkedRows } = await supabase
          .from('trips')
          .select('id, scheduled_at')
          .in('id', linkedIds);
        linkedMap = (linkedRows || []).reduce(
          (acc, r) => {
            acc[r.id] = r.scheduled_at ?? null;
            return acc;
          },
          {} as Record<string, string | null>
        );
      }

      const withLinked = rows.map((trip) => ({
        ...trip,
        linked_trip: trip.linked_trip_id
          ? { scheduled_at: linkedMap[trip.linked_trip_id] ?? null }
          : null
      })) as UnplannedTrip[];

      const filtered =
        filter === 'all'
          ? withLinked
          : withLinked.filter((trip) => {
              // Priority: linked outbound trip's confirmed time → requested_date from CSV → exclude
              const dateStr =
                trip.linked_trip?.scheduled_at ??
                (trip.requested_date
                  ? `${trip.requested_date}T12:00:00`
                  : null);
              if (!dateStr) return false;
              const date = new Date(dateStr);
              if (filter === 'today') return isToday(date);
              if (filter === 'week') return isThisWeek(date);
              return true;
            });

      setTrips(filtered);
      setError(null);
    } catch (err) {
      const e = err as Error;
      setError(e);
      toast.error(`Fehler beim Laden der offenen Touren: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchUnplannedTrips();
  }, [fetchUnplannedTrips]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('unplanned-trips-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips' },
        () => {
          fetchUnplannedTrips();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUnplannedTrips]);

  return {
    trips,
    isLoading,
    error,
    refresh: fetchUnplannedTrips
  };
}
