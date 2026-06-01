'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Icons } from '@/components/icons';
import { AttachmentUpload, type ManagedFile } from './attachment-upload';
import { uploadAttachments } from '../lib/upload-attachments';
import { ReembolsosRepository } from '@/repositories/reembolsos.repository';
import { createClient } from '@/utils/supabase/client';
import { useSession } from '@/components/providers/session-provider';
import { toUserMessage } from '@/lib/api-client';
import type { ReimbursementCategory } from '@/types/api';

const CATEGORIES: { value: ReimbursementCategory; label: string }[] = [
  { value: 'ingresso', label: 'Ingresso' },
  { value: 'alimentação', label: 'Alimentação' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'outro', label: 'Outro' }
];

function parseBRL(value: string): number {
  const digits = value.replace(/\D/g, '');
  return parseInt(digits || '0', 10);
}

function formatBRLInput(cents: number): string {
  if (cents === 0) return '';
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

interface ReembolsoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReembolsoFormDialog({ open, onOpenChange }: ReembolsoFormDialogProps) {
  const { session } = useSession();
  const createMutation = ReembolsosRepository.useCreate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amountCents, setAmountCents] = useState(0);
  const [amountDisplay, setAmountDisplay] = useState('');
  const [category, setCategory] = useState<ReimbursementCategory | ''>('');
  const [pixKey, setPixKey] = useState('');
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const hasUploadError = files.some((f) => f.status === 'error');
  const hasUploading = files.some((f) => f.status === 'uploading');
  const isSubmitting = createMutation.isPending || isUploading;
  const canSubmit =
    title.trim() &&
    description.trim() &&
    amountCents > 0 &&
    category &&
    pixKey.trim() &&
    !hasUploadError &&
    !hasUploading &&
    !isSubmitting;

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cents = parseBRL(e.target.value);
    setAmountCents(cents);
    setAmountDisplay(formatBRLInput(cents));
  }, []);

  function reset() {
    setTitle('');
    setDescription('');
    setAmountCents(0);
    setAmountDisplay('');
    setCategory('');
    setPixKey('');
    setFiles([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !category) return;

    const userId = session?.user?.id;
    if (!userId) {
      toast.error('Sessão inválida — faça login novamente.');
      return;
    }

    let attachments: { path: string; name: string }[] = [];

    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length > 0) {
      setIsUploading(true);
      setFiles((prev) =>
        prev.map((f) => (f.status === 'pending' ? { ...f, status: 'uploading' } : f))
      );
      try {
        const supabase = createClient();
        attachments = await uploadAttachments(
          pendingFiles.map((f) => f.file),
          userId,
          supabase
        );
        setFiles((prev) =>
          prev.map((f) => (f.status === 'uploading' ? { ...f, status: 'done' } : f))
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.status === 'uploading' ? { ...f, status: 'error', error: 'Falha no upload' } : f
          )
        );
        toast.error(err instanceof Error ? err.message : 'Falha ao enviar comprovantes.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    createMutation.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        amount_cents: amountCents,
        category,
        pix_key: pixKey.trim(),
        attachments
      },
      {
        onSuccess: () => {
          toast.success('Solicitação enviada com sucesso!');
          reset();
          onOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isSubmitting) {
          reset();
          onOpenChange(v);
        }
      }}
    >
      <DialogContent className='max-h-[90vh] w-[min(90vw,560px)] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Nova Solicitação de Reembolso</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-2'>
          <div className='space-y-1.5'>
            <Label htmlFor='reimb-title'>Título *</Label>
            <Input
              id='reimb-title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Ex.: Ingresso DevConf 2026'
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='reimb-desc'>Descrição *</Label>
            <Textarea
              id='reimb-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Descreva a despesa'
              rows={2}
              className='resize-none'
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='reimb-amount'>Valor *</Label>
              <div className='relative'>
                <span className='text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm'>
                  R$
                </span>
                <Input
                  id='reimb-amount'
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  placeholder='0,00'
                  className='pl-9'
                  inputMode='numeric'
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label>Categoria *</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ReimbursementCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Selecione' />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='reimb-pix'>Chave PIX *</Label>
            <Input
              id='reimb-pix'
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder='CPF, e-mail, telefone ou chave aleatória'
            />
          </div>

          <div className='space-y-1.5'>
            <Label>Comprovantes</Label>
            <AttachmentUpload files={files} onChange={setFiles} />
          </div>

          <div className='flex justify-end gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              disabled={isSubmitting}
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={!canSubmit}>
              {isSubmitting && <Icons.spinner className='mr-2 size-4 animate-spin' />}
              Enviar Solicitação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
