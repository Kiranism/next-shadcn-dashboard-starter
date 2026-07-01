'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Icons } from '@/components/icons';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { SubmissionFormDialog } from './submission-form-dialog';
import { TaskFormDialog } from './task-form-dialog';
import type { GamificationTask } from '@/types/gamification';

interface TaskCardProps {
  task: GamificationTask;
  hasHouse: boolean;
  hasActiveCycle: boolean;
}

export function TaskCard({ task, hasHouse, hasActiveCycle }: TaskCardProps) {
  const { rank } = useUserProfile();
  const isAdmin = rank >= 3;
  const [submitOpen, setSubmitOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const canSubmit = hasHouse && hasActiveCycle && task.is_active;
  const submitDisabledReason = !hasHouse
    ? 'Você precisa estar em uma casa para submeter.'
    : !hasActiveCycle
      ? 'Nenhum ciclo está ativo no momento.'
      : !task.is_active
        ? 'Esta tarefa está inativa.'
        : '';

  return (
    <>
      <Card className='flex flex-col'>
        <CardHeader className='pb-2 pt-4'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='font-semibold leading-tight'>{task.title}</h3>
              {!task.is_active && (
                <Badge variant='secondary' className='text-xs'>
                  Inativa
                </Badge>
              )}
            </div>
            <Badge className='shrink-0 tabular-nums'>{task.points} pts</Badge>
          </div>
        </CardHeader>

        <CardContent className='flex flex-1 flex-col justify-between gap-3 pb-4'>
          {task.description && <p className='text-muted-foreground text-sm'>{task.description}</p>}

          <div className='flex items-center justify-end gap-2'>
            {isAdmin && (
              <Button
                variant='ghost'
                size='sm'
                className='h-8 text-xs'
                onClick={() => setEditOpen(true)}
              >
                <Icons.userPen className='mr-1.5 size-3.5' />
                Editar
              </Button>
            )}

            {canSubmit ? (
              <Button size='sm' className='h-8 text-xs' onClick={() => setSubmitOpen(true)}>
                <Icons.send className='mr-1.5 size-3.5' />
                Submeter
              </Button>
            ) : (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button size='sm' className='h-8 text-xs' disabled>
                        <Icons.send className='mr-1.5 size-3.5' />
                        Submeter
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side='top'>
                    <p>{submitDisabledReason}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardContent>
      </Card>

      <SubmissionFormDialog open={submitOpen} onOpenChange={setSubmitOpen} task={task} />
      {isAdmin && <TaskFormDialog open={editOpen} onOpenChange={setEditOpen} task={task} />}
    </>
  );
}
