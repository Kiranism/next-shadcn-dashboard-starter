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
import { Input } from '@/components/ui/input';
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
import { toUserMessage } from '@/lib/api-client';
import type { Norm, NormSeverity } from '@/types/norms';

const SEVERITY_OPTIONS: { value: NormSeverity; label: string }[] = [
  { value: 'leve', label: 'Leve' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'grave', label: 'Grave' },
  { value: 'desligamento', label: 'Desligamento' }
];

interface NormFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  norm?: Norm;
}

export function NormFormDialog({ open, onOpenChange, norm }: NormFormDialogProps) {
  const isEdit = !!norm;
  const createMutation = NormsRepository.useCreate();
  const updateMutation = NormsRepository.useUpdate();

  const [code, setCode] = useState(norm?.code ?? '');
  const [description, setDescription] = useState(norm?.description ?? '');
  const [severity, setSeverity] = useState<NormSeverity>(norm?.severity ?? 'leve');
  const [errors, setErrors] = useState<{ code?: string; description?: string }>({});

  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setCode(norm?.code ?? '');
      setDescription(norm?.description ?? '');
      setSeverity(norm?.severity ?? 'leve');
      setErrors({});
    }
  }, [open, norm?.id]);

  function validate() {
    const e: typeof errors = {};
    if (!isEdit && !code.trim()) e.code = 'Código é obrigatório.';
    if (!description.trim()) e.description = 'Descrição é obrigatória.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleOpenChange(v: boolean) {
    if (!isPending) onOpenChange(v);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit) {
      updateMutation.mutate(
        { id: norm.id, payload: { description: description.trim(), severity } },
        {
          onSuccess: () => {
            toast.success('Norma atualizada.');
            onOpenChange(false);
          },
          onError: (err) => toast.error(toUserMessage(err))
        }
      );
    } else {
      createMutation.mutate(
        { code: code.trim().toUpperCase(), description: description.trim(), severity },
        {
          onSuccess: () => {
            toast.success('Norma criada.');
            onOpenChange(false);
          },
          onError: (err) => toast.error(toUserMessage(err))
        }
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='w-[min(90vw,480px)]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Norma' : 'Nova Norma'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
          <div className='space-y-1.5'>
            <Label htmlFor='norm-code'>Código *</Label>
            {isEdit ? (
              <p className='text-muted-foreground font-mono text-sm'>{norm.code}</p>
            ) : (
              <>
                <Input
                  id='norm-code'
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder='Ex.: AN32'
                  disabled={isPending}
                  aria-invalid={!!errors.code}
                />
                {errors.code && <p className='text-destructive text-xs'>{errors.code}</p>}
              </>
            )}
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='norm-severity'>Severidade *</Label>
            <Select
              value={severity}
              onValueChange={(v) => setSeverity(v as NormSeverity)}
              disabled={isPending}
            >
              <SelectTrigger id='norm-severity'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='norm-desc'>Descrição *</Label>
            <Textarea
              id='norm-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Descreva a norma'
              rows={3}
              className='resize-none'
              disabled={isPending}
              aria-invalid={!!errors.description}
            />
            {errors.description && <p className='text-destructive text-xs'>{errors.description}</p>}
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
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
