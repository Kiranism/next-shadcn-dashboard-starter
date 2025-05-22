'use client';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table as ShadCnTable, // Renamed to avoid conflict with Tanstack's Table type
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon
} from '@radix-ui/react-icons';
import {
  ColumnDef,
  flexRender,
  Table, // Tanstack Table type
  Row, // Import Row type
} from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import React from 'react'; // Import React for React.Fragment

interface DataTableProps<TData, TValue> {
  table: Table<TData>; // Expect a fully configured table instance
  columns: ColumnDef<TData, TValue>[]; // Still needed for colSpan in "No results"
  totalItems: number; // For displaying "Showing X to Y of Z entries"
  pageSizeOptions?: number[];
  renderSubComponent?: (row: Row<TData>) => React.ReactNode; // New prop
}

export function DataTable<TData, TValue>({
  table,
  columns,
  totalItems,
  pageSizeOptions = [10, 20, 30, 40, 50],
  renderSubComponent, // Destructure new prop
}: DataTableProps<TData, TValue>) {
  const paginationState = table.getState().pagination; // Get pagination state from the table instance

  // totalItems might differ from table.getRowCount() if data is paginated server-side
  // For client-side pagination (as hook is configured), table.getRowCount() is more accurate for "entries" based on filtered data
  const displayTotalItems = totalItems; // Or table.getRowCount() if only client-side filtering/pagination
  const currentTotalRowCount = table.getFilteredRowModel().rows.length; // Total rows after filtering, for "Showing X to Y of Z"

  return (
    <div className="space-y-4">
      <ScrollArea className="grid h-[calc(80vh-220px)] rounded-md border md:h-[calc(90dvh-240px)]">
        <ShadCnTable className="relative">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{width: header.getSize() !== 0 ? header.getSize() : undefined }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {renderSubComponent && row.getIsExpanded() && (
                    <TableRow>
                      {/* Ensure this TD spans all columns */}
                      <TableCell colSpan={row.getVisibleCells().length}>
                        {renderSubComponent(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length} // columns prop is still available
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </ShadCnTable>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="flex flex-col items-center justify-end gap-2 space-x-2 py-4 sm:flex-row">
        <div className="flex w-full items-center justify-between">
          <div className="flex-1 text-sm text-muted-foreground">
             {/* Display selected rows count */}
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <div>
                {table.getFilteredSelectedRowModel().rows.length} of{' '}
                {currentTotalRowCount} row(s) selected.
              </div>
            )}
             {/* Fallback to showing entries information if nothing is selected */}
            {table.getFilteredSelectedRowModel().rows.length === 0 &&
              (currentTotalRowCount > 0 ? (
                <>
                  Showing{' '}
                  {paginationState.pageIndex * paginationState.pageSize + 1} to{' '}
                  {Math.min(
                    (paginationState.pageIndex + 1) * paginationState.pageSize,
                    currentTotalRowCount // Use filtered row count here
                  )}{' '}
                  of {currentTotalRowCount} entries
                  {displayTotalItems !== currentTotalRowCount ? ` (filtered from ${displayTotalItems})` : ''}
                </>
              ) : (
                'No entries found'
              ))}
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
            <div className="flex items-center space-x-2">
              <p className="whitespace-nowrap text-sm font-medium">
                Rows per page
              </p>
              <Select
                value={`${paginationState.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={paginationState.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((size) => ( // Renamed pageSize to size to avoid conflict
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:justify-end">
          <div className="flex w-[150px] items-center justify-center text-sm font-medium">
            {table.getPageCount() > 0 ? (
              <>
                Page {paginationState.pageIndex + 1} of {table.getPageCount()}
              </>
            ) : (
              'Page 0 of 0' // Or "No pages"
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              aria-label="Go to first page"
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <DoubleArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to previous page"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to next page"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to last page"
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <DoubleArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
