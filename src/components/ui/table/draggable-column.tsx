'use client';

import { CSSProperties } from 'react';
import { Header, Cell, flexRender } from '@tanstack/react-table';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableHead, TableCell } from '@/components/ui/table';

export function DraggableTableHeader<TData, TValue>({
  header
}: {
  header: Header<TData, TValue>;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({
      id: header.column.id
    });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition: 'width transform 0.2s ease-in-out',
    whiteSpace: 'nowrap',
    zIndex: isDragging ? 1 : 0,
    cursor: 'auto' // Handle cursor on the grip
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      colSpan={header.colSpan}
      className='group relative'
    >
      <div className='flex items-center gap-2'>
        {header.isPlaceholder
          ? null
          : flexRender(header.column.columnDef.header, header.getContext())}
        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          className='cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing'
        >
          ⠿
        </span>
      </div>
    </TableHead>
  );
}

export function DragAlongCell<TData, TValue>({
  cell
}: {
  cell: Cell<TData, TValue>;
}) {
  const { isDragging, setNodeRef, transform } = useSortable({
    id: cell.column.id
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition: 'width transform 0.2s ease-in-out',
    zIndex: isDragging ? 1 : 0
  };

  return (
    <TableCell ref={setNodeRef} style={style}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  );
}
