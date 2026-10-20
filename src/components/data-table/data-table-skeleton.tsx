import type * as React from 'react';

import { cn } from '@/lib/utils';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface DataTableSkeletonProps extends React.ComponentProps<'div'> {
  columnCount: number;
  rowCount?: number;
  filterCount?: number;
  cellWidths?: string[];
  withViewOptions?: boolean;
  withPagination?: boolean;
  shrinkZero?: boolean;
}

export function DataTableSkeleton({
  columnCount,
  rowCount = 10,
  filterCount = 0,
  cellWidths = ['auto'],
  withViewOptions = true,
  withPagination = true,
  shrinkZero = false,
  className,
  ...props
}: DataTableSkeletonProps) {
  const cozyCellWidths = Array.from(
    { length: columnCount },
    (_, index) => cellWidths[index % cellWidths.length] ?? 'auto'
  );

  return (
    <div
      data-slot='data-table-skeleton'
      role='status'
      className={cn('flex flex-1 flex-col space-y-4', className)}
      {...props}
    >
      <span className='sr-only'>Loading table…</span>
      <div
        aria-hidden='true'
        className='flex w-full items-center justify-between gap-2 overflow-auto p-1'
      >
        <div className='flex flex-1 items-center gap-2'>
          {filterCount > 0
            ? Array.from({ length: filterCount }).map((_, i) => (
                <Skeleton key={i} className='h-8 w-18 rounded-lg border-dashed' />
              ))
            : null}
        </div>
        {withViewOptions ? (
          <Skeleton className='ms-auto hidden h-8 w-18 rounded-lg lg:flex' />
        ) : null}
      </div>
      <div aria-hidden='true' className='flex-1 rounded-lg border'>
        <Table>
          <TableHeader>
            {Array.from({ length: 1 }).map((_, i) => (
              <TableRow key={i} className='hover:bg-transparent'>
                {Array.from({ length: columnCount }).map((_, j) => (
                  <TableHead
                    key={j}
                    style={{
                      width: cozyCellWidths[j],
                      minWidth: shrinkZero ? cozyCellWidths[j] : 'auto'
                    }}
                  >
                    <Skeleton className='h-6 w-full' />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, i) => (
              <TableRow key={i} className='hover:bg-transparent'>
                {Array.from({ length: columnCount }).map((_, j) => (
                  <TableCell
                    key={j}
                    style={{
                      width: cozyCellWidths[j],
                      minWidth: shrinkZero ? cozyCellWidths[j] : 'auto'
                    }}
                  >
                    <Skeleton className='h-6 w-full' />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {withPagination ? (
        <div
          aria-hidden='true'
          className='flex w-full items-center justify-between gap-4 overflow-auto p-1 sm:gap-8'
        >
          <Skeleton className='h-8 w-40 shrink-0 rounded-lg' />
          <div className='flex items-center gap-4 sm:gap-6 lg:gap-8'>
            <div className='flex items-center gap-2'>
              <Skeleton className='h-8 w-24 rounded-lg' />
              <Skeleton className='h-8 w-18 rounded-lg' />
            </div>
            <div className='flex items-center justify-center text-sm font-medium'>
              <Skeleton className='h-8 w-20 rounded-lg' />
            </div>
            <div className='flex items-center gap-2'>
              <Skeleton className='hidden size-8 rounded-lg lg:block' />
              <Skeleton className='size-8 rounded-lg' />
              <Skeleton className='size-8 rounded-lg' />
              <Skeleton className='hidden size-8 rounded-lg lg:block' />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
