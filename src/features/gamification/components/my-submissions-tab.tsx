'use client';

import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { GamificationRepository } from '@/repositories/gamification.repository';
import { SubmissionCard } from './submission-card';

function SubmissionsSkeleton() {
  return (
    <div className='space-y-3'>
      {[1, 2, 3].map((i) => (
        <div key={i} className='rounded-xl border p-4 space-y-2'>
          <div className='flex items-start justify-between gap-2'>
            <div className='space-y-1.5'>
              <Skeleton className='h-4 w-40' />
              <Skeleton className='h-3 w-20' />
            </div>
            <Skeleton className='h-5 w-20' />
          </div>
          <Skeleton className='h-3 w-full' />
        </div>
      ))}
    </div>
  );
}

export function MySubmissionsTab() {
  const { data: submissions, isLoading } = GamificationRepository.useMySubmissions();

  if (isLoading) return <SubmissionsSkeleton />;

  if (!submissions?.length) {
    return (
      <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center'>
        <div className='flex size-14 items-center justify-center rounded-full bg-muted'>
          <Icons.send className='size-6 text-muted-foreground' />
        </div>
        <div>
          <p className='font-medium'>Nenhuma submissão ainda</p>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            Vá até a aba Tarefas e submeta seu primeiro comprovante.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {submissions.map((s) => (
        <SubmissionCard key={s.id} submission={s} />
      ))}
    </div>
  );
}
