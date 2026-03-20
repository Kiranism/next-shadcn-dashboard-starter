'use client';

/**
 * TripsRealtimeSync – subscribes to Supabase Realtime postgres_changes for
 * the `trips` table (INSERT + UPDATE) and calls router.refresh() so the RSC
 * payload re-fetches automatically.
 *
 * This keeps the kanban and list view in sync without polling:
 * - A new trip is created → board updates within ~1 s.
 * - A trip is updated externally (e.g. driver portal) → board reflects it.
 *
 * Mount this component once inside the trips page. It renders nothing.
 *
 * Prerequisites (Supabase):
 *   REPLICA IDENTITY is set to DEFAULT (primary key) by default, which is
 *   sufficient for INSERT events. UPDATE events require FULL if you need the
 *   old row, but we only use it as a trigger for router.refresh().
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function TripsRealtimeSync() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('trips-realtime-sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trips' },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
