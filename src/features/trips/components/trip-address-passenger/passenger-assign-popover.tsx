'use client';

/**
 * Dropoff-only: pick an unassigned passenger to attach to this Zieladresse group.
 */
import * as React from 'react';
import { Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import type { PassengerEntry } from '@/features/trips/types';

interface PassengerAssignPopoverProps {
  unassignedPassengers: PassengerEntry[];
  onAssign: (passengerUid: string) => void;
}

export function PassengerAssignPopover({
  unassignedPassengers,
  onAssign
}: PassengerAssignPopoverProps) {
  const [open, setOpen] = React.useState(false);

  if (unassignedPassengers.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='text-muted-foreground hover:text-foreground h-10 w-full gap-2 text-sm sm:h-8 sm:w-auto sm:gap-1 sm:text-xs'
        >
          <Plus className='h-4 w-4 sm:h-3.5 sm:w-3.5' />
          Fahrgast zuweisen
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[min(calc(100vw-1.5rem),13rem)] p-1 sm:w-52'
        align='start'
        side='bottom'
      >
        <div className='text-muted-foreground px-2 py-1 text-[10px] font-semibold tracking-wider uppercase'>
          Nicht zugewiesen
        </div>
        {unassignedPassengers.map((p) => {
          const name =
            [p.first_name, p.last_name].filter(Boolean).join(' ') || '—';
          return (
            <button
              key={p.uid}
              type='button'
              onClick={() => {
                onAssign(p.uid);
                setOpen(false);
              }}
              className='hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors'
            >
              <User className='text-muted-foreground h-3.5 w-3.5 shrink-0' />
              <span className='truncate text-xs'>{name}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
