'use client';

import * as React from 'react';
import { X, Accessibility } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { PassengerEntry } from '@/features/trips/types';

interface PassengerBadgeProps {
  passenger: PassengerEntry;
  stationField: 'pickup_station' | 'dropoff_station';
  onRemove: () => void;
  onStationChange: (value: string) => void;
  onWheelchairChange: (value: boolean) => void;
  className?: string;
}

export function PassengerBadge({
  passenger,
  stationField,
  onRemove,
  onStationChange,
  onWheelchairChange,
  className
}: PassengerBadgeProps) {
  const name =
    [passenger.first_name, passenger.last_name].filter(Boolean).join(' ') ||
    '—';
  const stationValue =
    stationField === 'pickup_station'
      ? passenger.pickup_station
      : passenger.dropoff_station;

  return (
    <div
      className={cn(
        'group bg-background hover:border-foreground/20 relative flex flex-col gap-1 rounded-md border p-2 transition-colors',
        passenger.is_wheelchair && 'border-rose-200 dark:border-rose-800',
        className
      )}
    >
      <div className='flex items-center gap-1'>
        <span className='min-w-0 flex-1 truncate text-xs leading-none font-medium'>
          {name}
        </span>
        <button
          type='button'
          onClick={() => onWheelchairChange(!passenger.is_wheelchair)}
          title='Rollstuhl'
          className={cn(
            'shrink-0 rounded transition-colors',
            passenger.is_wheelchair
              ? 'text-rose-500'
              : 'text-muted-foreground/40 hover:text-rose-400'
          )}
          aria-label='Rollstuhl umschalten'
        >
          <Accessibility className='h-3 w-3' />
        </button>
        <button
          type='button'
          onClick={onRemove}
          className='text-muted-foreground hover:text-destructive shrink-0 rounded opacity-0 transition-opacity group-hover:opacity-100'
          aria-label='Entfernen'
        >
          <X className='h-3 w-3' />
        </button>
      </div>
      <Input
        value={stationValue}
        onChange={(e) => onStationChange(e.target.value)}
        placeholder='Station...'
        className='bg-muted/40 h-6 border-dashed px-1.5 text-[10px] focus-visible:ring-1'
      />
    </div>
  );
}
