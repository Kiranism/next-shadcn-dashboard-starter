'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Icons } from '@/components/icons';
import { SelectionProcessRepository } from '@/repositories/selection-process.repository';
import { toUserMessage, ApiError } from '@/lib/api-client';
import type { Stage } from '@/types/selection-process';

interface StageFormDialogProps {
  processId: string;
  stage?: Stage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StageFormDialog({ processId, stage, open, onOpenChange }: StageFormDialogProps) {
  const isEdit = !!stage;

  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [shift, setShift] = useState(false);
  const [positionError, setPositionError] = useState('');

  useEffect(() => {
    if (open) {
      setName(stage?.name ?? '');
      setPosition(stage?.position?.toString() ?? '');
      setShift(false);
      setPositionError('');
    }
  }, [open, stage]);

  const createMutation = SelectionProcessRepository.useCreateStage();
  const updateMutation = SelectionProcessRepository.useUpdateStage(processId);

  function handleOpenChange(value: boolean) {
    onOpenChange(value);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPositionError('');

    const pos = parseInt(position, 10);
    if (!name.trim()) return;
    if (!position || isNaN(pos) || pos < 1) {
      setPositionError('Informe uma posição válida (número inteiro positivo).');
      return;
    }

    if (isEdit) {
      updateMutation.mutate(
        { stageId: stage.id, payload: { name: name.trim(), position: pos } },
        {
          onSuccess: () => {
            toast.success('Etapa atualizada!');
            handleOpenChange(false);
          },
          onError: (err) => toast.error(toUserMessage(err))
        }
      );
    } else {
      createMutation.mutate(
        {
          selection_process_id: processId,
          name: name.trim(),
          position: pos,
          ...(shift && { shift: true })
        },
        {
          onSuccess: () => {
            toast.success('Etapa criada com sucesso!');
            handleOpenChange(false);
          },
          onError: (err) => {
            if (err instanceof ApiError && err.status === 409) {
              setPositionError('Já existe uma etapa nessa posição para este processo.');
            } else {
              toast.error(toUserMessage(err));
            }
          }
        }
      );
    }
  }

  const isPending = isEdit ? updateMutation.isPending : createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby={undefined} className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar etapa' : 'Nova etapa'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='stage-name'>Nome da etapa</Label>
            <Input
              id='stage-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ex: Entrevista técnica'
              disabled={isPending}
              required
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='stage-position'>Posição</Label>
            <Input
              id='stage-position'
              type='number'
              min={1}
              step={1}
              value={position}
              onChange={(e) => {
                setPosition(e.target.value);
                setPositionError('');
              }}
              placeholder='Ex: 1'
              disabled={isPending}
              required
            />
            {positionError && (
              <p className='text-xs text-red-600 dark:text-red-400'>{positionError}</p>
            )}
          </div>

          {!isEdit && (
            <div className='flex items-center gap-2'>
              <Checkbox
                id='stage-shift'
                checked={shift}
                onCheckedChange={(v) => setShift(!!v)}
                disabled={isPending}
              />
              <Label htmlFor='stage-shift' className='text-sm font-normal cursor-pointer'>
                Deslocar etapas posteriores para abrir espaço
              </Label>
            </div>
          )}

          {isEdit && (
            <p className='text-xs text-muted-foreground'>
              Se a posição escolhida já existir, as duas etapas terão suas posições trocadas.
            </p>
          )}

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={isPending || !name.trim() || !position}>
              {isPending && <Icons.spinner className='mr-2 size-4 animate-spin' />}
              {isEdit ? 'Salvar' : 'Criar etapa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
