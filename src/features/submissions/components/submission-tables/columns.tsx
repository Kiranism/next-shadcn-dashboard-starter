'use client';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { TaskSubmission, SubmissionReviewStatus } from '@/types/submission';
import { Column, ColumnDef } from '@tanstack/react-table';
import { User, Calendar, Text, Filter, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { REVIEW_STATUS_OPTIONS } from './options';
import { CellAction } from '@/features/submissions/components/submission-tables/cell-action';

const reviewStatusConfig = {
  pending: { label: 'Pending', variant: 'secondary' as const },
  approved: { label: 'Approved', variant: 'default' as const },
  rejected: { label: 'Rejected', variant: 'destructive' as const }
};

export const columns: ColumnDef<TaskSubmission>[] = [
  {
    id: 'taskTitle',
    accessorKey: 'task.title',
    header: ({ column }: { column: Column<TaskSubmission, unknown> }) => (
      <DataTableColumnHeader column={column} title='Task' />
    ),
    cell: ({ row }) => {
      const submission = row.original;
      return (
        <div className='space-y-1'>
          {submission.task?.projectName && (
            <div className='text-xs text-blue-600'>
              {submission.task.projectName}
            </div>
          )}
          <div className='text-sm font-medium'>
            {submission.task?.title || 'Unknown Task'}
          </div>
        </div>
      );
    },
    meta: {
      label: 'Task',
      placeholder: 'Search tasks...',
      variant: 'text',
      icon: Text
    },
    enableColumnFilter: true
  },
  {
    id: 'submissionContent',
    accessorKey: 'submissionContent',
    header: ({ column }: { column: Column<TaskSubmission, unknown> }) => (
      <DataTableColumnHeader column={column} title='Submission Content' />
    ),
    cell: ({ row }) => {
      const submission = row.original;
      return (
        <div className='max-w-md space-y-1'>
          <div className='line-clamp-2 text-sm'>
            {submission.submissionContent}
          </div>
        </div>
      );
    },
    meta: {
      label: 'Content',
      placeholder: 'Search submissions...',
      variant: 'text',
      icon: FileText
    },
    enableColumnFilter: true
  },
  {
    id: 'reviewStatus',
    accessorKey: 'reviewStatus',
    header: ({ column }: { column: Column<TaskSubmission, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<TaskSubmission['reviewStatus']>();
      return (
        <Badge variant={reviewStatusConfig[status].variant}>
          {reviewStatusConfig[status].label}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Review Status',
      variant: 'multiSelect',
      options: REVIEW_STATUS_OPTIONS,
      icon: Filter
    }
  },
  {
    id: 'submitter',
    accessorKey: 'profile.fullName',
    header: 'Submitter',
    cell: ({ row }) => {
      const submission = row.original;
      const profile = submission.profile;
      return (
        <div className='flex items-center space-x-2'>
          <Avatar className='h-6 w-6'>
            <AvatarImage src={profile?.avatarUrl || ''} />
            <AvatarFallback className='text-xs'>
              {profile?.fullName?.charAt(0) || submission.userId.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className='text-sm font-medium'>
              {profile?.fullName || submission.userId}
            </div>
            {profile?.role && (
              <div className='text-muted-foreground text-xs capitalize'>
                {profile.role}
              </div>
            )}
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: 'submittedAt',
    header: ({ column }: { column: Column<TaskSubmission, unknown> }) => (
      <DataTableColumnHeader column={column} title='Submitted' />
    ),
    cell: ({ cell }) => {
      const submittedAt = cell.getValue<TaskSubmission['submittedAt']>();
      return (
        <div className='flex items-center space-x-1'>
          <Calendar className='text-muted-foreground h-4 w-4' />
          <span className='text-sm'>
            {format(new Date(submittedAt), 'MMM dd, yyyy')}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: 'reviewedAt',
    header: 'Reviewed',
    cell: ({ cell }) => {
      const reviewedAt = cell.getValue<TaskSubmission['reviewedAt']>();
      return (
        <div className='text-sm'>
          {reviewedAt ? (
            <div className='flex items-center space-x-1'>
              <Clock className='text-muted-foreground h-4 w-4' />
              <span>{format(new Date(reviewedAt), 'MMM dd')}</span>
            </div>
          ) : (
            <span className='text-muted-foreground'>-</span>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'reviewedBy',
    header: 'Reviewer',
    cell: ({ cell }) => {
      const reviewedBy = cell.getValue<TaskSubmission['reviewedBy']>();
      return (
        <div className='text-sm'>
          {reviewedBy || (
            <span className='text-muted-foreground'>Unassigned</span>
          )}
        </div>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
