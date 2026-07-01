'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { GamificationRepository } from '@/repositories/gamification.repository';
import { toUserMessage } from '@/lib/api-client';
import type { GamificationSubmission } from '@/types/gamification';

function PendingCard({
  submission,
  onApprove,
  onReject
}: {
  submission: GamificationSubmission;
  onApprove: () => void;
  onReject: () => void;
}) {
  const date = new Date(submission.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <Card>
      <CardContent className='p-4'>
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <div className='min-w-0 flex-1 space-y-0.5'>
            {submission.user_name && (
              <p className='text-muted-foreground text-xs font-medium'>{submission.user_name}</p>
            )}
            <p className='font-semibold leading-tight'>{submission.task_title ?? 'Tarefa'}</p>
            <p className='text-muted-foreground text-xs'>{date}</p>
          </div>
          <div className='flex shrink-0 items-center gap-1.5'>
            <Badge
              variant='outline'
              className='bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-xs'
            >
              Pendente
            </Badge>
            {submission.file_url && (
              <Button variant='ghost' size='icon' className='size-7' asChild>
                <a
                  href={submission.file_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  title='Ver comprovante'
                >
                  <Icons.externalLink className='size-3.5' />
                </a>
              </Button>
            )}
          </div>
        </div>

        {submission.description && (
          <p className='text-muted-foreground mt-2 text-sm line-clamp-2'>
            {submission.description}
          </p>
        )}

        <div className='mt-3 flex justify-end gap-2'>
          <Button
            variant='outline'
            size='sm'
            className='h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40'
            onClick={onReject}
          >
            <Icons.close className='mr-1.5 size-3.5' />
            Rejeitar
          </Button>
          <Button
            size='sm'
            className='h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white'
            onClick={onApprove}
          >
            <Icons.check className='mr-1.5 size-3.5' />
            Aprovar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

function RejectDialog({ open, onOpenChange, onConfirm, isPending }: RejectDialogProps) {
  const [reason, setReason] = useState('');

  function handleConfirm() {
    onConfirm(reason.trim());
    setReason('');
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isPending) {
          setReason('');
          onOpenChange(v);
        }
      }}
    >
      <DialogContent className='w-[min(90vw,420px)]'>
        <DialogHeader>
          <DialogTitle>Rejeitar Submissão</DialogTitle>
        </DialogHeader>
        <div className='space-y-1.5 py-2'>
          <Label htmlFor='reject-reason'>Motivo (opcional)</Label>
          <Textarea
            id='reject-reason'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='Explique o motivo da rejeição'
            rows={3}
            className='resize-none'
          />
        </div>
        <DialogFooter>
          <Button variant='outline' disabled={isPending} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant='destructive' disabled={isPending} onClick={handleConfirm}>
            {isPending && <Icons.spinner className='mr-2 size-4 animate-spin' />}
            Confirmar Rejeição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PendingSubmissionsTab() {
  const { data: submissions, isLoading } = GamificationRepository.usePendingSubmissions();
  const reviewMutation = GamificationRepository.useReviewSubmission();

  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  function handleApprove(id: string) {
    reviewMutation.mutate(
      { id, payload: { status: 'approved' } },
      {
        onSuccess: () => toast.success('Submissão aprovada!'),
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  function handleReject(id: string, reason: string) {
    reviewMutation.mutate(
      { id, payload: { status: 'rejected', rejection_reason: reason || undefined } },
      {
        onSuccess: () => {
          toast.success('Submissão rejeitada.');
          setRejectTarget(null);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  if (isLoading) {
    return (
      <div className='space-y-3'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='rounded-xl border p-4 space-y-2'>
            <div className='flex items-start justify-between gap-2'>
              <div className='space-y-1.5'>
                <Skeleton className='h-3 w-28' />
                <Skeleton className='h-4 w-44' />
              </div>
              <Skeleton className='h-5 w-20' />
            </div>
            <Skeleton className='h-3 w-full' />
            <div className='flex justify-end gap-2 pt-1'>
              <Skeleton className='h-8 w-24' />
              <Skeleton className='h-8 w-24' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!submissions?.length) {
    return (
      <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center'>
        <div className='flex size-14 items-center justify-center rounded-full bg-muted'>
          <Icons.circleCheck className='size-6 text-muted-foreground' />
        </div>
        <div>
          <p className='font-medium'>Nenhuma submissão pendente</p>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            Todas as submissões foram revisadas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='space-y-3'>
        {submissions.map((s) => (
          <PendingCard
            key={s.id}
            submission={s}
            onApprove={() => handleApprove(s.id)}
            onReject={() => setRejectTarget(s.id)}
          />
        ))}
      </div>

      <RejectDialog
        open={!!rejectTarget}
        onOpenChange={(v) => {
          if (!v) setRejectTarget(null);
        }}
        onConfirm={(reason) => rejectTarget && handleReject(rejectTarget, reason)}
        isPending={reviewMutation.isPending}
      />
    </>
  );
}
