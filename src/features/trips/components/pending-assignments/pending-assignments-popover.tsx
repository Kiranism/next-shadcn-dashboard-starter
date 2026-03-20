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

/**
 * PendingAssignmentsPopover
 *
 * The UI shell for the Dispatch Inbox. Sits in the top header and acts as a central
 * notification hub for pending trips. Displays a categorized list of:
 * - Upcoming scheduled trips naturally missing drivers
 * - Open tours completely lacking time and driver
 * - CSV imports strictly requiring dispatcher review
 */
export function PendingAssignmentsPopover() {
  const [filter, setFilter] = React.useState<'today' | 'all'>('today');

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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
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

          {/* Badge */}
          {!isLoading && hasAny && (
            <span className='border-background absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 bg-amber-500 px-1 text-[9px] font-bold text-white shadow-sm'>
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          )}
          {!isLoading && !hasAny && (
            <CheckCircle2 className='bg-background absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full text-emerald-500' />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align='end' className='w-[420px] p-0' sideOffset={8}>
        {/* Header */}
        <div className='bg-muted/20 flex items-center gap-3 border-b px-4 py-3'>
          {isLoading ? (
            <>
              <div className='bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full'>
                <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
              </div>
              <div>
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
              <div>
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
              <div>
                <p className='text-sm font-medium text-emerald-700 dark:text-emerald-400'>
                  Alles erledigt
                </p>
                <p className='text-muted-foreground text-xs'>
                  Keine offenen Fahrten gefunden.
                </p>
              </div>
            </>
          )}

          {/* Toggle 
              Changes the underlying hook's filter logic. "Heute" strictly looks for trips 
              where the evaluated tripDate falls perfectly inside today.
          */}
          {!isLoading && (
            <div className='ml-auto'>
              <Tabs
                value={filter}
                onValueChange={(v) => setFilter(v as 'today' | 'all')}
                className='w-[140px]'
              >
                <TabsList className='grid h-8 w-full grid-cols-2'>
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

        {/* Content Lists */}
        {!isLoading && hasAny && (
          <ScrollArea className='h-[420px]'>
            <div className='flex flex-col'>
              {/* Section 1: Unassigned Today */}
              {unassignedToday.length > 0 && (
                <div className='flex flex-col'>
                  <div className='bg-muted/80 sticky top-0 z-10 flex items-center gap-2 border-y px-4 py-1.5 text-xs font-semibold backdrop-blur-sm'>
                    <Truck className='h-3.5 w-3.5 text-blue-600 dark:text-blue-400' />
                    Anstehend ohne Fahrer ({unassignedToday.length})
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
                      onAssign={(timeString) =>
                        void handleAssign(trip.id, timeString)
                      }
                    />
                  ))}
                </div>
              )}

              {/* Section 2: Open Tours (No Time) */}
              {openTours.length > 0 && (
                <div className='flex flex-col'>
                  <div className='bg-muted/80 mt-first:border-t-0 sticky top-0 z-10 flex items-center gap-2 border-y px-4 py-1.5 text-xs font-semibold backdrop-blur-sm'>
                    <Clock className='h-3.5 w-3.5 text-rose-600 dark:text-rose-400' />
                    Offene Touren ({openTours.length})
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
                      onAssign={(timeString) =>
                        void handleAssign(trip.id, timeString)
                      }
                    />
                  ))}
                </div>
              )}

              {/* Section 3: CSV Pending */}
              {csvPending.length > 0 && (
                <div className='flex flex-col'>
                  <div className='bg-muted/80 mt-first:border-t-0 sticky top-0 z-10 flex items-center gap-2 border-y px-4 py-1.5 text-xs font-semibold backdrop-blur-sm'>
                    <MapPin className='h-3.5 w-3.5 text-amber-600 dark:text-amber-400' />
                    Ungelöste CSV-Importe ({csvPending.length})
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
                      onAssign={(timeString) =>
                        void handleAssign(trip.id, timeString)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
