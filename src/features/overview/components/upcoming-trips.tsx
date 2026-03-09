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
  TripFilter
} from '@/features/trips/hooks/use-upcoming-trips';
import { Skeleton } from '@/components/ui/skeleton';
import { TripRow } from './trip-row';

export function UpcomingTrips() {
  const { trips, filter, setFilter, isLoading } = useUpcomingTrips();

  const handleFilterChange = (value: string) => {
    setFilter(value as TripFilter);
  };

  return (
    <Card className='h-full'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-7'>
        <div className='space-y-1'>
          <CardTitle>Nächste Fahrten</CardTitle>
          <CardDescription>
            {trips.length} bevorstehende Fahrten{' '}
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
      <CardContent className='pt-0'>
        {isLoading ? (
          <div className='space-y-4'>
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
          <div className='grid gap-4'>
            {trips.map((trip) => (
              <TripRow key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
