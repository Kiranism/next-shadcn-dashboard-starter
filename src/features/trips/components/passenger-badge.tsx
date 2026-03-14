'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { PassengerEntry } from '@/features/trips/types';

interface PassengerBadgeProps {
  passenger: PassengerEntry;
  stationField: 'pickup_station' | 'dropoff_station';
  onRemove: () => void;
  onStationChange: (value: string) => void;
  className?: string;
}

export function PassengerBadge({
  passenger,
  stationField,
  onRemove,
  onStationChange,
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
        className
      )}
    >
      <div className='flex items-center gap-1'>
        <span className='min-w-0 flex-1 truncate text-xs leading-none font-medium'>
          {name}
        </span>
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
