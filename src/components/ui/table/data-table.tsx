import { type Table as TanstackTable, flexRender } from '@tanstack/react-table';
import * as React from 'react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';

import { DataTablePagination } from '@/components/ui/table/data-table-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { getCommonPinningStyles } from '@/lib/data-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DraggableTableHeader, DragAlongCell } from './draggable-column';

interface DataTableProps<TData> extends React.ComponentProps<'div'> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  getRowClassName?: (row: any) => string;
  /** Row id (from TanStack `row.id`) to auto-scroll into view after render. */
  scrollAnchorRowId?: string | null;
}

export function DataTable<TData>({
  table,
  actionBar,
  getRowClassName,
  scrollAnchorRowId,
  children
}: DataTableProps<TData>) {
  const dndId = React.useId();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const columnOrder = table.getState().columnOrder;
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      table.setColumnOrder(arrayMove(columnOrder, oldIndex, newIndex));
    }
  }

  // Scroll the anchor row into view whenever the anchor id or data changes.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollAnchorRowId, table.getRowModel().rows.length]);

  return (
    <div className='flex flex-1 flex-col space-y-4' ref={containerRef}>
      {children}
      <div className='relative flex flex-1'>
        <div className='absolute inset-0 flex overflow-hidden rounded-lg border'>
          <ScrollArea className='h-full w-full'>
            <DndContext
              id={dndId}
              collisionDetection={closestCenter}
              modifiers={[restrictToHorizontalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
            >
              <Table>
                <TableHeader className='bg-muted sticky top-0 z-10'>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      <SortableContext
                        items={table.getState().columnOrder}
                        strategy={horizontalListSortingStrategy}
                      >
                        {headerGroup.headers.map((header) => (
                          <DraggableTableHeader
                            key={header.id}
                            header={header}
                          />
                        ))}
                      </SortableContext>
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                        data-scroll-anchor={
                          scrollAnchorRowId === row.id ? 'true' : undefined
                        }
                        className={getRowClassName?.(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <SortableContext
                            key={cell.id}
                            items={table.getState().columnOrder}
                            strategy={horizontalListSortingStrategy}
                          >
                            <DragAlongCell key={cell.id} cell={cell} />
                          </SortableContext>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={table.getAllColumns().length}
                        className='h-24 text-center'
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
            <ScrollBar orientation='horizontal' />
          </ScrollArea>
        </div>
      </div>
      <div className='flex flex-col gap-2.5'>
        <DataTablePagination table={table} />
        {actionBar &&
          table.getFilteredSelectedRowModel().rows.length > 0 &&
          actionBar}
      </div>
    </div>
  );
}
