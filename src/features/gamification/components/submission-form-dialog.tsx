'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import {
  AttachmentUpload,
  type ManagedFile
} from '@/features/reembolsos/components/attachment-upload';
import { GamificationRepository } from '@/repositories/gamification.repository';
import { createClient } from '@/utils/supabase/client';
import { useSession } from '@/components/providers/session-provider';
import { toUserMessage } from '@/lib/api-client';
import type { GamificationTask } from '@/types/gamification';

const BUCKET = 'gamification-proofs';

function sanitize(name: string) {
  return name.replace(/\s+/g, '_').replace(/[^\w.\-]/g, '_');
}

interface SubmissionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: GamificationTask;
}

export function SubmissionFormDialog({ open, onOpenChange, task }: SubmissionFormDialogProps) {
  const { session } = useSession();
  const createMutation = GamificationRepository.useCreateSubmission();

  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const file = files[0] ?? null;
  const hasError = files.some((f) => f.status === 'error');
  const isUploading_ = files.some((f) => f.status === 'uploading');
  const isSubmitting = createMutation.isPending || isUploading;
  const canSubmit =
    description.trim() &&
    file &&
    file.status === 'pending' &&
    !hasError &&
    !isUploading_ &&
    !isSubmitting;

  // Limit to 1 file: replace existing when a new one is added
  function handleFilesChange(next: ManagedFile[]) {
    setFiles(next.slice(-1));
  }

  function reset() {
    setDescription('');
    setFiles([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !file) return;

    const userId = session?.user?.id;
    if (!userId) {
      toast.error('Sessão inválida — faça login novamente.');
      return;
    }

    // Mark uploading
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'uploading' as const })));
    setIsUploading(true);

    let filePath: string;
    try {
      const supabase = createClient();
      const folder = crypto.randomUUID();
      const safeName = sanitize(file.file.name);
      // Path starts with userId so the RLS policy (auth.uid() = first folder) is satisfied
      filePath = `${userId}/${folder}/${safeName}`;
      const { error } = await supabase.storage.from(BUCKET).upload(filePath, file.file);
      if (error) throw new Error(`Falha ao enviar arquivo: ${error.message}`);
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'done' as const })));
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'error' as const, error: 'Falha no upload' }))
      );
      toast.error(err instanceof Error ? err.message : 'Falha ao enviar arquivo.');
      setIsUploading(false);
      return;
    }
    setIsUploading(false);

    createMutation.mutate(
      { task_id: task.id, description: description.trim(), file_path: filePath },
      {
        onSuccess: () => {
          toast.success('Comprovante enviado! Aguarde a revisão.');
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
      <DialogContent className='w-[min(90vw,480px)]'>
        <DialogHeader>
          <DialogTitle>Submeter Comprovante</DialogTitle>
          <DialogDescription>
            Tarefa: <span className='font-medium text-foreground'>{task.title}</span> ·{' '}
            {task.points} pts
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
          <div className='space-y-1.5'>
            <Label htmlFor='sub-desc'>Descrição *</Label>
            <Textarea
              id='sub-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Descreva como você realizou a tarefa'
              rows={3}
              className='resize-none'
            />
          </div>

          <div className='space-y-1.5'>
            <Label>Comprovante *</Label>
            <AttachmentUpload files={files} onChange={handleFilesChange} />
          </div>

          <div className='flex justify-end gap-2 pt-1'>
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
              {isUploading ? 'Enviando...' : 'Submeter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
