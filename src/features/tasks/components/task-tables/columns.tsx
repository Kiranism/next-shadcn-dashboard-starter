'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Task, TaskStatus } from '@/types/task';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Calendar, DollarSign, Trophy, Text, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { CellAction } from './cell-action';
import { STATUS_OPTIONS } from './options';

const statusConfig = {
  [TaskStatus.DRAFT]: { label: 'Draft', variant: 'secondary' as const },
  [TaskStatus.PUBLISHED]: { label: 'Published', variant: 'default' as const },
  [TaskStatus.ACTIVE]: { label: 'Active', variant: 'default' as const },
  [TaskStatus.ENDED]: { label: 'Ended', variant: 'outline' as const },
  [TaskStatus.CANCELLED]: {
    label: 'Cancelled',
    variant: 'destructive' as const
  }
};

export const columns: ColumnDef<Task>[] = [
  {
    id: 'projectName',
    accessorKey: 'projectName',
    header: ({ column }: { column: Column<Task, unknown> }) => (
      <DataTableColumnHeader column={column} title='Project Name' />
    ),
    cell: ({ row }) => {
      const task = row.original;
      return (
        <div className='space-y-1'>
          {task.projectName && (
            <div className='text-xs text-blue-600'>{task.projectName}</div>
          )}
        </div>
      );
    },
    meta: {
      label: 'Project Name',
      placeholder: 'Search projects...',
      variant: 'text',
      icon: Text
    },
    enableColumnFilter: true
  },
  {
    id: 'title',
    accessorKey: 'title',
    header: ({ column }: { column: Column<Task, unknown> }) => (
      <DataTableColumnHeader column={column} title='Task Title' />
    ),
    cell: ({ row }) => {
      const task = row.original;
      return (
        <div className='space-y-1'>
          <div className='font-medium'>{task.title}</div>
          {/* <div className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </div> */}
        </div>
      );
    },
    meta: {
      label: 'Title',
      placeholder: 'Search tasks...',
      variant: 'text',
      icon: Text
    },
    enableColumnFilter: true
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }: { column: Column<Task, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<Task['status']>();
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
    accessorKey: 'deadline',
    header: ({ column }: { column: Column<Task, unknown> }) => (
      <DataTableColumnHeader column={column} title='Deadline' />
    ),
    cell: ({ cell }) => {
      const deadline = cell.getValue<Task['deadline']>();
      return (
        <div className='flex items-center space-x-1'>
          <Calendar className='text-muted-foreground h-4 w-4' />
          <span className='text-sm'>
            {format(new Date(deadline), 'MMM dd, yyyy')}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: 'totalRewardAmount',
    header: 'Reward',
    cell: ({ row }) => {
      const task = row.original;
      return (
        <div className='space-y-1'>
          <div className='flex items-center space-x-1'>
            <DollarSign className='h-4 w-4 text-green-600' />
            <span className='text-sm font-medium'>
              ${task.totalRewardAmount.toLocaleString()}
            </span>
          </div>
          <div className='flex items-center space-x-1'>
            <Trophy className='h-4 w-4 text-yellow-600' />
            <span className='text-muted-foreground text-xs'>
              {task.rewardExp} EXP
            </span>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: 'currentParticipants',
    header: 'Participants',
    cell: ({ row }) => {
      const task = row.original;
      return (
        <div className='text-sm'>
          {task.currentParticipants}
          {task.maxParticipants && `/${task.maxParticipants}`}
        </div>
      );
    }
  },
  {
    accessorKey: 'createdBy',
    header: 'Created By',
    cell: ({ cell }) => (
      <div className='text-sm'>{cell.getValue<Task['createdBy']>()}</div>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
