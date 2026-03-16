'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CalendarX, MoreHorizontal, Trash } from 'lucide-react';
import { TripRow } from '@/features/overview/components/trip-row';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { Trip } from '@/features/trips/api/trips.service';
import { useTripCancellation } from '@/features/trips/hooks/use-trip-cancellation';
import { hasPairedLeg } from '@/features/trips/api/recurring-exceptions.actions';
import { RecurringTripCancelDialog } from '@/features/trips/components/recurring-trip-cancel-dialog';

interface ClientTripsPanelProps {
  clientId: string;
  clientName: string;
}

export function ClientTripsPanel({
  clientId,
  clientName
}: ClientTripsPanelProps) {
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedTrip, setSelectedTrip] = React.useState<Trip | null>(null);
  const [hasPair, setHasPair] = React.useState(false);
  const { cancelTrip, isLoading: isCancelling } = useTripCancellation();

  React.useEffect(() => {
    if (!clientId) return;
    setIsLoading(true);

    const fetchTrips = async () => {
      const supabase = createClient();

      // Use start of today so trips earlier today still show
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const since = startOfToday.toISOString();

      const selectFields =
        'id, scheduled_at, pickup_address, dropoff_address, status, is_wheelchair, group_id, client_name, rule_id, client_id, billing_types(name, color), driver:users!trips_driver_id_fkey(name)';

      // Primary: match by client_id (FK to clients table)
      const { data: byId } = await supabase
        .from('trips')
        .select(selectFields)
        .eq('client_id', clientId)
        .gte('scheduled_at', since)
        .not('status', 'in', '(cancelled,completed)')
        .order('scheduled_at', { ascending: true })
        .limit(10);

      if (byId && byId.length > 0) {
        setTrips((byId as any) || []);
        setIsLoading(false);
        return;
      }

      // Fallback: match by client_name for trips that have no client_id link
      if (clientName) {
        const { data: byName } = await supabase
          .from('trips')
          .select(selectFields)
          .is('client_id', null)
          .eq('client_name', clientName)
          .gte('scheduled_at', since)
          .not('status', 'in', '(cancelled,completed)')
          .order('scheduled_at', { ascending: true })
          .limit(10);

        setTrips((byName as any) || []);
      } else {
        setTrips([]);
      }

      setIsLoading(false);
    };

    fetchTrips();
  }, [clientId, clientName]);

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
          <>
            <div className='flex flex-col gap-1 px-2 py-2'>
              {trips.map((trip) => (
                <div key={trip.id} className='flex items-stretch gap-1'>
                  <div className='flex-1'>
                    <TripRow trip={trip} onClick={() => {}} compact showDate />
                  </div>
                  <div className='flex items-center'>
                    <ClientTripActions
                      trip={trip}
                      onOpenDialog={async () => {
                        setSelectedTrip(trip);
                        const pair = await hasPairedLeg(trip);
                        setHasPair(pair);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <RecurringTripCancelDialog
              trip={selectedTrip}
              hasPair={hasPair}
              isOpen={!!selectedTrip}
              isLoading={isCancelling}
              title='Fahrt stornieren?'
              description='Möchten Sie diese Fahrt wirklich stornieren?'
              onOpenChange={(open) => {
                if (!open) setSelectedTrip(null);
              }}
              onConfirmSingle={(reason) => {
                if (!selectedTrip) return;
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                cancelTrip(
                  selectedTrip,
                  selectedTrip.rule_id
                    ? 'skip-occurrence'
                    : 'single-nonrecurring',
                  {
                    source: 'Manually cancelled via Client Trips Panel',
                    reason
                  }
                ).then(() => setSelectedTrip(null));
              }}
              onConfirmWithPair={
                selectedTrip && hasPair
                  ? (reason) => {
                      // eslint-disable-next-line @typescript-eslint/no-floating-promises
                      cancelTrip(selectedTrip, 'skip-occurrence-and-paired', {
                        source:
                          'Manually cancelled (Hin/Rück) via Client Trips Panel',
                        reason
                      }).then(() => setSelectedTrip(null));
                    }
                  : undefined
              }
              onConfirmSeries={
                selectedTrip && selectedTrip.rule_id
                  ? (reason) => {
                      // eslint-disable-next-line @typescript-eslint/no-floating-promises
                      cancelTrip(selectedTrip, 'cancel-series', {
                        source:
                          'Recurring series cancelled via Client Trips Panel',
                        reason
                      }).then(() => setSelectedTrip(null));
                    }
                  : undefined
              }
              singleLabel={
                selectedTrip && selectedTrip.rule_id
                  ? 'Nur diese Fahrt stornieren (Aussetzen)'
                  : 'Fahrt stornieren'
              }
              pairLabel='Diese Fahrt & Rückfahrt stornieren'
              seriesLabel='Gesamte Serie beenden'
            />
          </>
        )}
      </div>
    </div>
  );
}

interface ClientTripActionsProps {
  trip: Trip;
  onOpenDialog: () => void | Promise<void>;
}

function ClientTripActions({ trip, onOpenDialog }: ClientTripActionsProps) {
  const isRecurring = !!trip.rule_id;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='h-7 w-7'>
          <span className='sr-only'>Aktionen für Fahrt öffnen</span>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          className='text-destructive focus:text-destructive'
          onClick={() => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            onOpenDialog();
          }}
        >
          <Trash className='mr-2 h-4 w-4' />
          {isRecurring
            ? 'Fahrt stornieren / Serie beenden'
            : 'Fahrt stornieren'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
