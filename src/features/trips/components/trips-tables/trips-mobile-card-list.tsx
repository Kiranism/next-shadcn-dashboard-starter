'use client';

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
              className={cn('overflow-hidden py-0 shadow-sm', rowClass)}
            >
              <CardContent className='flex flex-col gap-2 p-3'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      {valid && (
                        <span className='flex items-center gap-1.5 text-sm font-semibold'>
                          <UrgencyIndicator
                            scheduledAt={trip.scheduled_at!}
                            status={trip.status}
                            variant='dot'
                          />
                          {format(scheduled!, 'HH:mm', { locale: de })}
                          <span className='text-muted-foreground font-normal'>
                            {format(scheduled!, 'dd.MM.', { locale: de })}
                          </span>
                        </span>
                      )}
                      {!valid && (
                        <span className='text-muted-foreground text-sm'>
                          Keine Zeit
                        </span>
                      )}
                      <Badge
                        className={cn('text-xs', tripStatusBadge({ status }))}
                      >
                        {tripStatusLabels[status] ?? status}
                      </Badge>
                    </div>
                    <p className='mt-1 truncate text-sm font-medium'>
                      {trip.client_name || '—'}
                    </p>
                    {trip.is_wheelchair && (
                      <Badge
                        variant='outline'
                        className='mt-1 w-fit scale-90 text-[10px]'
                      >
                        <Accessibility className='mr-1 h-3 w-3' />
                        Rollstuhl
                      </Badge>
                    )}
                  </div>
                  <CellAction data={trip} />
                </div>
                <div className='text-muted-foreground space-y-1 border-t pt-2 text-xs'>
                  <p className='line-clamp-2'>
                    <span className='text-foreground font-medium'>Ab: </span>
                    {pickup.street || trip.pickup_address || '—'}
                  </p>
                  <p className='line-clamp-2'>
                    <span className='text-foreground font-medium'>Nach: </span>
                    {dropoff.street || trip.dropoff_address || '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
