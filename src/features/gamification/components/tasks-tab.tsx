'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { GamificationRepository } from '@/repositories/gamification.repository';
import { TaskCard } from './task-card';
import { TaskFormDialog } from './task-form-dialog';

function TasksSkeleton() {
  return (
    <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className='rounded-xl border p-4 space-y-3'>
          <div className='flex items-start justify-between gap-2'>
            <Skeleton className='h-4 w-40' />
            <Skeleton className='h-5 w-14' />
          </div>
          <Skeleton className='h-3 w-full' />
          <Skeleton className='h-3 w-3/4' />
          <div className='flex justify-end'>
            <Skeleton className='h-8 w-24' />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TasksTab() {
  const { rank, profile } = useUserProfile();
  const isAdmin = rank >= 3;
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  const { data: tasks, isLoading } = GamificationRepository.useTasks(isAdmin);
  const { data: activeCycle } = GamificationRepository.useActiveCycle();
  const hasActiveCycle = !!activeCycle;
  const hasHouse = !!(profile as { house_id?: string | null } | null)?.house_id;

  if (isLoading) return <TasksSkeleton />;

  const visibleTasks = isAdmin ? (tasks ?? []) : (tasks ?? []).filter((t) => t.is_active);

  return (
    <div className='space-y-4'>
      {isAdmin && (
        <div className='flex justify-end'>
          <Button size='sm' onClick={() => setNewTaskOpen(true)}>
            <Icons.add className='mr-1.5 size-4' />
            Nova Tarefa
          </Button>
        </div>
      )}

      {visibleTasks.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center'>
          <div className='flex size-14 items-center justify-center rounded-full bg-muted'>
            <Icons.forms className='size-6 text-muted-foreground' />
          </div>
          <div>
            <p className='font-medium'>Nenhuma tarefa disponível</p>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              {isAdmin
                ? 'Crie a primeira tarefa para os membros.'
                : 'Novas tarefas aparecerão aqui.'}
            </p>
          </div>
          {isAdmin && (
            <Button variant='outline' size='sm' onClick={() => setNewTaskOpen(true)}>
              <Icons.add className='mr-1.5 size-4' />
              Nova Tarefa
            </Button>
          )}
        </div>
      ) : (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              hasHouse={hasHouse}
              hasActiveCycle={hasActiveCycle}
            />
          ))}
        </div>
      )}

      {isAdmin && <TaskFormDialog open={newTaskOpen} onOpenChange={setNewTaskOpen} />}
    </div>
  );
}
