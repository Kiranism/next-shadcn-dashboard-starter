'use client';

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  useUpcomingTrips,
  TripFilter,
  StatusFilter
} from '@/features/trips/hooks/use-upcoming-trips';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TripRow } from './trip-row';
import { TripDetailSheet } from './trip-detail-sheet';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { subMinutes } from 'date-fns';

export function UpcomingTrips() {
  const {
    trips,
    allTrips,
    filter,
    setFilter,
    statusFilter,
    setStatusFilter,
    isLoading
  } = useUpcomingTrips();
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const anchorTripRef = useRef<HTMLDivElement | null>(null);

  const anchorTripId = (() => {
    if (!trips.length) return null;

    const now = new Date();
    const anchorTime = subMinutes(now, 15);

    // Ensure we work on a time-sorted copy (ascending)
    const sorted = [...trips].sort((a, b) => {
      const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return aTime - bTime;
    });

    // Anchor to the last trip BEFORE (or equal to) anchorTime.
    // If none exist, fall back to the first trip after anchorTime.
    let anchorTrip: (typeof sorted)[number] | null = null;

    for (let i = sorted.length - 1; i >= 0; i--) {
      const trip = sorted[i];
      if (!trip?.scheduled_at) continue;
      const scheduled = new Date(trip.scheduled_at);
      if (scheduled <= anchorTime) {
        anchorTrip = trip;
        break;
      }
    }

    if (!anchorTrip) {
      anchorTrip =
        sorted.find((trip) => {
          if (!trip?.scheduled_at) return false;
          return new Date(trip.scheduled_at) > anchorTime;
        }) ??
        sorted[0] ??
        null;
    }

    return anchorTrip?.id ?? null;
  })();

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      const container = scrollAreaRef.current;
      const anchorEl = anchorTripRef.current;
      if (!container || !anchorEl) return;

      // Scroll ONLY within the trips list container (no page scroll)
      const nextTop = anchorEl.offsetTop - container.offsetTop;
      container.scrollTop = Math.max(0, nextTop);
    });

    return () => window.cancelAnimationFrame(raf);
  }, [anchorTripId, filter, statusFilter, trips.length]);

  const handleTripClick = (id: string) => {
    setSelectedTripId(id);
    setIsSheetOpen(true);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value as TripFilter);
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return allTrips.length;
    if (status === 'open') {
      return allTrips.filter((t: any) =>
        ['pending', 'open', 'assigned', 'in_progress', 'driving'].includes(
          t.status
        )
      ).length;
    }
    return allTrips.filter((t: any) => t.status === status).length;
  };

  return (
    <Card className='@container/card flex h-[560px] max-h-[70vh] flex-col'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
        <div className='space-y-1'>
          <CardTitle>Nächste Fahrten</CardTitle>
          <CardDescription>
            {allTrips.length} bevorstehende Fahrten{' '}
            {filter === 'today'
              ? 'heute'
              : filter === 'tomorrow'
                ? 'morgen'
                : 'diese Woche'}
            .
          </CardDescription>
        </div>
        <Select value={filter} onValueChange={handleFilterChange}>
          <SelectTrigger className='w-[120px]'>
            <SelectValue placeholder='Zeitraum' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='today'>Heute</SelectItem>
            <SelectItem value='tomorrow'>Morgen</SelectItem>
            <SelectItem value='week'>Woche</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <div className='mb-5 px-6'>
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          className='w-full'
        >
          <TabsList className='bg-muted/60 grid h-12 w-full grid-cols-3 p-1.5'>
            <TabsTrigger
              value='all'
              className='data-[state=active]:bg-background flex items-center gap-2 rounded-md text-xs font-semibold transition-all data-[state=active]:shadow-sm'
            >
              Alle
              <Badge
                variant={statusFilter === 'all' ? 'default' : 'secondary'}
                className={cn(
                  'pointer-events-none flex h-5 min-w-[20px] justify-center px-1.5 text-[10px]',
                  statusFilter === 'all' &&
                    'bg-blue-600 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-500'
                )}
              >
                {getStatusCount('all')}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value='open'
              className='data-[state=active]:bg-background flex items-center gap-2 rounded-md text-xs font-semibold transition-all data-[state=active]:shadow-sm'
            >
              Offen
              <Badge
                variant={statusFilter === 'open' ? 'default' : 'secondary'}
                className={cn(
                  'pointer-events-none flex h-5 min-w-[20px] justify-center px-1.5 text-[10px]',
                  statusFilter === 'open' &&
                    'bg-amber-600 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-500'
                )}
              >
                {getStatusCount('open')}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value='completed'
              className='data-[state=active]:bg-background flex items-center gap-2 rounded-md text-xs font-semibold transition-all data-[state=active]:shadow-sm'
            >
              Erledigt
              <Badge
                variant={statusFilter === 'completed' ? 'default' : 'secondary'}
                className={cn(
                  'pointer-events-none flex h-5 min-w-[20px] justify-center px-1.5 text-[10px]',
                  statusFilter === 'completed' &&
                    'bg-green-600 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-500'
                )}
              >
                {getStatusCount('completed')}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <CardContent className='min-h-0 flex-1 pt-0'>
        <div ref={scrollAreaRef} className='h-full overflow-y-auto'>
          {isLoading ? (
            <div className='space-y-1'>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className='flex items-center p-2'>
                  <Skeleton className='h-9 w-12' />
                  <div className='ml-4 flex-1 space-y-1'>
                    <Skeleton className='h-4 w-[150px]' />
                    <Skeleton className='h-3 w-[200px]' />
                  </div>
                  <Skeleton className='ml-auto h-4 w-[80px]' />
                </div>
              ))}
            </div>
          ) : trips.length === 0 ? (
            <div className='text-muted-foreground border-muted/50 flex h-[300px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed'>
              <p className='text-sm italic'>
                Keine Fahrten für diesen Zeitraum gefunden.
              </p>
            </div>
          ) : (
            <div className='grid gap-2'>
              {trips.map((trip) => {
                const isAnchor = anchorTripId === trip.id;

                return (
                  <div key={trip.id} ref={isAnchor ? anchorTripRef : undefined}>
                    <TripRow
                      trip={trip}
                      onClick={() => handleTripClick(trip.id)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
      <TripDetailSheet
        tripId={selectedTripId}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onNavigateToTrip={(id) => setSelectedTripId(id)}
      />
    </Card>
  );
}
