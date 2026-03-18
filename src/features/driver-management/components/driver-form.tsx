'use client';

/**
 * Driver create/edit form in a sheet (table view).
 *
 * Used only in table view; columns view uses DriverDetailPanel.
 * Uses DriverFormBody for shared fields.
 * Create: POST /api/drivers/create. Edit: driversService.updateDriver + upsertDriverProfile.
 */

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { useDriverFormStore } from '@/features/driver-management/stores/use-driver-form-store';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { DriverFormBody } from './driver-form-body';

export function DriverForm() {
  const { isOpen, mode, driver, close, notifySuccess } = useDriverFormStore();
  const router = useRouter();
  const formRef = useRef<{ submit: () => void }>(null);

  const handleSuccess = () => {
    notifySuccess();
    close();
    router.refresh();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side='right' className='overflow-y-auto sm:max-w-lg'>
        <SheetHeader>
          <SheetTitle>
            {mode === 'create' ? 'Neuer Fahrer' : 'Fahrer bearbeiten'}
          </SheetTitle>
        </SheetHeader>
        <div className='mt-6'>
          <DriverFormBody
            ref={formRef}
            initialData={driver}
            mode={mode}
            onSuccess={handleSuccess}
          />
          <div className='mt-6 flex gap-2'>
            <Button type='button' variant='outline' onClick={close}>
              Abbrechen
            </Button>
            <Button type='button' onClick={() => formRef.current?.submit()}>
              Speichern
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
