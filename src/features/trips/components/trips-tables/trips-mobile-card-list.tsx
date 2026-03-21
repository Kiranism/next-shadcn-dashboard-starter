'use client';

/**
 * Trips “list” on narrow viewports: card stack instead of `DataTable` (see `TripsTable`
 * + `useIsNarrowScreen(768)`). The scroll container below owns vertical overflow; optional
 * `scrollAnchorRowId` scrolls the first relevant row into view after load.
 */
import * as React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Accessibility } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Trip } from '@/features/trips/api/trips.service';
import {
  tripStatusBadge,
  tripStatusLabels,
  type TripStatus
} from '@/lib/trip-status';
import { UrgencyIndicator } from '@/features/trips/components/urgency-indicator';
import { CellAction } from './cell-action';
import { DataTablePagination } from '@/components/ui/table/data-table-pagination';
import type { Table as TanstackTable } from '@tanstack/react-table';

interface TripsMobileCardListProps<TData> {
  table: TanstackTable<TData>;
  getRowClassName?: (row: TData) => string;
  scrollAnchorRowId?: string | null;
}

function parseAddress(raw: string | null | undefined): {
  street: string | null;
  cityLine: string | null;
} {
  if (!raw) return { street: null, cityLine: null };
  const match = raw.match(/^(.*?)\s*,?\s*(\d{5}\s+.+)$/);
  if (match) {
    return {
      street: match[1].trim() || null,
      cityLine: match[2].trim()
    };
  }
  return { street: raw, cityLine: null };
}

export function TripsMobileCardList<TData>({
  table,
  getRowClassName,
  scrollAnchorRowId
}: TripsMobileCardListProps<TData>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;

  React.useEffect(() => {
    if (!scrollAnchorRowId || !containerRef.current) return;
    const timer = setTimeout(() => {
      const anchor = containerRef.current?.querySelector(
        '[data-scroll-anchor="true"]'
      ) as HTMLElement | null;
      if (anchor) {
        anchor.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [scrollAnchorRowId, rows.length]);

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-3'>
      <div
        ref={containerRef}
        className='flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-2'
      >
        {rows.map((tableRow) => {
          const trip = tableRow.original as unknown as Trip;
          const rowId = tableRow.id;
          const scheduled = trip.scheduled_at
            ? new Date(trip.scheduled_at)
            : null;
          const valid =
            scheduled &&
            !Number.isNaN(scheduled.getTime()) &&
            scheduled.getTime() > 0;
          const pickup = parseAddress(trip.pickup_address);
          const dropoff = parseAddress(trip.dropoff_address);
          const status = trip.status as TripStatus;
          const rowClass = getRowClassName?.(tableRow.original) ?? '';

          return (
            <Card
              key={trip.id}
              data-scroll-anchor={
                scrollAnchorRowId === rowId ? 'true' : undefined
              }
              className={cn(
                // shrink-0: scroll column is flex; default shrink would clip card content at the bottom.
                'shrink-0 gap-0 py-0 shadow-sm',
                rowClass
              )}
            >
              <CardContent className='flex flex-col gap-3 px-3 pt-3 pb-4'>
                {/* Title block: time + date read as one unit; looser gap only before addresses */}
                <div className='flex flex-col gap-0.5'>
                  {/* Row 1: time → greeting → name | status → menu */}
                  <div className='flex min-w-0 items-center justify-between gap-2'>
                    <div className='flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2'>
                      {valid ? (
                        <span className='flex shrink-0 items-center gap-1.5 text-sm font-semibold tabular-nums'>
                          <UrgencyIndicator
                            scheduledAt={trip.scheduled_at!}
                            status={trip.status}
                            variant='dot'
                          />
                          {format(scheduled!, 'HH:mm', { locale: de })}
                        </span>
                      ) : (
                        <span className='text-muted-foreground shrink-0 text-sm'>
                          Keine Zeit
                        </span>
                      )}
                      {trip.greeting_style ? (
                        <span className='text-muted-foreground shrink-0 text-sm'>
                          {trip.greeting_style}
                        </span>
                      ) : null}
                      <p className='min-w-0 truncate text-sm font-medium'>
                        {trip.client_name || '—'}
                      </p>
                    </div>
                    <div className='flex shrink-0 items-center gap-1'>
                      <Badge
                        className={cn(
                          'max-w-[7rem] truncate text-xs sm:max-w-none',
                          tripStatusBadge({ status })
                        )}
                      >
                        {tripStatusLabels[status] ?? status}
                      </Badge>
                      <CellAction data={trip} />
                    </div>
                  </div>
                  {/* Row 2: date + wheelchair (tight under row 1) */}
                  <div className='text-muted-foreground flex items-center gap-2 text-xs leading-tight'>
                    {valid ? (
                      <span className='tabular-nums'>
                        {format(scheduled!, 'dd.MM.yyyy', { locale: de })}
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                    {trip.is_wheelchair && (
                      <Accessibility
                        className='text-foreground h-4 w-4 shrink-0'
                        aria-label='Rollstuhl'
                      />
                    )}
                  </div>
                </div>
                <div className='text-muted-foreground border-border/60 space-y-1.5 border-t pt-2.5 text-xs'>
                  <p className='break-words'>
                    <span className='text-foreground font-medium'>Ab: </span>
                    {pickup.street || trip.pickup_address || '—'}
                  </p>
                  <p className='break-words'>
                    <span className='text-foreground font-medium'>Nach: </span>
                    {dropoff.street || trip.dropoff_address || '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <DataTablePagination table={table} className='pb-1' />
    </div>
  );
}
