'use client';

/**
 * Create-trip shell: `Drawer` below 768px (full-height, form + client panel stacked);
 * `Dialog` from md up with responsive 1/3 + 2/3 columns when a client is selected.
 */
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from '@/components/ui/drawer';
import { CreateTripForm } from './create-trip-form';
import { ClientTripsPanel } from '../client-trips-panel';
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

function CreateTripDialogHeader() {
  return (
    <div className='flex items-center gap-3'>
      <div className='bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg'>
        <PlusCircle className='h-4 w-4' />
      </div>
      <div className='min-w-0'>
        <DialogTitle className='text-base font-semibold'>
          Neue Fahrt erstellen
        </DialogTitle>
        <DialogDescription className='text-muted-foreground mt-0.5 text-xs'>
          Felder mit * sind Pflichtfelder
        </DialogDescription>
      </div>
    </div>
  );
}

function CreateTripDrawerHeader() {
  return (
    <div className='flex items-center gap-3 px-1'>
      <div className='bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg'>
        <PlusCircle className='h-4 w-4' />
      </div>
      <div className='min-w-0'>
        <DrawerTitle className='text-base font-semibold'>
          Neue Fahrt erstellen
        </DrawerTitle>
        <DrawerDescription className='text-muted-foreground mt-0.5 text-xs'>
          Felder mit * sind Pflichtfelder
        </DrawerDescription>
      </div>
    </div>
  );
}

export function CreateTripDialog({
  open,
  onOpenChange,
  onSuccess,
  preselectedClientId
}: CreateTripDialogProps) {
  const [selectedClient, setSelectedClient] =
    React.useState<ClientOption | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  // Aligns with Tailwind `md` (768px): phones use Drawer, tablets/desktop use Dialog.
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

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

  const formEl = (
    <CreateTripForm
      onSuccess={handleSuccess}
      onCancel={() => handleOpenChange(false)}
      onClientSelect={setSelectedClient}
      preselectedClientId={preselectedClientId ?? undefined}
    />
  );

  const panelEl = showPanel ? (
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
  ) : null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent
          className={cn(
            'flex max-h-[100dvh] flex-col gap-0 p-0',
            showPanel ? 'h-[100dvh]' : 'max-h-[96dvh]'
          )}
        >
          <DrawerHeader className='shrink-0 border-b px-4 py-4 text-left sm:px-6'>
            <CreateTripDrawerHeader />
          </DrawerHeader>
          <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
            <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain'>
              {formEl}
            </div>
            {showPanel && (
              <div className='bg-muted/20 flex max-h-[42vh] min-h-0 shrink-0 flex-col overflow-hidden border-t'>
                {panelEl}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'flex max-h-[90vh] flex-col overflow-hidden p-0 transition-all duration-300',
          'w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:max-h-[90vh]',
          showPanel ? 'md:max-w-5xl' : 'md:max-w-3xl'
        )}
      >
        <DialogHeader className='shrink-0 border-b px-4 py-4 sm:px-6'>
          <CreateTripDialogHeader />
        </DialogHeader>

        <div className='flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row'>
          <div
            className={cn(
              'min-h-0 w-full overflow-y-auto overscroll-contain',
              showPanel && 'md:w-2/3 md:shrink-0'
            )}
          >
            {formEl}
          </div>
          {showPanel && (
            <div className='flex min-h-0 w-full overflow-hidden border-t md:w-1/3 md:shrink-0 md:border-t-0 md:border-l'>
              {panelEl}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
