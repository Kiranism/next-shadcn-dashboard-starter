'use client';

/**
 * TourenFilterBar — horizontal scrollable status filter chips + date picker.
 *
 * Status chips: Alle | Geplant | Unterwegs | Abgeschlossen | Storniert
 * Date picker: limits results to a specific day (defaults to empty = all time)
 *
 * Mobile-first: the chip row scrolls horizontally without wrapping,
 * keeping the UI clean on narrow screens (375 px+).
 */

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  TRIP_STATUSES,
  type TripStatusFilter
} from '@/features/driver-portal/types/trips.types';

interface FilterChip {
  value: TripStatusFilter;
  label: string;
}

const CHIPS: FilterChip[] = [
  { value: 'all', label: 'Alle' },
  { value: TRIP_STATUSES.SCHEDULED, label: 'Geplant' },
  { value: TRIP_STATUSES.IN_PROGRESS, label: 'Unterwegs' },
  { value: TRIP_STATUSES.COMPLETED, label: 'Abgeschlossen' },
  { value: TRIP_STATUSES.CANCELLED, label: 'Storniert' }
];

interface TourenFilterBarProps {
  statusFilter: TripStatusFilter;
  date: string; // YYYY-MM-DD or ''
  onStatusChange: (status: TripStatusFilter) => void;
  onDateChange: (date: string) => void;
}

export function TourenFilterBar({
  statusFilter,
  date,
  onStatusChange,
  onDateChange
}: TourenFilterBarProps) {
  return (
    <div className='flex flex-col gap-3'>
      {/* Status chips — horizontally scrollable */}
      <div
        className='-mx-4 flex gap-2 overflow-x-auto px-4 pb-1'
        role='group'
        aria-label='Status filtern'
      >
        {CHIPS.map(({ value, label }) => (
          <button
            key={value}
            type='button'
            onClick={() => onStatusChange(value)}
            className={cn(
              'h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors',
              statusFilter === value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-muted-foreground bg-background hover:bg-accent hover:text-accent-foreground border-border'
            )}
            aria-pressed={statusFilter === value}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Date picker */}
      <Input
        type='date'
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        className='h-10 text-sm'
        aria-label='Datum filtern'
      />
    </div>
  );
}
