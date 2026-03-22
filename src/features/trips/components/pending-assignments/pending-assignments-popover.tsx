'use client';

import {
  Bell,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger
} from '@/components/ui/drawer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDispatchInbox } from './use-pending-assignments';
import { PendingAssignmentItem } from './pending-assignment-item';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { useIsNarrowScreen } from '@/hooks/use-is-narrow-screen';

/**
 * PendingAssignmentsPopover
 *
 * The UI shell for the Dispatch Inbox. Sits in the top header and acts as a central
 * notification hub for pending trips. Displays a categorized list of:
 * - Upcoming scheduled trips naturally missing drivers
 * - Open tours completely lacking time and driver
 * - CSV imports strictly requiring dispatcher review
 *
 * On narrow viewports uses a bottom Drawer; on md+ uses a Popover.
 */
export function PendingAssignmentsPopover() {
  const [filter, setFilter] = React.useState<'today' | 'all'>('today');
  const narrow = useIsNarrowScreen(768);

  const {
    isLoading,
    isAssigning,
    unassignedToday,
    openTours,
    csvPending,
    drivers,
    selectedDriverByTrip,
    setSelectedDriverByTrip,
    handleAssign,
    totalCount
  } = useDispatchInbox(filter);

  const [isOpen, setIsOpen] = React.useState(false);
  const hasAny = totalCount > 0;

  const triggerButton = (
    <Button
      variant='outline'
      size='icon'
      className={cn(
        'relative h-9 w-9 transition-colors',
        isOpen && 'bg-accent'
      )}
      aria-label='Dispositionseingang'
    >
      {isLoading ? (
        <Loader2 className='h-4 w-4 animate-spin' />
      ) : (
        <Bell
          className={cn(
            'h-4 w-4',
            hasAny
              ? 'text-amber-600 dark:text-amber-500'
              : 'text-muted-foreground'
          )}
        />
      )}

      {!isLoading && hasAny && (
        <span className='border-background absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 bg-amber-500 px-1 text-[9px] font-bold text-white shadow-sm'>
          {totalCount > 9 ? '9+' : totalCount}
        </span>
      )}
      {!isLoading && !hasAny && (
        <CheckCircle2 className='bg-background absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full text-emerald-500' />
      )}
    </Button>
  );

  const headerBlock = (
    <div className='bg-muted/20 flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:gap-3'>
      {isLoading ? (
        <>
          <div className='bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full'>
            <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
          </div>
          <div className='min-w-0'>
            <span className='text-sm font-medium'>Lade Eingänge…</span>
            <p className='text-muted-foreground text-xs'>
              Fahrten werden synchronisiert
            </p>
          </div>
        </>
      ) : hasAny ? (
        <>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50'>
            <Bell className='h-4 w-4 text-amber-600 dark:text-amber-500' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-medium'>
              Dispositionseingang ({totalCount})
            </p>
            <p className='text-muted-foreground text-xs'>
              Bitte Fahrern zuordnen
            </p>
          </div>
        </>
      ) : (
        <>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50'>
            <CheckCircle2 className='h-4 w-4 text-emerald-600 dark:text-emerald-500' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-medium text-emerald-700 dark:text-emerald-400'>
              Alles erledigt
            </p>
            <p className='text-muted-foreground text-xs'>
              Keine offenen Fahrten gefunden.
            </p>
          </div>
        </>
      )}

      {!isLoading && (
        <div className='w-full shrink-0 sm:ml-auto sm:w-auto'>
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as 'today' | 'all')}
            className='w-full sm:w-[140px]'
          >
            <TabsList className='grid h-9 w-full grid-cols-2 sm:h-8'>
              <TabsTrigger value='today' className='text-xs'>
                Heute
              </TabsTrigger>
              <TabsTrigger value='all' className='text-xs'>
                Alle
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
    </div>
  );

  const listInner = (
    <div className='flex flex-col'>
      {unassignedToday.length > 0 && (
        <div className='flex flex-col'>
          <div className='bg-muted/80 sticky top-0 z-10 flex items-center gap-2 border-y px-4 py-1.5 text-xs font-semibold backdrop-blur-sm'>
            <Truck className='h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400' />
            <span className='min-w-0'>
              Anstehend ohne Fahrer ({unassignedToday.length})
            </span>
          </div>
          {unassignedToday.map((trip) => (
            <PendingAssignmentItem
              key={trip.id}
              trip={trip}
              drivers={drivers}
              selectedDriverId={selectedDriverByTrip[trip.id]}
              isAssigning={!!isAssigning[trip.id]}
              onDriverSelect={(driverId) =>
                setSelectedDriverByTrip((prev) => ({
                  ...prev,
                  [trip.id]: driverId
                }))
              }
              onAssign={(timeString) => void handleAssign(trip.id, timeString)}
            />
          ))}
        </div>
      )}

      {openTours.length > 0 && (
        <div className='flex flex-col'>
          <div className='bg-muted/80 mt-first:border-t-0 sticky top-0 z-10 flex items-center gap-2 border-y px-4 py-1.5 text-xs font-semibold backdrop-blur-sm'>
            <Clock className='h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400' />
            <span className='min-w-0'>Offene Touren ({openTours.length})</span>
          </div>
          {openTours.map((trip) => (
            <PendingAssignmentItem
              key={trip.id}
              trip={trip}
              drivers={drivers}
              selectedDriverId={selectedDriverByTrip[trip.id]}
              isAssigning={!!isAssigning[trip.id]}
              onDriverSelect={(driverId) =>
                setSelectedDriverByTrip((prev) => ({
                  ...prev,
                  [trip.id]: driverId
                }))
              }
              onAssign={(timeString) => void handleAssign(trip.id, timeString)}
            />
          ))}
        </div>
      )}

      {csvPending.length > 0 && (
        <div className='flex flex-col'>
          <div className='bg-muted/80 mt-first:border-t-0 sticky top-0 z-10 flex items-center gap-2 border-y px-4 py-1.5 text-xs font-semibold backdrop-blur-sm'>
            <MapPin className='h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400' />
            <span className='min-w-0'>
              Ungelöste CSV-Importe ({csvPending.length})
            </span>
          </div>
          {csvPending.map((trip) => (
            <PendingAssignmentItem
              key={trip.id}
              trip={trip}
              drivers={drivers}
              selectedDriverId={selectedDriverByTrip[trip.id]}
              isAssigning={!!isAssigning[trip.id]}
              onDriverSelect={(driverId) =>
                setSelectedDriverByTrip((prev) => ({
                  ...prev,
                  [trip.id]: driverId
                }))
              }
              onAssign={(timeString) => void handleAssign(trip.id, timeString)}
            />
          ))}
        </div>
      )}
    </div>
  );

  const listBlock =
    !isLoading && hasAny ? (
      narrow ? (
        <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,0px)]'>
          {listInner}
        </div>
      ) : (
        <ScrollArea className='h-[420px]'>{listInner}</ScrollArea>
      )
    ) : null;

  if (narrow) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen} repositionInputs={false}>
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className='flex max-h-[90dvh] flex-col gap-0 p-0'>
          <DrawerTitle className='sr-only'>Dispositionseingang</DrawerTitle>
          <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
            {headerBlock}
            {listBlock}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        align='end'
        className='flex w-[min(100vw-1rem,420px)] max-w-[calc(100vw-0.5rem)] flex-col p-0 sm:w-[420px]'
        sideOffset={8}
        collisionPadding={8}
      >
        {headerBlock}
        {listBlock}
      </PopoverContent>
    </Popover>
  );
}
