'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { SelectionProcessRepository } from '@/repositories/selection-process.repository';
import { toUserMessage } from '@/lib/api-client';
import { CandidateStatusBadge } from './candidate-status-badge';
import { PhotoLightbox } from './photo-lightbox';
import type { Candidate } from '@/types/selection-process';

export interface CandidateInterviewInfo {
  startsAt: string;
  endsAt: string;
  interviewers: string[];
}

const TZ = 'America/Sao_Paulo';

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ
  });
}

interface CandidateCardProps {
  candidate: Candidate;
  currentStageName?: string;
  canEdit: boolean;
  hasInterview?: boolean;
  canShowInterviewStatus?: boolean;
  onOpen: () => void;
}

export function CandidateCard({
  candidate,
  currentStageName,
  canEdit,
  hasInterview,
  canShowInterviewStatus,
  onOpen
}: CandidateCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
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
        <div className='relative group/photo'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={candidate.photo_signed_url}
            alt={candidate.name}
            className='w-full aspect-[4/3] object-cover object-top'
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            className='absolute bottom-2 right-2 rounded-md bg-black/50 p-1.5 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity hover:bg-black/70'
            title='Ver em tela cheia'
          >
            <Icons.maximize className='size-3.5' />
          </button>
        </div>
      ) : (
        <div className='w-full aspect-[4/3] bg-muted flex items-center justify-center'>
          <Icons.user2 className='size-12 text-muted-foreground/40' />
        </div>
      )}
      {candidate.photo_signed_url && (
        <PhotoLightbox
          src={candidate.photo_signed_url}
          alt={candidate.name}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
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

        <div className='flex flex-wrap gap-1.5 items-center'>
          <CandidateStatusBadge status={candidate.status} />
          {canShowInterviewStatus &&
            isActive &&
            (hasInterview ? (
              <Badge
                variant='outline'
                className='border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400 text-[0.65rem] px-1.5 py-0 h-5 gap-1'
              >
                <Icons.calendar className='size-2.5' />
                Entrevista marcada
              </Badge>
            ) : (
              <Badge
                variant='outline'
                className='text-[0.65rem] px-1.5 py-0 h-5 text-muted-foreground'
              >
                Sem entrevista
              </Badge>
            ))}
        </div>

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
  interviewInfo?: CandidateInterviewInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
}

export function CandidateSheet({
  candidate,
  currentStageName,
  interviewInfo,
  open,
  onOpenChange,
  canEdit
}: CandidateSheetProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
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
          <>
            <div
              className='relative group/photo mb-5 overflow-hidden rounded-xl cursor-zoom-in'
              onClick={() => setLightboxOpen(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={candidate.photo_signed_url}
                alt={candidate.name}
                className='w-full object-cover object-top max-h-64'
              />
              <div className='absolute inset-0 bg-black/0 group-hover/photo:bg-black/20 transition-colors flex items-center justify-center'>
                <Icons.maximize className='size-6 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity drop-shadow-lg' />
              </div>
            </div>
            <PhotoLightbox
              src={candidate.photo_signed_url}
              alt={candidate.name}
              open={lightboxOpen}
              onOpenChange={setLightboxOpen}
            />
          </>
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

        {/* Interview info — shown only when a booking exists */}
        {interviewInfo && (
          <div className='mb-5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-3'>
            <p className='text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2'>
              <Icons.calendar className='size-4 shrink-0' />
              Entrevista agendada
            </p>
            <div className='space-y-2 text-sm'>
              <div className='flex items-start gap-2.5'>
                <Icons.clock className='size-3.5 text-muted-foreground shrink-0 mt-0.5' />
                <div>
                  <p className='capitalize'>{fmtDate(interviewInfo.startsAt)}</p>
                  <p className='text-muted-foreground text-xs'>
                    {fmtTime(interviewInfo.startsAt)} – {fmtTime(interviewInfo.endsAt)} (BRT)
                  </p>
                </div>
              </div>
              {interviewInfo.interviewers.length > 0 && (
                <div className='flex items-start gap-2.5'>
                  <Icons.usersGroup className='size-3.5 text-muted-foreground shrink-0 mt-0.5' />
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>Entrevistadores</p>
                    <div className='flex flex-wrap gap-1.5'>
                      {interviewInfo.interviewers.map((name) => (
                        <span
                          key={name}
                          className='inline-flex items-center gap-1 rounded-md bg-background border px-2 py-0.5 text-xs'
                        >
                          <Icons.user className='size-3 text-muted-foreground' />
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
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
