'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Ticket, TicketStatus, TicketPriority } from '@/types/ticket';
import { Column, ColumnDef } from '@tanstack/react-table';
import { User, Calendar, Text, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { CellAction } from './cell-action';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, CATEGORY_OPTIONS } from './options';

const statusConfig = {
  open: { label: 'Open', variant: 'destructive' as const },
  in_progress: { label: 'In Progress', variant: 'default' as const },
  resolved: { label: 'Resolved', variant: 'default' as const },
  closed: { label: 'Closed', variant: 'secondary' as const }
};

const priorityConfig = {
  low: { label: 'Low', variant: 'secondary' as const },
  medium: { label: 'Medium', variant: 'default' as const },
  high: { label: 'High', variant: 'destructive' as const },
  urgent: { label: 'Urgent', variant: 'destructive' as const }
};

export const columns: ColumnDef<Ticket>[] = [
  {
    id: 'subject',
    accessorKey: 'subject',
    header: ({ column }: { column: Column<Ticket, unknown> }) => (
      <DataTableColumnHeader column={column} title='Subject' />
    ),
    cell: ({ row }) => {
      const ticket = row.original;
      return (
        <div className='space-y-1'>
          <div className='font-medium'>{ticket.subject || ticket.title}</div>
          <div className='text-muted-foreground line-clamp-2 text-sm'>
            {ticket.content}
          </div>
          {ticket.tags && ticket.tags.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              {ticket.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant='outline' className='text-xs'>
                  {tag}
                </Badge>
              ))}
              {ticket.tags.length > 2 && (
                <Badge variant='outline' className='text-xs'>
                  +{ticket.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      );
    },
    meta: {
      label: 'Subject',
      placeholder: 'Search tickets...',
      variant: 'text',
      icon: Text
    },
    enableColumnFilter: true
  },
  {
    id: 'category',
    accessorKey: 'category',
    header: ({ column }: { column: Column<Ticket, unknown> }) => (
      <DataTableColumnHeader column={column} title='Category' />
    ),
    cell: ({ row }) => {
      const ticket = row.original;
      return (
        <div className='space-y-1'>
          {ticket.category && (
            <Badge variant='outline' className='text-xs'>
              {ticket.category}
            </Badge>
          )}
        </div>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Category',
      variant: 'multiSelect',
      options: CATEGORY_OPTIONS,
      icon: Filter
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }: { column: Column<Ticket, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<Ticket['status']>();
      return (
        <Badge variant={statusConfig[status].variant}>
          {statusConfig[status].label}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect',
      options: STATUS_OPTIONS,
      icon: Filter
    }
  },
  {
    id: 'priority',
    accessorKey: 'priority',
    header: ({ column }: { column: Column<Ticket, unknown> }) => (
      <DataTableColumnHeader column={column} title='Priority' />
    ),
    cell: ({ cell }) => {
      const priority = cell.getValue<Ticket['priority']>();
      return (
        <Badge variant={priorityConfig[priority].variant}>
          {priorityConfig[priority].label}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Priority',
      variant: 'multiSelect',
      options: PRIORITY_OPTIONS,
      icon: Filter
    }
  },
  {
    accessorKey: 'submitterId',
    header: 'Submitter',
    cell: ({ row }) => {
      const ticket = row.original;
      return (
        <div className='space-y-1'>
          <div className='flex items-center space-x-1'>
            <User className='text-muted-foreground h-4 w-4' />
            <span className='text-sm font-medium'>
              {ticket.nickname || ticket.submitterId}
            </span>
          </div>
          {ticket.email && (
            <div className='text-muted-foreground text-xs'>{ticket.email}</div>
          )}
          {ticket.walletAddress && (
            <div className='text-muted-foreground font-mono text-xs'>
              {ticket.walletAddress.slice(0, 6)}...
              {ticket.walletAddress.slice(-4)}
            </div>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'assignedTo',
    header: 'Assigned To',
    cell: ({ cell }) => {
      const assignedTo = cell.getValue<Ticket['assignedTo']>();
      return <span className='text-sm'>{assignedTo || 'Unassigned'}</span>;
    }
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<Ticket, unknown> }) => (
      <DataTableColumnHeader column={column} title='Created' />
    ),
    cell: ({ cell }) => {
      const createdAt = cell.getValue<Ticket['createdAt']>();
      return (
        <div className='flex items-center space-x-1'>
          <Calendar className='text-muted-foreground h-4 w-4' />
          <span className='text-sm'>
            {format(new Date(createdAt), 'MMM dd, yyyy')}
          </span>
        </div>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
