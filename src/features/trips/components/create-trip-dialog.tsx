'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { CreateTripForm } from './create-trip-form';
import { PlusCircle } from 'lucide-react';

interface CreateTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTripDialog({
  open,
  onOpenChange,
  onSuccess
}: CreateTripDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-xl'>
        <DialogHeader className='shrink-0 border-b px-6 py-4'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-lg'>
              <PlusCircle className='h-4 w-4' />
            </div>
            <div>
              <DialogTitle className='text-base font-semibold'>
                Neue Fahrt erstellen
              </DialogTitle>
              <DialogDescription className='text-muted-foreground mt-0.5 text-xs'>
                Felder mit * sind Pflichtfelder
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto'>
          <CreateTripForm
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
