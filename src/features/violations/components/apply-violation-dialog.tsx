'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { NormsRepository } from '@/repositories/norms.repository';
import { ViolationsRepository } from '@/repositories/violations.repository';
import { toUserMessage } from '@/lib/api-client';
import type { UserViolations } from '@/types/violations';
import type { NormSeverity } from '@/types/norms';

const severityCodeColor: Record<NormSeverity, string> = {
  leve: 'text-emerald-600 dark:text-emerald-400',
  moderada: 'text-yellow-600 dark:text-yellow-400',
  grave: 'text-orange-600 dark:text-orange-400',
  desligamento: 'text-red-600 dark:text-red-400'
};

interface ApplyViolationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: UserViolations[];
  userNames: Record<string, { name: string; role: string; sector: string }>;
}

export function ApplyViolationDialog({
  open,
  onOpenChange,
  members,
  userNames
}: ApplyViolationDialogProps) {
  const createMutation = ViolationsRepository.useCreate();
  const { data: norms = [] } = NormsRepository.useList();

  const [userId, setUserId] = useState('');
  const [normId, setNormId] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ userId?: string; normId?: string }>({});

  const isPending = createMutation.isPending;

  useEffect(() => {
    if (open) {
      setUserId('');
      setNormId('');
      setReason('');
      setErrors({});
    }
  }, [open]);

  function validate() {
    const e: typeof errors = {};
    if (!userId) e.userId = 'Selecione um membro.';
    if (!normId) e.normId = 'Selecione uma norma.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleOpenChange(v: boolean) {
    if (!isPending) onOpenChange(v);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate(
      { user_id: userId, norm_id: normId, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Falta aplicada com sucesso.');
          onOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='w-[min(90vw,480px)]'>
        <DialogHeader>
          <DialogTitle>Aplicar Falta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
          <div className='space-y-1.5'>
            <Label htmlFor='av-member'>Membro *</Label>
            <Select value={userId} onValueChange={setUserId} disabled={isPending}>
              <SelectTrigger id='av-member' aria-invalid={!!errors.userId}>
                <SelectValue placeholder='Selecionar membro' />
              </SelectTrigger>
              <SelectContent>
                {[...members]
                  .sort((a, b) => {
                    const nameA = userNames[a.user_id]?.name ?? '';
                    const nameB = userNames[b.user_id]?.name ?? '';
                    return nameA.localeCompare(nameB, 'pt-BR');
                  })
                  .map((entry) => {
                    const info = userNames[entry.user_id];
                    return (
                      <SelectItem key={entry.user_id} value={entry.user_id}>
                        {info?.name ?? entry.user_id}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
            {errors.userId && <p className='text-destructive text-xs'>{errors.userId}</p>}
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='av-norm'>Norma *</Label>
            <Select value={normId} onValueChange={setNormId} disabled={isPending}>
              <SelectTrigger id='av-norm' aria-invalid={!!errors.normId}>
                <SelectValue placeholder='Selecionar norma' />
              </SelectTrigger>
              <SelectContent>
                {norms.map((norm) => (
                  <SelectItem key={norm.id} value={norm.id}>
                    <span
                      className={`font-mono text-xs font-semibold mr-1 ${severityCodeColor[norm.severity]}`}
                    >
                      {norm.code}
                    </span>
                    {norm.description.length > 50
                      ? norm.description.slice(0, 50) + '…'
                      : norm.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.normId && <p className='text-destructive text-xs'>{errors.normId}</p>}
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='av-reason'>
              Motivo <span className='text-muted-foreground font-normal'>(opcional)</span>
            </Label>
            <Textarea
              id='av-reason'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Descreva o motivo da infração...'
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
            <Button type='submit' disabled={isPending} isLoading={isPending}>
              Aplicar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
