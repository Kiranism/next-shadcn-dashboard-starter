'use client';

/**
 * TanStack Table column definitions for the drivers listing.
 */

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { DriverWithProfile } from '@/features/drivers/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

export const columns: ColumnDef<DriverWithProfile>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<DriverWithProfile, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => <div className='font-medium'>{row.original.name}</div>,
    meta: { label: 'Name' },
    enableColumnFilter: true
  },
  {
    id: 'role',
    accessorKey: 'role',
    header: ({ column }: { column: Column<DriverWithProfile, unknown> }) => (
      <DataTableColumnHeader column={column} title='Rolle' />
    ),
    cell: ({ row }) => <span className='capitalize'>{row.original.role}</span>,
    meta: { label: 'Rolle' },
    enableColumnFilter: true
  },
  {
    id: 'phone',
    accessorKey: 'phone',
    header: ({ column }: { column: Column<DriverWithProfile, unknown> }) => (
      <DataTableColumnHeader column={column} title='Telefon' />
    ),
    cell: ({ row }) => <div>{row.original.phone ?? '-'}</div>,
    meta: { label: 'Telefon' }
  },
  {
    id: 'is_active',
    accessorKey: 'is_active',
    header: ({ column }: { column: Column<DriverWithProfile, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => (
      <span
        className={
          row.original.is_active
            ? 'text-green-600 dark:text-green-500'
            : 'text-muted-foreground'
        }
      >
        {row.original.is_active ? 'Aktiv' : 'Inaktiv'}
      </span>
    ),
    meta: { label: 'Status' }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
