'use client';

/**
 * Single passenger row: name(s), wheelchair toggle, station field.
 * Touch: larger controls and always-visible remove below `sm`; compact hover affordances on desktop.
 */
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
  onFirstNameChange?: (value: string) => void;
  onLastNameChange?: (value: string) => void;
  className?: string;
}

export function PassengerBadge({
  passenger,
  stationField,
  onRemove,
  onStationChange,
  onWheelchairChange,
  onFirstNameChange,
  onLastNameChange,
  className
}: PassengerBadgeProps) {
  const stationValue =
    stationField === 'pickup_station'
      ? passenger.pickup_station
      : passenger.dropoff_station;

  const isEditable = !!(onFirstNameChange || onLastNameChange);

  return (
    <div
      className={cn(
        'group bg-background hover:border-foreground/20 relative flex flex-col gap-2 rounded-md border p-2.5 sm:gap-1 sm:p-2',
        passenger.is_wheelchair && 'border-rose-200 dark:border-rose-800',
        className
      )}
    >
      {/* Name row */}
      <div className='flex items-center gap-1.5'>
        {isEditable ? (
          <div className='flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:gap-1'>
            <Input
              value={passenger.first_name}
              onChange={(e) => onFirstNameChange?.(e.target.value)}
              placeholder='Vorname...'
              className='bg-muted/40 min-h-10 border-dashed px-2 text-xs focus-visible:ring-1 sm:h-6 sm:min-h-0 sm:flex-1 sm:px-1.5 sm:text-[10px]'
            />
            <Input
              value={passenger.last_name}
              onChange={(e) => onLastNameChange?.(e.target.value)}
              placeholder='Nachname...'
              className='bg-muted/40 min-h-10 border-dashed px-2 text-xs focus-visible:ring-1 sm:h-6 sm:min-h-0 sm:flex-1 sm:px-1.5 sm:text-[10px]'
            />
          </div>
        ) : (
          <span className='min-w-0 flex-1 truncate text-sm leading-tight font-medium sm:text-xs'>
            {[passenger.first_name, passenger.last_name]
              .filter(Boolean)
              .join(' ') || '—'}
          </span>
        )}

        {/* Wheelchair toggle */}
        <button
          type='button'
          onClick={() => onWheelchairChange(!passenger.is_wheelchair)}
          title='Rollstuhl'
          className={cn(
            'shrink-0 rounded-md p-2 transition-colors sm:p-0.5',
            passenger.is_wheelchair
              ? 'text-rose-500'
              : 'text-muted-foreground/40 hover:text-rose-400'
          )}
          aria-label='Rollstuhl umschalten'
        >
          <Accessibility className='h-4 w-4 sm:h-3 sm:w-3' />
        </button>

        {/* Remove — always visible on touch; hover-only on desktop */}
        <button
          type='button'
          onClick={onRemove}
          className='text-muted-foreground hover:text-destructive shrink-0 rounded-md p-2 opacity-100 transition-opacity sm:p-0.5 sm:opacity-0 sm:group-hover:opacity-100'
          aria-label='Entfernen'
        >
          <X className='h-4 w-4 sm:h-3 sm:w-3' />
        </button>
      </div>

      {/* Station / stop detail — same min-height as name fields on mobile */}
      <Input
        value={stationValue}
        onChange={(e) => onStationChange(e.target.value)}
        placeholder='Station...'
        className='bg-muted/40 min-h-10 border-dashed px-2 text-xs focus-visible:ring-1 sm:h-6 sm:min-h-0 sm:px-1.5 sm:text-[10px]'
      />
    </div>
  );
}
