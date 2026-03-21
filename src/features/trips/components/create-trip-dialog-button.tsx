'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateTripDialog } from './create-trip-dialog';

export function CreateTripDialogButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        type='button'
        onClick={() => setOpen(true)}
        className='gap-2'
        aria-label='Fahrt erstellen'
        title='Fahrt erstellen'
      >
        <Plus className='h-4 w-4 shrink-0' />
        <span className='hidden sm:inline'>Fahrt erstellen</span>
      </Button>
      <CreateTripDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
