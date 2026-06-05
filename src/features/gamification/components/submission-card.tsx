'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { GamificationSubmission, SubmissionStatus } from '@/types/gamification';

const STATUS_MAP: Record<SubmissionStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800'
  },
  approved: {
    label: 'Aprovada',
    className:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
  },
  rejected: {
    label: 'Rejeitada',
    className:
      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800'
  }
};

interface SubmissionCardProps {
  submission: GamificationSubmission;
  showUser?: boolean;
}

export function SubmissionCard({ submission, showUser = false }: SubmissionCardProps) {
  const status = STATUS_MAP[submission.status];
  const date = new Date(submission.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <Card>
      <CardContent className='p-4'>
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <div className='min-w-0 flex-1 space-y-1'>
            {showUser && submission.user_name && (
              <p className='text-muted-foreground text-xs font-medium'>{submission.user_name}</p>
            )}
            <p className='font-semibold leading-tight'>{submission.task_title ?? 'Tarefa'}</p>
            <p className='text-muted-foreground text-xs'>{date}</p>
          </div>

          <div className='flex shrink-0 items-center gap-2'>
            <Badge variant='outline' className={cn('text-xs font-medium', status.className)}>
              {status.label}
            </Badge>

            {submission.file_url && (
              <Button variant='ghost' size='icon' className='size-7' asChild>
                <a
                  href={submission.file_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  title='Ver comprovante'
                >
                  <Icons.externalLink className='size-3.5' />
                </a>
              </Button>
            )}
          </div>
        </div>

        {submission.description && (
          <p className='text-muted-foreground mt-2 text-sm line-clamp-2'>
            {submission.description}
          </p>
        )}

        {submission.status === 'rejected' && submission.rejection_reason && (
          <div className='mt-2 rounded-md bg-red-50 dark:bg-red-950/30 px-3 py-2'>
            <p className='text-xs font-medium text-red-700 dark:text-red-400'>
              Motivo da rejeição:
            </p>
            <p className='text-xs text-red-600 dark:text-red-300 mt-0.5'>
              {submission.rejection_reason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
