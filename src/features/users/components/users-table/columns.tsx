'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { User } from '@/constants/mock-api-users';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { ROLE_OPTIONS } from './options';

export const columns: ColumnDef<User>[] = [
  {
    id: 'name',
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>
          {row.original.first_name} {row.original.last_name}
        </span>
        <span className='text-muted-foreground text-xs'>
          {row.original.email}
        </span>
      </div>
    ),
    meta: {
      label: 'Name',
      placeholder: 'Search users...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'phone',
    header: 'PHONE'
  },
  {
    id: 'role',
    accessorKey: 'role',
    enableSorting: false,
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ cell }) => {
      return (
        <Badge variant='outline' className='capitalize'>
          {cell.getValue<User['role']>()}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'roles',
      variant: 'multiSelect' as const,
      options: ROLE_OPTIONS
    }
  },
  {
    accessorKey: 'status',
    header: 'STATUS',
    cell: ({ cell }) => {
      const status = cell.getValue<User['status']>();
      const variant =
        status === 'Active'
          ? 'default'
          : status === 'Inactive'
            ? 'secondary'
            : 'outline';
      return <Badge variant={variant}>{status}</Badge>;
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
