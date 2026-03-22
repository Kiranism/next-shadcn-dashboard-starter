import type { Table } from '@tanstack/react-table';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';

interface DataTablePaginationProps<TData> extends React.ComponentProps<'div'> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;

  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-x-auto p-1 sm:gap-4',
        className
      )}
      {...props}
    >
      {/* Row counter — hidden on small viewports (Fahrten list / table on phone) */}
      <div className='text-muted-foreground hidden shrink-0 text-xs whitespace-nowrap sm:text-sm md:block'>
        {table.getFilteredSelectedRowModel().rows.length > 0 ? (
          <>
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </>
        ) : (
          <>{table.getFilteredRowModel().rows.length} row(s) total.</>
        )}
      </div>

      {/*
        Mobile: flex-row-reverse + justify-between → page + arrows on the left,
        rows per page on the right. md+: normal row, end-aligned (rows, page, nav).
      */}
      <div
        className={cn(
          'flex min-w-0 flex-1 items-center justify-between gap-2',
          'flex-row-reverse md:flex-row md:justify-end md:gap-6'
        )}
      >
        <div className='flex shrink-0 items-center gap-1.5 sm:gap-2'>
          <p className='text-xs font-medium whitespace-nowrap sm:text-sm md:inline'>
            <span className='hidden sm:inline'>Rows per page</span>
            <span className='sm:hidden' aria-hidden>
              Rows
            </span>
          </p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className='h-8 w-[4.5rem] [&[data-size]]:h-8'>
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {pageSizeOptions.map((pageSizeOption) => (
                <SelectItem key={pageSizeOption} value={`${pageSizeOption}`}>
                  {pageSizeOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex min-w-0 items-center gap-1 sm:gap-2'>
          <p className='text-xs font-medium whitespace-nowrap sm:text-sm'>
            Page {pageIndex + 1} of {table.getPageCount()}
          </p>
          <div className='flex shrink-0 items-center gap-1'>
            <Button
              aria-label='Go to first page'
              variant='outline'
              size='icon'
              className='hidden size-8 lg:flex'
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft />
            </Button>
            <Button
              aria-label='Go to previous page'
              variant='outline'
              size='icon'
              className='size-8'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              aria-label='Go to next page'
              variant='outline'
              size='icon'
              className='size-8'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon />
            </Button>
            <Button
              aria-label='Go to last page'
              variant='outline'
              size='icon'
              className='hidden size-8 lg:flex'
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
