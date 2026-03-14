'use client';

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
          variant='ghost'
          size='sm'
          className='text-muted-foreground hover:text-foreground h-7 gap-1 text-xs'
        >
          <Plus className='h-3.5 w-3.5' />
          Fahrgast
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-52 p-1' align='start' side='bottom'>
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
