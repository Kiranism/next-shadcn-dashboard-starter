'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { DriverOption, DispatchTrip } from './use-pending-assignments';

interface PendingAssignmentItemProps {
  trip: DispatchTrip;
  drivers: { id: string; name: string }[];
  selectedDriverId?: string;
  isAssigning?: boolean;
  onDriverSelect: (driverId: string) => void;
  /** Pass the new time string if it was actively modified, otherwise undefined. */
  onAssign: (timeString?: string) => void;
}

/**
 * PendingAssignmentItem
 *
 * Individual row component showcasing passenger details and robust scheduling.
 * Tracks local time edits; enables the "Zuordnen"/Save button either when a driver
 * is chosen or when ONLY the time was changed.
 */
export function PendingAssignmentItem({
  trip,
  drivers,
  selectedDriverId,
  isAssigning,
  onDriverSelect,
  onAssign
}: PendingAssignmentItemProps) {
  const [timeInput, setTimeInput] = React.useState(() => {
    if (trip.scheduled_at) {
      return format(new Date(trip.scheduled_at), 'HH:mm', { locale: de });
    }
    return '';
  });

  const originalTime = trip.scheduled_at
    ? format(new Date(trip.scheduled_at), 'HH:mm', { locale: de })
    : '';

  const tripDate = (() => {
    if (trip?.scheduled_at)
      return new Date(trip.scheduled_at).toISOString().slice(0, 10);
    if (trip?.requested_date) return trip.requested_date;
    const linkedAt = trip?.linked_trip?.scheduled_at;
    if (linkedAt) return new Date(linkedAt).toISOString().slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  })();

  let dateLabel = format(new Date(tripDate), 'dd.MM.yyyy');

  // Calculates if the user manipulated the local time input
  const timeChanged = timeInput !== originalTime && timeInput.length >= 4;

  const handleAssignClick = () => {
    // Inject the modified time string upwards so the hook parses it into the DB
    if (timeChanged) {
      onAssign(timeInput);
    } else {
      onAssign();
    }
  };

  // Button unlocks gracefully if EITHER the driver is selected OR the time was modified
  const isAssignDisabled = isAssigning || (!selectedDriverId && !timeChanged);

  return (
    <div className='hover:bg-muted/30 flex flex-col gap-2 border-b px-4 py-3 text-sm transition-colors last:border-0'>
      <div className='flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5'>
        {/* Passenger List */}
        <span className='text-foreground line-clamp-1 font-medium'>
          {[trip.greeting_style, trip.client_name].filter(Boolean).join(' ') ||
            'Unbekannt'}
        </span>

        {/* Date / Time */}
        <div className='flex flex-col items-end gap-1'>
          <div className='flex items-center gap-1.5'>
            <Input
              type='time'
              className={cn(
                'h-6 w-[70px] px-2 py-0 text-center text-xs focus-visible:ring-rose-500 [&::-webkit-calendar-picker-indicator]:hidden',
                !trip.scheduled_at && 'border-rose-200'
              )}
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              placeholder='HH:mm'
            />
          </div>

          <div className='text-muted-foreground mr-0.5 flex items-center gap-1 text-[10px]'>
            <Calendar className='h-3 w-3' />
            {dateLabel}
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className='text-muted-foreground space-y-0.5 text-xs'>
        <div className='truncate'>
          <span className='font-medium'>A:</span> {trip.pickup_address || '—'}
        </div>
        <div className='truncate'>
          <span className='font-medium'>Z:</span> {trip.dropoff_address || '—'}
        </div>
      </div>

      {/* Driver select + assign */}
      <div className='mt-1 flex items-center gap-2'>
        <Select value={selectedDriverId ?? ''} onValueChange={onDriverSelect}>
          <SelectTrigger className='h-8 flex-1 text-xs'>
            <SelectValue placeholder='Fahrer wählen…' />
          </SelectTrigger>
          <SelectContent>
            {drivers.length === 0 && (
              <div className='text-muted-foreground px-2 py-1.5 text-xs'>
                Keine aktiven Fahrer gefunden.
              </div>
            )}
            {drivers.map((d) => (
              <SelectItem key={d.id} value={d.id} className='text-xs'>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type='button'
          size='sm'
          className={cn(
            'h-8 shrink-0 gap-1.5 text-xs',
            !selectedDriverId && 'cursor-not-allowed'
          )}
          disabled={isAssignDisabled}
          onClick={handleAssignClick}
        >
          {isAssigning ? (
            <>
              <span className='border-background h-3 w-3 animate-spin rounded-full border-2 border-t-transparent' />
              Lädt…
            </>
          ) : (
            <>
              <AlertCircle className='h-3 w-3' />
              Zuordnen
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
