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
import { ClientTripsPanel } from './client-trips-panel';
import type { ClientOption } from '@/features/trips/hooks/use-trip-form-data';
import { PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /**
   * Optional client preset when opening globally (e.g. from Cmd+K).
   * When provided, the form should preselect this client.
   */
  preselectedClientId?: string | null;
}

export function CreateTripDialog({
  open,
  onOpenChange,
  onSuccess,
  preselectedClientId
}: CreateTripDialogProps) {
  const [selectedClient, setSelectedClient] =
    React.useState<ClientOption | null>(null);

  // When the dialog opens with a preselected client id, ensure the
  // internal state is reset so the form can handle selecting it.
  React.useEffect(() => {
    if (!open) {
      setSelectedClient(null);
    }
  }, [open]);

  const handleSuccess = () => {
    onOpenChange(false);
    setSelectedClient(null);
    onSuccess?.();
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) setSelectedClient(null);
    onOpenChange(value);
  };

  const showPanel = !!selectedClient;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'flex max-h-[90vh] flex-col overflow-hidden p-0 transition-all duration-300',
          showPanel ? 'sm:max-w-5xl' : 'sm:max-w-3xl'
        )}
      >
        {/* Header */}
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

        {/* Body — split when client is selected */}
        <div className='flex flex-1 overflow-hidden'>
          {/* Form — takes full width or 2/3 */}
          <div
            className={cn(
              'overflow-y-auto',
              showPanel ? 'w-2/3 shrink-0' : 'w-full'
            )}
          >
            <CreateTripForm
              onSuccess={handleSuccess}
              onCancel={() => handleOpenChange(false)}
              onClientSelect={setSelectedClient}
              preselectedClientId={preselectedClientId ?? undefined}
            />
          </div>

          {/* Side panel — 1/3, only visible when client is selected */}
          {showPanel && (
            <div className='w-1/3 shrink-0 overflow-hidden'>
              <ClientTripsPanel
                clientId={selectedClient!.id}
                clientName={
                  selectedClient!.is_company
                    ? selectedClient!.company_name || ''
                    : [selectedClient!.first_name, selectedClient!.last_name]
                        .filter(Boolean)
                        .join(' ')
                }
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
