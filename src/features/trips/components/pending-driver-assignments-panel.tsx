'use client';

import * as React from 'react';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { tripsService, type Trip } from '@/features/trips/api/trips.service';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

type DriverOption = {
  id: string;
  name: string;
};

type PendingTrip = Pick<
  Trip,
  'id' | 'client_name' | 'pickup_address' | 'dropoff_address' | 'scheduled_at'
>;

export function PendingDriverAssignmentsPanel() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAssigning, setIsAssigning] = React.useState<Record<string, boolean>>(
    {}
  );
  const [trips, setTrips] = React.useState<PendingTrip[]>([]);
  const [drivers, setDrivers] = React.useState<DriverOption[]>([]);
  const [selectedDriverByTrip, setSelectedDriverByTrip] = React.useState<
    Record<string, string>
  >({});
  const [showNoPendingMessage, setShowNoPendingMessage] = React.useState(false);
  const [showPendingPanel, setShowPendingPanel] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const supabase = createSupabaseClient();

      const {
        data: { user }
      } = await supabase.auth.getUser();

      let companyId: string | null = null;
      if (user?.id) {
        const { data: profile } = await supabase
          .from('accounts')
          .select('company_id')
          .eq('id', user.id)
          .single();
        companyId = profile?.company_id ?? null;
      }

      const driversQuery = supabase
        .from('accounts')
        .select('id, name')
        .eq('role', 'driver')
        .eq('is_active', true);

      const { data: driversData } = companyId
        ? await driversQuery.eq('company_id', companyId)
        : await driversQuery;

      setDrivers(
        (driversData || []).map((d: any) => ({
          id: d.id as string,
          name: (d.name as string) || 'Unbenannter Fahrer'
        }))
      );

      const tripsQuery = supabase
        .from('trips')
        .select(
          'id, client_name, pickup_address, dropoff_address, scheduled_at, needs_driver_assignment, driver_id, ingestion_source'
        )
        .eq('needs_driver_assignment', true)
        .is('driver_id', null)
        .order('scheduled_at', { ascending: true })
        .limit(100);

      const { data: tripsData } = await tripsQuery;

      const pendingTrips: PendingTrip[] = (tripsData || [])
        .filter(
          (t: any) =>
            t.ingestion_source === 'csv_bulk_upload' &&
            t.needs_driver_assignment === true
        )
        .map((t: any) => ({
          id: t.id as string,
          client_name: t.client_name as string | null,
          pickup_address: t.pickup_address as string | null,
          dropoff_address: t.dropoff_address as string | null,
          scheduled_at: t.scheduled_at as string | null
        }));

      setTrips(pendingTrips);
      setIsLoading(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    load();
  }, []);

  const handleAssign = async (tripId: string) => {
    const driverId = selectedDriverByTrip[tripId];
    if (!driverId) return;

    setIsAssigning((prev) => ({ ...prev, [tripId]: true }));
    try {
      await tripsService.updateTrip(tripId, {
        driver_id: driverId,
        needs_driver_assignment: false
      });

      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } finally {
      setIsAssigning((prev) => ({ ...prev, [tripId]: false }));
    }
  };

  // Show a temporary "all assigned" message for 5 seconds whenever
  // there are no pending trips. This is primarily used after bulk upload.
  React.useEffect(() => {
    if (trips.length === 0) {
      setShowNoPendingMessage(true);
      const timeout = setTimeout(() => {
        setShowNoPendingMessage(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [trips.length]);

  // Show the pending assignments panel only temporarily (5 seconds)
  // when there are pending trips.
  React.useEffect(() => {
    if (trips.length > 0) {
      setShowPendingPanel(true);
      const timeout = setTimeout(() => {
        setShowPendingPanel(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [trips.length]);

  if (isLoading) {
    return (
      <div className='bg-card mt-4 rounded-lg border px-4 py-3 text-sm'>
        <div className='flex items-center gap-2'>
          <Truck className='text-muted-foreground h-4 w-4 animate-pulse' />
          <span className='text-muted-foreground'>
            Lade Fahrten mit offener Fahrerzuordnung...
          </span>
        </div>
      </div>
    );
  }

  if (trips.length === 0 && showNoPendingMessage) {
    return (
      <div className='bg-card mt-4 rounded-lg border px-4 py-3 text-sm'>
        <div className='flex items-center gap-2'>
          <CheckCircle2 className='h-4 w-4 text-emerald-600' />
          <span className='text-muted-foreground'>
            Alle Fahrten sind aktuell einem Fahrer zugeordnet.
          </span>
        </div>
      </div>
    );
  }

  if (!showPendingPanel) {
    return null;
  }

  return (
    <div className='bg-card mt-4 rounded-lg border'>
      <div className='border-b px-4 py-3'>
        <div className='flex items-center gap-2'>
          <Truck className='h-4 w-4 text-amber-600' />
          <div>
            <p className='text-sm font-medium'>
              Offene Fahrerzuordnungen ({trips.length})
            </p>
            <p className='text-muted-foreground text-xs'>
              Fahrten aus CSV-Uploads ohne gefundenen Fahrer. Weisen Sie hier
              schnell einen Fahrer zu.
            </p>
          </div>
        </div>
      </div>
      <div className='divide-y'>
        {trips.map((trip) => {
          const scheduledLabel = trip.scheduled_at
            ? format(new Date(trip.scheduled_at), 'dd.MM.yyyy HH:mm', {
                locale: de
              })
            : 'Ohne Zeitpunkt';

          return (
            <div
              key={trip.id}
              className='flex flex-col gap-2 px-4 py-3 text-sm md:flex-row md:items-center md:gap-4'
            >
              <div className='min-w-0 flex-1'>
                <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                  <span className='font-medium'>
                    {trip.client_name || 'Unbekannter Fahrgast'}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {scheduledLabel}
                  </span>
                </div>
                <div className='text-muted-foreground mt-1 text-xs'>
                  <div className='truncate'>
                    <span className='font-medium'>Abholung:</span>{' '}
                    {trip.pickup_address || '—'}
                  </div>
                  <div className='truncate'>
                    <span className='font-medium'>Ziel:</span>{' '}
                    {trip.dropoff_address || '—'}
                  </div>
                </div>
              </div>
              <div className='flex flex-col gap-2 md:w-64'>
                <Select
                  value={selectedDriverByTrip[trip.id] || ''}
                  onValueChange={(value) =>
                    setSelectedDriverByTrip((prev) => ({
                      ...prev,
                      [trip.id]: value
                    }))
                  }
                >
                  <SelectTrigger className='h-9'>
                    <SelectValue placeholder='Fahrer wählen...' />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.length === 0 && (
                      <div className='text-muted-foreground px-2 py-1.5 text-xs'>
                        Keine aktiven Fahrer gefunden.
                      </div>
                    )}
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex items-center gap-2 md:w-40 md:justify-end'>
                <Button
                  type='button'
                  size='sm'
                  className={cn(
                    'w-full gap-1.5 md:w-auto',
                    !selectedDriverByTrip[trip.id] && 'cursor-not-allowed'
                  )}
                  disabled={
                    !selectedDriverByTrip[trip.id] || isAssigning[trip.id]
                  }
                  onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    handleAssign(trip.id);
                  }}
                >
                  {isAssigning[trip.id] ? (
                    <>
                      <span className='border-background h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent' />
                      Zuordnen...
                    </>
                  ) : (
                    <>
                      <AlertCircle className='h-3.5 w-3.5' />
                      Fahrer zuordnen
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
