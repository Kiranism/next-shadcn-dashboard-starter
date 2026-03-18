'use client';

/**
 * TanStack Table column definitions for the drivers listing.
 * Used by DriverTable in table view at /dashboard/drivers.
 */

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { DriverWithProfile } from '@/features/driver-management/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

function getDisplayName(d: DriverWithProfile): string {
  const u = d as { first_name?: string | null; last_name?: string | null };
  if (u?.first_name || u?.last_name) {
    return [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  }
  return d.name;
}

export const columns: ColumnDef<DriverWithProfile>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    accessorFn: getDisplayName,
    header: ({ column }: { column: Column<DriverWithProfile, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => (
      <div className='font-medium'>{getDisplayName(row.original)}</div>
    ),
    meta: { label: 'Name' },
    enableColumnFilter: true
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: ({ column }: { column: Column<DriverWithProfile, unknown> }) => (
      <DataTableColumnHeader column={column} title='E-Mail' />
    ),
    cell: ({ row }) => (
      <div className='text-muted-foreground text-sm'>
        {(row.original as { email?: string | null }).email ?? '-'}
      </div>
    ),
    meta: { label: 'E-Mail' },
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
