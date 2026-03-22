'use client';

/**
 * Create-trip shell: Vaul `Drawer` below 768px; `Dialog` from md up.
 * Outside / Escape: always confirm before closing. **Desktop:** `AlertDialog`. **Mobile:** in-drawer
 * sheet (no second Radix modal on top of Vaul — avoids iOS freeze / stuck pointer-events).
 * X / Abbrechen: `requestClose` (confirm only when dirty).
 * `dismissible={!isFormDirty}` blocks swipe-close while dirty.
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { CreateTripForm } from './create-trip-form';
import { ClientTripsPanel } from '../client-trips-panel';
import type { ClientOption } from '@/features/trips/hooks/use-trip-form-data';
import { Button } from '@/components/ui/button';
import { PlusCircle, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Portaled Radix Dialog UI (e.g. mobile date wheel) — not inside our trip drawer root. */
function isPortaledDialogChromeTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const el = target.closest(
    '[data-slot="dialog-overlay"],[data-slot="dialog-content"]'
  );
  if (!el) return false;
  return !el.closest('[data-create-trip-drawer]');
}

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
  const [isFormDirty, setIsFormDirty] = React.useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = React.useState(false);
  const mobileScrollRef = React.useRef<HTMLDivElement>(null);

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
      setIsFormDirty(false);
      setCloseConfirmOpen(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open || !isMobile || typeof window === 'undefined') return;
    const vv = window.visualViewport;
    const el = mobileScrollRef.current;
    if (!vv || !el) return;
    const nudge = () => {
      const t = el.scrollTop;
      el.scrollTop = t + 1;
      el.scrollTop = t;
    };
    vv.addEventListener('resize', nudge);
    vv.addEventListener('scroll', nudge);
    return () => {
      vv.removeEventListener('resize', nudge);
      vv.removeEventListener('scroll', nudge);
    };
  }, [open, isMobile]);

  const handleSuccess = () => {
    onOpenChange(false);
    setSelectedClient(null);
    onSuccess?.();
  };

  const requestClose = React.useCallback(() => {
    if (isFormDirty) {
      setCloseConfirmOpen(true);
      return;
    }
    setSelectedClient(null);
    onOpenChange(false);
  }, [isFormDirty, onOpenChange]);

  /** Overlay / Escape: always confirm — avoids controlled `open` vs internal close desync. */
  const handleOutsideOrEscapeDismiss = React.useCallback((e: Event) => {
    e.preventDefault();
    setCloseConfirmOpen(true);
  }, []);

  const handleDrawerPointerDownOutside = React.useCallback(
    (e: Event) => {
      const t =
        (e as unknown as { target?: EventTarget | null }).target ?? null;
      if (isPortaledDialogChromeTarget(t)) {
        e.preventDefault();
        return;
      }
      handleOutsideOrEscapeDismiss(e);
    },
    [handleOutsideOrEscapeDismiss]
  );

  const handleDrawerEscapeKeyDown = React.useCallback(
    (e: Event) => {
      if (closeConfirmOpen) {
        e.preventDefault();
        setCloseConfirmOpen(false);
        return;
      }
      handleOutsideOrEscapeDismiss(e);
    },
    [closeConfirmOpen, handleOutsideOrEscapeDismiss]
  );

  const confirmClose = () => {
    setCloseConfirmOpen(false);
    setSelectedClient(null);
    onOpenChange(false);
  };

  const showDesktopPanel = !!selectedClient && !isMobile;

  const formEl = (
    <CreateTripForm
      onSuccess={handleSuccess}
      onCancel={requestClose}
      onDirtyChange={setIsFormDirty}
      onClientSelect={setSelectedClient}
      preselectedClientId={preselectedClientId ?? undefined}
    />
  );

  const panelEl = showDesktopPanel ? (
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

  const leaveConfirmTitle = 'Erstellung abbrechen?';
  const leaveConfirmDescription =
    'Ein Entwurf kann auf diesem Gerät gespeichert sein. Trotzdem schließen?';

  const desktopLeaveConfirm = (
    <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
      <AlertDialogContent className='z-[80]'>
        <AlertDialogHeader>
          <AlertDialogTitle>{leaveConfirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {leaveConfirmDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className='touch-manipulation'>
            Weiter bearbeiten
          </AlertDialogCancel>
          <AlertDialogAction
            className='touch-manipulation'
            onClick={confirmClose}
          >
            Schließen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (isMobile) {
    return (
      <>
        <Drawer
          open={open}
          repositionInputs={false}
          dismissible={!isFormDirty}
          onOpenChange={(next) => {
            if (next) {
              onOpenChange(true);
              return;
            }
            setSelectedClient(null);
            onOpenChange(false);
          }}
        >
          <DrawerContent
            data-create-trip-drawer
            className={cn(
              'flex max-h-[100dvh] flex-col gap-0 p-0',
              'h-[100dvh] max-h-[100dvh]'
            )}
            onPointerDownOutside={handleDrawerPointerDownOutside}
            onEscapeKeyDown={handleDrawerEscapeKeyDown}
          >
            <DrawerHeader className='shrink-0 border-b px-4 py-4 text-left sm:px-6'>
              <CreateTripDrawerHeader />
            </DrawerHeader>
            <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
              <div
                ref={mobileScrollRef}
                className='min-h-0 flex-1 overflow-y-auto overscroll-contain'
              >
                {formEl}
              </div>
            </div>

            {closeConfirmOpen ? (
              <div
                className='absolute inset-0 z-[100] flex flex-col justify-end'
                role='alertdialog'
                aria-modal='true'
                aria-labelledby='create-trip-leave-title'
                aria-describedby='create-trip-leave-desc'
              >
                <button
                  type='button'
                  className='min-h-0 flex-1 cursor-default touch-manipulation bg-black/50'
                  aria-label='Weiter bearbeiten'
                  onClick={() => setCloseConfirmOpen(false)}
                />
                <div className='bg-background border-border relative rounded-t-xl border-x border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg'>
                  <h2
                    id='create-trip-leave-title'
                    className='text-lg leading-none font-semibold'
                  >
                    {leaveConfirmTitle}
                  </h2>
                  <p
                    id='create-trip-leave-desc'
                    className='text-muted-foreground mt-2 text-sm'
                  >
                    {leaveConfirmDescription}
                  </p>
                  <div className='mt-4 flex flex-col-reverse gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      className='min-h-11 w-full touch-manipulation'
                      onClick={() => setCloseConfirmOpen(false)}
                    >
                      Weiter bearbeiten
                    </Button>
                    <Button
                      type='button'
                      className='min-h-11 w-full touch-manipulation'
                      onClick={confirmClose}
                    >
                      Schließen
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) {
            onOpenChange(true);
            return;
          }
          setSelectedClient(null);
          onOpenChange(false);
        }}
      >
        <DialogContent
          showCloseButton={false}
          onInteractOutside={handleOutsideOrEscapeDismiss}
          onEscapeKeyDown={handleOutsideOrEscapeDismiss}
          className={cn(
            'flex max-h-[90vh] flex-col overflow-hidden p-0 transition-all duration-300',
            'w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:max-h-[90vh]',
            showDesktopPanel ? 'md:max-w-5xl' : 'md:max-w-3xl'
          )}
        >
          <button
            type='button'
            onClick={() => requestClose()}
            className={cn(
              'ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
              'inline-flex size-9 items-center justify-center',
              'absolute top-4 right-4 z-10 rounded-xs opacity-70 transition-opacity hover:opacity-100',
              'focus:ring-2 focus:ring-offset-2 focus:outline-hidden',
              '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0'
            )}
            aria-label='Schließen'
          >
            <XIcon />
          </button>
          <DialogHeader className='shrink-0 border-b px-4 py-4 pr-14 sm:px-6 sm:pr-16'>
            <CreateTripDialogHeader />
          </DialogHeader>

          <div className='flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row'>
            <div
              className={cn(
                'min-h-0 w-full overflow-y-auto overscroll-contain',
                showDesktopPanel && 'md:w-2/3 md:shrink-0'
              )}
            >
              {formEl}
            </div>
            {showDesktopPanel ? (
              <div className='flex min-h-0 w-full overflow-hidden border-t md:w-1/3 md:shrink-0 md:border-t-0 md:border-l'>
                {panelEl}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
      {desktopLeaveConfirm}
    </>
  );
}
