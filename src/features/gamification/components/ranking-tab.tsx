'use client';

import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { GamificationRepository } from '@/repositories/gamification.repository';
import { HouseCard } from './house-card';

function RankingSkeleton() {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {[1, 2, 3].map((i) => (
        <div key={i} className='rounded-xl border-2 border-muted p-5 space-y-4'>
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <Skeleton className='size-7 rounded' />
              <Skeleton className='h-5 w-24' />
            </div>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-10 w-28 mt-2' />
          </div>
          <div className='space-y-2 pt-1'>
            <Skeleton className='h-3 w-20' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RankingTab() {
  const { data: leaderboard, isLoading, error } = GamificationRepository.useLeaderboard();

  if (isLoading) return <RankingSkeleton />;

  if (error || !leaderboard?.length) {
    return (
      <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center'>
        <div className='flex size-14 items-center justify-center rounded-full bg-muted'>
          <Icons.exclusive className='size-6 text-muted-foreground' />
        </div>
        <div>
          <p className='font-medium'>Nenhum ciclo ativo</p>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            O ranking estará disponível quando um ciclo estiver em andamento.
          </p>
        </div>
      </div>
    );
  }

  // TEMP: offset manual de pontos históricos anteriores ao sistema
  const HOUSE_OFFSET: Record<string, number> = { lumina: 710, voltus: 650, nexus: 105 };
  const withOffset = leaderboard.map((entry) => ({
    ...entry,
    total_points: entry.total_points + (HOUSE_OFFSET[entry.house_name.toLowerCase()] ?? 0)
  }));

  const sorted = [...withOffset].sort((a, b) => b.total_points - a.total_points);

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {sorted.map((entry, idx) => (
        <HouseCard key={entry.house_id} entry={entry} place={Math.min(idx, 2) as 0 | 1 | 2} />
      ))}
    </div>
  );
}
