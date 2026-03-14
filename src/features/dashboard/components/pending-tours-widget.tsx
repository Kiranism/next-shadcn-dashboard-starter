'use client';

import { useState } from 'react';
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
import { PlusCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { UnplannedTrip } from '@/features/dashboard/hooks/use-unplanned-trips';

const FILTER_TABS: { value: UnplannedFilter; label: string }[] = [
  { value: 'today', label: 'Heute' },
  { value: 'week', label: 'Woche' },
  { value: 'all', label: 'All' }
];

export function PendingToursWidget() {
  const [filter, setFilter] = useState<UnplannedFilter>('today');
  const { trips, isLoading, refresh } = useUnplannedTrips(filter);

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
  onScheduled
}: {
  trip: UnplannedTrip;
  onScheduled: () => void;
}) {
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState('');
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
        scheduled_at: scheduledDate.toISOString()
      });

      toast.success(`Abholzeit für ${trip.client_name || 'Fahrt'} gesetzt.`);
      setTime('');
      onScheduled();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Fehler: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='min-w-0 flex-1'>
        <span className='text-sm font-medium'>
          {trip.client_name || 'Unbekannt'}
        </span>
        {trip.pickup_address && (
          <p className='text-muted-foreground line-clamp-1 text-xs'>
            {trip.pickup_address} → {trip.dropoff_address || '—'}
          </p>
        )}
      </div>
      <div className='flex flex-shrink-0 items-center gap-2'>
        <Input
          type='date'
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          className='h-8 w-32 text-xs'
          disabled={isSubmitting}
        />
        <Input
          type='time'
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className='h-8 w-28 text-xs'
          disabled={isSubmitting}
        />
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
