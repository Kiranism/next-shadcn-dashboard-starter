'use client';

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Accessibility, RepeatIcon } from 'lucide-react';
import { DriverSelectCell } from './driver-select-cell';

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
    id: 'scheduled_at',
    accessorKey: 'scheduled_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Datum' />
    ),
    cell: ({ cell }) => {
      const raw = cell.getValue<string>();
      if (raw == null || raw === '')
        return <span className='text-muted-foreground'>—</span>;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime()) || date.getTime() <= 0) {
        return <span className='text-muted-foreground'>—</span>;
      }
      return (
        <span className='font-medium'>
          {format(date, 'dd.MM.yyyy', { locale: de })}
        </span>
      );
    },
    meta: {
      label: 'Datum',
      variant: 'date'
    },
    enableColumnFilter: false
  },
  {
    id: 'time',
    accessorKey: 'scheduled_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Zeit' />
    ),
    cell: ({ cell, row }) => {
      const raw = cell.getValue<string>();
      if (raw == null || raw === '')
        return <span className='text-muted-foreground'>—</span>;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime()) || date.getTime() <= 0) {
        return <span className='text-muted-foreground'>—</span>;
      }
      const isRecurring = !!row.original.rule_id;

      const today = new Date();
      const isSameDay =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();
      const diffMinutes =
        Math.abs(date.getTime() - today.getTime()) / (1000 * 60);
      const isNowWindow = isSameDay && diffMinutes <= 30;

      return (
        <div className='flex items-center gap-2'>
          <span className='font-medium'>{format(date, 'HH:mm')}</span>
          {isRecurring && <RepeatIcon className='h-3 w-3 text-blue-500' />}
          {isNowWindow && (
            <span
              className='h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]'
              aria-label='Aktuelle Fahrt'
            />
          )}
        </div>
      );
    },
    meta: {
      label: 'Zeit',
      variant: 'text'
    },
    enableColumnFilter: false
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
    enableColumnFilter: false
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
    id: 'driver_id',
    accessorKey: 'driver.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Fahrer' />
    ),
    cell: ({ row }) => <DriverSelectCell trip={row.original} />,
    enableColumnFilter: false
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
    enableColumnFilter: false
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
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
