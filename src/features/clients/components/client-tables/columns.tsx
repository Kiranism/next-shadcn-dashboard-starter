'use client';

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Client } from '@/features/clients/api/clients.service';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { Checkbox } from '@/components/ui/checkbox';

export const columns: ColumnDef<Client>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    id: 'first_name',
    accessorKey: 'first_name',
    header: ({ column }: { column: Column<Client, unknown> }) => (
      <DataTableColumnHeader column={column} title='Vorname' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<string>() || '-'}</div>,
    meta: {
      label: 'Vorname'
    },
    enableColumnFilter: true
  },
  {
    id: 'last_name',
    accessorKey: 'last_name',
    header: ({ column }: { column: Column<Client, unknown> }) => (
      <DataTableColumnHeader column={column} title='Nachname' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<string>() || '-'}</div>,
    meta: {
      label: 'Nachname'
    },
    enableColumnFilter: true
  },
  {
    id: 'company_name',
    accessorKey: 'company_name',
    header: ({ column }: { column: Column<Client, unknown> }) => (
      <DataTableColumnHeader column={column} title='Firmenname' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<string>() || '-'}</div>,
    meta: {
      label: 'Firmenname'
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'street',
    header: ({ column }: { column: Column<Client, unknown> }) => (
      <DataTableColumnHeader column={column} title='Straße' />
    )
  },
  {
    accessorKey: 'street_number',
    header: ({ column }: { column: Column<Client, unknown> }) => (
      <DataTableColumnHeader column={column} title='Hausnummer' />
    )
  },
  {
    accessorKey: 'zip_code',
    header: ({ column }: { column: Column<Client, unknown> }) => (
      <DataTableColumnHeader column={column} title='PLZ' />
    )
  },
  {
    accessorKey: 'city',
    header: ({ column }: { column: Column<Client, unknown> }) => (
      <DataTableColumnHeader column={column} title='Stadt' />
    )
  },
  {
    accessorKey: 'phone',
    header: ({ column }: { column: Column<Client, unknown> }) => (
      <DataTableColumnHeader column={column} title='Telefonnummer' />
    )
  },
  {
    accessorKey: 'relation',
    header: ({ column }: { column: Column<Client, unknown> }) => (
      <DataTableColumnHeader column={column} title='Beziehung' />
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
