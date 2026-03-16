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
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
    <Card>
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
          <TabsList className='grid h-12 w-full grid-cols-3 bg-slate-100/80 p-1.5'>
            <TabsTrigger
              value='all'
              className='flex items-center gap-2 rounded-md text-xs font-semibold transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm'
            >
              Alle
              <Badge
                variant={statusFilter === 'all' ? 'default' : 'secondary'}
                className={cn(
                  'pointer-events-none flex h-5 min-w-[20px] justify-center px-1.5 text-[10px]',
                  statusFilter === 'all' && 'bg-blue-600 hover:bg-blue-600'
                )}
              >
                {getStatusCount('all')}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value='open'
              className='flex items-center gap-2 rounded-md text-xs font-semibold transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm'
            >
              Offen
              <Badge
                variant={statusFilter === 'open' ? 'default' : 'secondary'}
                className={cn(
                  'pointer-events-none flex h-5 min-w-[20px] justify-center px-1.5 text-[10px]',
                  statusFilter === 'open' && 'bg-amber-600 hover:bg-amber-600'
                )}
              >
                {getStatusCount('open')}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value='completed'
              className='flex items-center gap-2 rounded-md text-xs font-semibold transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm'
            >
              Erledigt
              <Badge
                variant={statusFilter === 'completed' ? 'default' : 'secondary'}
                className={cn(
                  'pointer-events-none flex h-5 min-w-[20px] justify-center px-1.5 text-[10px]',
                  statusFilter === 'completed' &&
                    'bg-green-600 hover:bg-green-600'
                )}
              >
                {getStatusCount('completed')}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <CardContent className='pt-0'>
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
            {trips.map((trip) => (
              <TripRow
                key={trip.id}
                trip={trip}
                onClick={() => handleTripClick(trip.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
      <TripDetailSheet
        tripId={selectedTripId}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </Card>
  );
}
