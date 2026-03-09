'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CalendarX } from 'lucide-react';
import { TripRow } from '@/features/overview/components/trip-row';

interface ClientTripsPanelProps {
  clientId: string;
  clientName: string;
}

export function ClientTripsPanel({
  clientId,
  clientName
}: ClientTripsPanelProps) {
  const [trips, setTrips] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!clientId) return;
    setIsLoading(true);

    const fetchTrips = async () => {
      const supabase = createClient();
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('trips')
        .select(
          'id, scheduled_at, pickup_address, dropoff_address, status, is_wheelchair, group_id, client_name, billing_types(name, color), driver:users!trips_driver_id_fkey(name)'
        )
        .eq('client_id', clientId)
        .gte('scheduled_at', now)
        .not('status', 'in', '(cancelled,completed)')
        .order('scheduled_at', { ascending: true })
        .limit(10);

      setTrips(data || []);
      setIsLoading(false);
    };

    fetchTrips();
  }, [clientId]);

  return (
    <div className='flex h-full flex-col border-l'>
      {/* Header */}
      <div className='shrink-0 border-b px-4 py-4'>
        <p className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
          Geplante Fahrten
        </p>
        <p className='mt-0.5 truncate text-sm font-medium'>{clientName}</p>
      </div>

      {/* Trip list */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='flex h-32 items-center justify-center'>
            <Loader2 className='text-muted-foreground h-5 w-5 animate-spin' />
          </div>
        ) : trips.length === 0 ? (
          <div className='flex h-40 flex-col items-center justify-center gap-2 px-4 text-center'>
            <CalendarX className='text-muted-foreground/40 h-8 w-8' />
            <p className='text-muted-foreground text-xs'>
              Keine geplanten Fahrten
            </p>
          </div>
        ) : (
          <div className='flex flex-col gap-1 px-2 py-2'>
            {trips.map((trip) => (
              <TripRow key={trip.id} trip={trip} onClick={() => {}} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
