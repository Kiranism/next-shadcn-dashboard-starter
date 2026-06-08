'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { SelectionProcessRepository } from '@/repositories/selection-process.repository';
import { toUserMessage } from '@/lib/api-client';
import type { SelectionProcess } from '@/types/selection-process';

interface ProcessFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  process?: SelectionProcess;
}

export function ProcessFormDialog({ open, onOpenChange, process }: ProcessFormDialogProps) {
  const isEdit = !!process;
  const createMutation = SelectionProcessRepository.useCreateProcess();
  const updateMutation = SelectionProcessRepository.useUpdateProcess();

  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [dateError, setDateError] = useState('');

  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setTitle(process?.title ?? '');
      setStartsAt(process ? process.starts_at.slice(0, 10) : '');
      setEndsAt(process ? process.ends_at.slice(0, 10) : '');
      setDateError('');
    }
  }, [open, process]);

  function validate(): boolean {
    if (!title.trim() || !startsAt || !endsAt) {
      setDateError('Preencha todos os campos obrigatórios.');
      return false;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setDateError('A data de término deve ser posterior à data de início.');
      return false;
    }
    setDateError('');
    return true;
  }

  function handleClose() {
    if (!isPending) onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: title.trim(),
      starts_at: new Date(`${startsAt}T00:00:00`).toISOString(),
      ends_at: new Date(`${endsAt}T23:59:59`).toISOString()
    };

    if (isEdit && process) {
      updateMutation.mutate(
        { processId: process.id, payload },
        {
          onSuccess: () => {
            toast.success('Processo atualizado!');
            onOpenChange(false);
          },
          onError: (err) => {
            const msg = toUserMessage(err);
            if (msg.toLowerCase().includes('conflita') || msg.toLowerCase().includes('overlap')) {
              setDateError('O período informado conflita com outro processo seletivo existente.');
            } else {
              toast.error(msg);
            }
          }
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Processo criado!');
          onOpenChange(false);
        },
        onError: (err) => {
          const msg = toUserMessage(err);
          if (msg.toLowerCase().includes('conflita') || msg.toLowerCase().includes('overlap')) {
            setDateError('O período informado conflita com outro processo seletivo existente.');
          } else {
            toast.error(msg);
          }
        }
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='w-[min(92vw,480px)]' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Processo' : 'Novo Processo Seletivo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
          <div className='space-y-1.5'>
            <Label htmlFor='ps-title'>Título *</Label>
            <Input
              id='ps-title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Ex.: Processo Seletivo 2026.2'
            />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='ps-starts'>Início *</Label>
              <Input
                id='ps-starts'
                type='date'
                value={startsAt}
                onChange={(e) => {
                  setStartsAt(e.target.value);
                  setDateError('');
                }}
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='ps-ends'>Término *</Label>
              <Input
                id='ps-ends'
                type='date'
                value={endsAt}
                onChange={(e) => {
                  setEndsAt(e.target.value);
                  setDateError('');
                }}
              />
            </div>
          </div>
          {dateError && <p className='text-destructive text-sm'>{dateError}</p>}
          <div className='flex justify-end gap-2 pt-1'>
            <Button type='button' variant='outline' disabled={isPending} onClick={handleClose}>
              Cancelar
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending && <Icons.spinner className='mr-2 size-4 animate-spin' />}
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
