'use client';

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Accessibility } from 'lucide-react';

const statusMap: Record<
  string,
  {
    label: string;
    variant: 'outline' | 'default' | 'secondary' | 'destructive';
  }
> = {
  pending: { label: 'Offen', variant: 'outline' },
  assigned: { label: 'Zugewiesen', variant: 'default' },
  in_progress: { label: 'In Fahrt', variant: 'secondary' },
  completed: { label: 'Abgeschlossen', variant: 'default' },
  cancelled: { label: 'Storniert', variant: 'destructive' }
};

export const columns: ColumnDef<any>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Alle auswählen'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Zeile auswählen'
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'scheduled_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Zeit' />
    ),
    cell: ({ cell }) => {
      const date = new Date(cell.getValue<string>());
      return (
        <div className='flex flex-col'>
          <span className='font-medium'>{format(date, 'HH:mm')}</span>
          <span className='text-muted-foreground text-[10px]'>
            {format(date, 'dd.MM.yyyy', { locale: de })}
          </span>
        </div>
      );
    },
    meta: {
      label: 'Zeitraum',
      variant: 'dateRange'
    },
    enableColumnFilter: true
  },
  {
    id: 'name',
    accessorKey: 'client_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Fahrgast' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <div className='flex flex-col'>
          <span className='font-medium'>{row.original.client_name || '-'}</span>
          {row.original.is_wheelchair && (
            <Badge
              variant='outline'
              className='w-fit origin-left scale-75 bg-black text-white hover:bg-black/90'
            >
              <Accessibility className='mr-1 h-3 w-3' />
              Rollstuhl
            </Badge>
          )}
        </div>
      </div>
    ),
    meta: {
      label: 'Fahrgast',
      variant: 'text'
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'pickup_address',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Abholung' />
    ),
    cell: ({ row }) => (
      <div className='flex max-w-[200px] flex-col truncate'>
        <span title={row.original.pickup_address}>
          {row.original.pickup_address}
        </span>
        {row.original.pickup_station && (
          <span className='text-muted-foreground truncate text-[10px] italic'>
            ({row.original.pickup_station})
          </span>
        )}
      </div>
    )
  },
  {
    accessorKey: 'dropoff_address',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Ziel' />
    ),
    cell: ({ row }) => (
      <div className='flex max-w-[200px] flex-col truncate'>
        <span title={row.original.dropoff_address}>
          {row.original.dropoff_address}
        </span>
        {row.original.dropoff_station && (
          <span className='text-muted-foreground truncate text-[10px] italic'>
            ({row.original.dropoff_station})
          </span>
        )}
      </div>
    )
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<string>();
      const config = statusMap[status] || { label: status, variant: 'outline' };
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
    meta: {
      label: 'Status',
      variant: 'select',
      options: Object.entries(statusMap).map(([value, { label }]) => ({
        label,
        value
      }))
    },
    enableColumnFilter: true
  },
  {
    id: 'payer_name',
    accessorKey: 'payer.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Kostenträger' />
    ),
    cell: ({ row }) => <div>{row.original.payer?.name || '-'}</div>
  },
  {
    id: 'billing_type',
    accessorKey: 'billing_type.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Abrechnung' />
    ),
    cell: ({ row }) => {
      const bt = row.original.billing_type;
      if (!bt) return '-';
      return (
        <Badge
          variant='outline'
          style={{
            borderColor: bt.color,
            color: bt.color,
            backgroundColor: `color-mix(in srgb, ${bt.color}, transparent 90%)`
          }}
        >
          {bt.name}
        </Badge>
      );
    }
  },
  {
    id: 'driver_name',
    accessorKey: 'driver.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Fahrer' />
    ),
    cell: ({ row }) => (
      <div>{row.original.driver?.name || 'Nicht zugewiesen'}</div>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
