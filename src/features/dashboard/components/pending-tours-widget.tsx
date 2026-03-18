'use client';

import { useState, useEffect } from 'react';
import {
  useUnplannedTrips,
  type UnplannedFilter
} from '@/features/dashboard/hooks/use-unplanned-trips';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { tripsService } from '@/features/trips/api/trips.service';
import { set } from 'date-fns';
import { toast } from 'sonner';
import {
  PlusCircle,
  Loader2,
  ArrowLeftRight,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { UnplannedTrip } from '@/features/dashboard/hooks/use-unplanned-trips';
import {
  getCancelledPartnerLabel,
  getTripDirection
} from '@/features/trips/lib/trip-direction';
import { createClient } from '@/lib/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const FILTER_TABS: { value: UnplannedFilter; label: string }[] = [
  { value: 'today', label: 'Heute' },
  { value: 'week', label: 'Woche' },
  { value: 'all', label: 'All' }
];

export function PendingToursWidget() {
  const [filter, setFilter] = useState<UnplannedFilter>('today');
  const { trips, isLoading, refresh } = useUnplannedTrips(filter);
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    const fetchDrivers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'driver')
        .order('name');
      setDrivers(data || []);
    };
    fetchDrivers();
  }, []);

  if (isLoading) {
    return (
      <Card className='h-full'>
        <CardHeader>
          <CardTitle>Offene Touren</CardTitle>
          <CardDescription>Lade Fahrten...</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Offene Touren</CardTitle>
        <CardDescription>
          {trips.length} Fahrt{trips.length === 1 ? '' : 'en'} ohne Abholzeit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as UnplannedFilter)}
          className='w-full'
        >
          <TabsList className='grid w-full grid-cols-3'>
            {FILTER_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={filter} className='mt-4'>
            {trips.length === 0 ? (
              <div className='border-muted flex h-32 items-center justify-center rounded-lg border-2 border-dashed'>
                <p className='text-muted-foreground text-sm italic'>
                  Keine offenen Touren in dieser Ansicht.
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                {trips.map((trip) => (
                  <UnplannedTripRow
                    key={trip.id}
                    trip={trip}
                    drivers={drivers}
                    onScheduled={refresh}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function UnplannedTripRow({
  trip,
  drivers,
  onScheduled
}: {
  trip: UnplannedTrip;
  drivers: any[];
  onScheduled: () => void;
}) {
  // Use the direction utility so legacy rows without link_type are handled via
  // the linked_trip_id fallback (see src/features/trips/lib/trip-direction.ts).
  const isReturnTrip = getTripDirection(trip) === 'rueckfahrt';
  const linkedPartnerCancelled = trip.linked_trip?.status === 'cancelled';
  const cancelledPartnerLabel = getCancelledPartnerLabel(trip);

  // Pre-fill date from requested_date (CSV date-only import) or outbound
  // trip's scheduled_at (return trip context), falling back to today.
  const initialDate = (() => {
    if (trip.requested_date) return trip.requested_date;
    const linkedAt = trip.linked_trip?.scheduled_at;
    if (linkedAt) return new Date(linkedAt).toISOString().slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  })();

  const [dateStr, setDateStr] = useState(initialDate);
  const [time, setTime] = useState('');
  const [driverId, setDriverId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSetTime = async () => {
    if (!time) {
      toast.error('Bitte geben Sie eine Abholzeit ein.');
      return;
    }

    try {
      setIsSubmitting(true);
      const [hours, minutes] = time.split(':');
      const scheduledDate = set(new Date(dateStr), {
        hours: parseInt(hours, 10),
        minutes: parseInt(minutes, 10),
        seconds: 0,
        milliseconds: 0
      });

      await tripsService.updateTrip(trip.id, {
        scheduled_at: scheduledDate.toISOString(),
        driver_id: driverId
      });

      toast.success(
        `Abholzeit ${driverId ? 'und Fahrer ' : ''}für ${trip.client_name || 'Fahrt'} gesetzt.`
      );
      setTime('');
      onScheduled();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Fehler: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const linkedOutboundTime = trip.linked_trip?.scheduled_at
    ? format(new Date(trip.linked_trip.scheduled_at), 'EEE dd.MM. HH:mm', {
        locale: de
      })
    : null;

  return (
    <div className='flex items-center justify-between gap-4 rounded-lg border p-3'>
      {/* Trip Information (Left) */}
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-1.5'>
          <span className='text-sm font-semibold'>
            {trip.client_name || 'Unbekannt'}
          </span>
          {isReturnTrip && (
            <Badge variant='secondary' className='gap-1 px-1.5 py-0 text-xs'>
              <ArrowLeftRight className='h-3 w-3' />
              Rückfahrt
            </Badge>
          )}
          {linkedPartnerCancelled && (
            <Badge variant='destructive' className='gap-1 px-1.5 py-0 text-xs'>
              <AlertTriangle className='h-3 w-3' />
              {cancelledPartnerLabel}
            </Badge>
          )}
          {trip.requested_date && !isReturnTrip && (
            <Badge variant='outline' className='gap-1 px-1.5 py-0 text-xs'>
              <Calendar className='h-3 w-3' />
              Termin:{' '}
              {format(new Date(trip.requested_date), 'dd.MM.', {
                locale: de
              })}
            </Badge>
          )}
        </div>
        {trip.pickup_address && (
          <p className='text-muted-foreground line-clamp-1 text-xs'>
            {trip.pickup_address.split(',')[0]} →{' '}
            {trip.dropoff_address?.split(',')[0] || '—'}
          </p>
        )}
        {isReturnTrip && linkedOutboundTime && (
          <p className='text-muted-foreground mt-0.5 text-xs'>
            Hinfahrt: {linkedOutboundTime}
          </p>
        )}
      </div>
      {/* Scheduling controls (Right) */}
      <div className='flex flex-shrink-0 items-center gap-2'>
        <div className='flex items-center gap-2'>
          <Input
            type='date'
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className='h-8 w-28 text-xs'
            disabled={isSubmitting}
          />
          <Input
            type='time'
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className='h-8 w-24 text-xs'
            disabled={isSubmitting}
          />
        </div>

        <Select
          value={driverId || 'unassigned'}
          onValueChange={(v) => setDriverId(v === 'unassigned' ? null : v)}
        >
          <SelectTrigger className='h-8 w-[120px] text-xs'>
            <SelectValue placeholder='Fahrer' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='unassigned' className='text-xs italic'>
              Ohne Fahrer
            </SelectItem>
            {drivers.map((d) => (
              <SelectItem key={d.id} value={d.id} className='text-xs'>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size='sm'
          className='h-8 px-2'
          onClick={handleSetTime}
          disabled={!time || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <PlusCircle className='h-4 w-4' />
          )}
        </Button>
      </div>
    </div>
  );
}
