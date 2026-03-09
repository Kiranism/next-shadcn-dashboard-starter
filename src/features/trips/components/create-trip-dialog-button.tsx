'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateTripDialog } from './create-trip-dialog';

export function CreateTripDialogButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className='gap-2'>
        <Plus className='h-4 w-4' />
        Fahrt erstellen
      </Button>
      <CreateTripDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
