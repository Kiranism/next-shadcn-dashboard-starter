'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { SelectionProcessRepository } from '@/repositories/selection-process.repository';
import { toUserMessage } from '@/lib/api-client';
import { CandidateStatusBadge } from './candidate-status-badge';
import type { Candidate } from '@/types/selection-process';

interface CandidateCardProps {
  candidate: Candidate;
  currentStageName?: string;
  canEdit: boolean;
  onOpen: () => void;
}

export function CandidateCard({
  candidate,
  currentStageName,
  canEdit,
  onOpen
}: CandidateCardProps) {
  const updateMutation = SelectionProcessRepository.useUpdateCandidate();
  const isPending = updateMutation.isPending;
  const isActive = candidate.status === 'active';

  function handleAction(e: React.MouseEvent, status: 'approved' | 'reproved') {
    e.stopPropagation();
    updateMutation.mutate(
      { candidateId: candidate.id, payload: { status } },
      {
        onSuccess: () =>
          toast.success(status === 'approved' ? 'Candidato avançado!' : 'Candidato eliminado.'),
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <div
      onClick={onOpen}
      className='group relative overflow-hidden rounded-xl border bg-card cursor-pointer transition-all hover:shadow-md hover:border-primary/30'
    >
      {/* Photo */}
      {candidate.photo_signed_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={candidate.photo_signed_url}
          alt={candidate.name}
          className='w-full aspect-[4/3] object-cover object-top'
        />
      ) : (
        <div className='w-full aspect-[4/3] bg-muted flex items-center justify-center'>
          <Icons.user2 className='size-12 text-muted-foreground/40' />
        </div>
      )}

      {/* Content */}
      <div className='p-3 space-y-2'>
        <div className='min-w-0'>
          <p className='font-semibold leading-tight truncate text-sm'>{candidate.name}</p>
          <p className='text-muted-foreground text-xs mt-0.5 truncate'>
            {candidate.course} · {candidate.period}º período
          </p>
          {currentStageName && (
            <p className='text-xs mt-0.5 truncate text-muted-foreground'>
              <span className='inline-flex items-center gap-1'>
                <Icons.galleryVerticalEnd className='size-3 shrink-0' />
                {currentStageName}
              </span>
            </p>
          )}
        </div>

        <CandidateStatusBadge status={candidate.status} />

        {/* Actions */}
        {canEdit && isActive && (
          <div className='flex gap-1.5 pt-1' onClick={(e) => e.stopPropagation()}>
            <Button
              size='sm'
              variant='outline'
              className='flex-1 h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40'
              disabled={isPending}
              onClick={(e) => handleAction(e, 'reproved')}
            >
              {isPending ? (
                <Icons.spinner className='size-3 animate-spin' />
              ) : (
                <Icons.close className='size-3 mr-1' />
              )}
              Eliminar
            </Button>
            <Button
              size='sm'
              variant='outline'
              className='flex-1 h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
              disabled={isPending}
              onClick={(e) => handleAction(e, 'approved')}
            >
              {isPending ? (
                <Icons.spinner className='size-3 animate-spin' />
              ) : (
                <Icons.check className='size-3 mr-1' />
              )}
              Avançar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Candidate Detail Sheet ───────────────────────────────────────────────────

interface CandidateSheetProps {
  candidate: Candidate | null;
  currentStageName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
}

export function CandidateSheet({
  candidate,
  currentStageName,
  open,
  onOpenChange,
  canEdit
}: CandidateSheetProps) {
  const updateMutation = SelectionProcessRepository.useUpdateCandidate();

  function handleAction(status: 'approved' | 'reproved') {
    if (!candidate) return;
    updateMutation.mutate(
      { candidateId: candidate.id, payload: { status } },
      {
        onSuccess: () => {
          toast.success(status === 'approved' ? 'Candidato avançado!' : 'Candidato eliminado.');
          onOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  if (!candidate) return null;

  const isPending = updateMutation.isPending;
  const isActive = candidate.status === 'active';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-md'>
        <SheetHeader className='pb-4'>
          <SheetTitle>{candidate.name}</SheetTitle>
          <SheetDescription>
            {candidate.course} · Período {candidate.period}
          </SheetDescription>
        </SheetHeader>

        {/* Photo */}
        {candidate.photo_signed_url && (
          <div className='mb-5 overflow-hidden rounded-xl'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={candidate.photo_signed_url}
              alt={candidate.name}
              className='w-full object-cover object-top max-h-64'
            />
          </div>
        )}

        <div className='mb-4 flex items-center gap-2'>
          <span className='text-muted-foreground text-sm'>Status:</span>
          <CandidateStatusBadge status={candidate.status} />
        </div>

        {canEdit && isActive && (
          <div className='mb-6 flex gap-2'>
            <Button
              size='sm'
              variant='outline'
              className='flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
              disabled={isPending}
              onClick={() => handleAction('approved')}
            >
              {isPending ? (
                <Icons.spinner className='mr-2 size-4 animate-spin' />
              ) : (
                <Icons.check className='mr-2 size-4' />
              )}
              Avançar
            </Button>
            <Button
              size='sm'
              variant='outline'
              className='flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40'
              disabled={isPending}
              onClick={() => handleAction('reproved')}
            >
              {isPending ? (
                <Icons.spinner className='mr-2 size-4 animate-spin' />
              ) : (
                <Icons.close className='mr-2 size-4' />
              )}
              Eliminar
            </Button>
          </div>
        )}

        <dl className='space-y-3 text-sm'>
          {currentStageName && (
            <div>
              <dt className='text-muted-foreground font-medium'>Etapa atual</dt>
              <dd className='mt-0.5'>{currentStageName}</dd>
            </div>
          )}
          <div>
            <dt className='text-muted-foreground font-medium'>E-mail</dt>
            <dd className='mt-0.5'>{candidate.email}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground font-medium'>Telefone</dt>
            <dd className='mt-0.5'>{candidate.phone}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground font-medium'>Tamanho de camiseta</dt>
            <dd className='mt-0.5'>{candidate.shirt_size}</dd>
          </div>
        </dl>
      </SheetContent>
    </Sheet>
  );
}
