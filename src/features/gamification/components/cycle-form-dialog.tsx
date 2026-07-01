'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { GamificationRepository } from '@/repositories/gamification.repository';
import { toUserMessage } from '@/lib/api-client';

interface CycleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CycleFormDialog({ open, onOpenChange }: CycleFormDialogProps) {
  const createMutation = GamificationRepository.useCreateCycle();
  const [name, setName] = useState('');

  const isSubmitting = createMutation.isPending;
  const canSubmit = name.trim() && !isSubmitting;

  function handleClose() {
    if (!isSubmitting) {
      setName('');
      onOpenChange(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    createMutation.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          toast.success('Ciclo criado!');
          setName('');
          onOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='w-[min(90vw,420px)]'>
        <DialogHeader>
          <DialogTitle>Novo Ciclo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
          <div className='space-y-1.5'>
            <Label htmlFor='cycle-name'>Nome do ciclo *</Label>
            <Input
              id='cycle-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ex.: 1º Semestre 2026'
            />
          </div>
          <div className='flex justify-end gap-2 pt-1'>
            <Button type='button' variant='outline' disabled={isSubmitting} onClick={handleClose}>
              Cancelar
            </Button>
            <Button type='submit' disabled={!canSubmit}>
              {isSubmitting && <Icons.spinner className='mr-2 size-4 animate-spin' />}
              Criar Ciclo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
