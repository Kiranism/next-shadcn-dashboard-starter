'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Icons } from '@/components/icons';
import { GamificationRepository } from '@/repositories/gamification.repository';
import { toUserMessage } from '@/lib/api-client';
import type { GamificationTask } from '@/types/gamification';

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: GamificationTask;
}

export function TaskFormDialog({ open, onOpenChange, task }: TaskFormDialogProps) {
  const isEdit = !!task;
  const createMutation = GamificationRepository.useCreateTask();
  const updateMutation = GamificationRepository.useUpdateTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '');
      setDescription(task?.description ?? '');
      setPoints(task ? String(task.points) : '');
      setIsActive(task?.is_active ?? true);
    }
  }, [open, task]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const pointsNum = parseInt(points, 10);
  const canSubmit = title.trim() && points && !isNaN(pointsNum) && pointsNum > 0 && !isSubmitting;

  function handleClose() {
    if (!isSubmitting) onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    if (isEdit && task) {
      updateMutation.mutate(
        {
          id: task.id,
          payload: {
            title: title.trim(),
            description: description.trim() || undefined,
            points: pointsNum,
            is_active: isActive
          }
        },
        {
          onSuccess: () => {
            toast.success('Tarefa atualizada!');
            onOpenChange(false);
          },
          onError: (err) => toast.error(toUserMessage(err))
        }
      );
    } else {
      createMutation.mutate(
        {
          title: title.trim(),
          description: description.trim() || undefined,
          points: pointsNum
        },
        {
          onSuccess: () => {
            toast.success('Tarefa criada!');
            onOpenChange(false);
          },
          onError: (err) => toast.error(toUserMessage(err))
        }
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='w-[min(90vw,480px)]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
          <div className='space-y-1.5'>
            <Label htmlFor='task-title'>Título *</Label>
            <Input
              id='task-title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Nome da tarefa'
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='task-desc'>Descrição</Label>
            <Textarea
              id='task-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Explique o que o membro deve fazer'
              rows={2}
              className='resize-none'
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='task-pts'>Pontos *</Label>
            <Input
              id='task-pts'
              value={points}
              onChange={(e) => setPoints(e.target.value.replace(/\D/g, ''))}
              placeholder='Ex.: 50'
              inputMode='numeric'
              className='w-32'
            />
          </div>

          {isEdit && (
            <div className='flex items-center gap-3'>
              <Switch id='task-active' checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor='task-active'>Tarefa ativa</Label>
            </div>
          )}

          <div className='flex justify-end gap-2 pt-1'>
            <Button type='button' variant='outline' disabled={isSubmitting} onClick={handleClose}>
              Cancelar
            </Button>
            <Button type='submit' disabled={!canSubmit}>
              {isSubmitting && <Icons.spinner className='mr-2 size-4 animate-spin' />}
              {isEdit ? 'Salvar' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
