'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { PortfolioRepository } from '@/repositories/portfolio.repository';
import { toUserMessage } from '@/lib/api-client';
import type { PortfolioItem } from '@/types/api';

interface PortfolioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: PortfolioItem;
}

export function PortfolioFormDialog({ open, onOpenChange, item }: PortfolioFormDialogProps) {
  const isEdit = !!item;
  const createMutation = PortfolioRepository.useCreate();
  const updateMutation = PortfolioRepository.useUpdate();

  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');

  const isPending = createMutation.isPending || updateMutation.isPending;
  const canSubmit = name.trim().length > 0 && !isPending;

  function reset() {
    setName(item?.name ?? '');
    setDescription(item?.description ?? '');
  }

  function handleOpenChange(v: boolean) {
    if (!isPending) {
      reset();
      onOpenChange(v);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = { name: name.trim(), description: description.trim() || undefined };

    if (isEdit) {
      updateMutation.mutate(
        { id: item.id, payload },
        {
          onSuccess: () => {
            toast.success('Serviço atualizado.');
            onOpenChange(false);
          },
          onError: (err) => toast.error(toUserMessage(err))
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Serviço criado.');
          reset();
          onOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='w-[min(90vw,480px)]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
          <div className='space-y-1.5'>
            <Label htmlFor='portfolio-name'>Nome *</Label>
            <Input
              id='portfolio-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ex.: Consultoria Energética'
              disabled={isPending}
            />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='portfolio-desc'>Descrição</Label>
            <Textarea
              id='portfolio-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Descreva brevemente o serviço'
              rows={3}
              className='resize-none'
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={!canSubmit} isLoading={isPending}>
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
