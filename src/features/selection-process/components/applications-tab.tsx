'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { SelectionProcessRepository } from '@/repositories/selection-process.repository';
import { toUserMessage } from '@/lib/api-client';
import { ApplicationStatusBadge } from './application-status-badge';
import type { SelectionProcessApplication } from '@/types/selection-process';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function ApplicationSheet({
  application,
  open,
  onOpenChange,
  canUpdate
}: {
  application: SelectionProcessApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canUpdate: boolean;
}) {
  const updateMutation = SelectionProcessRepository.useUpdateApplicationStatus();

  function handleStatus(status: 'approved' | 'reproved') {
    if (!application) return;
    updateMutation.mutate(
      { applicationId: application.id, payload: { status } },
      {
        onSuccess: () => {
          toast.success(status === 'approved' ? 'Candidatura aprovada!' : 'Candidatura reprovada!');
          onOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  if (!application) return null;

  const isPending = updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-md'>
        <SheetHeader className='pb-4'>
          <SheetTitle>{application.name}</SheetTitle>
          <SheetDescription>
            {application.course} · Período {application.period}
          </SheetDescription>
        </SheetHeader>

        {/* Photo */}
        {application.photo_signed_url && (
          <div className='mb-5 overflow-hidden rounded-xl'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={application.photo_signed_url}
              alt={application.name}
              className='w-full object-cover max-h-64'
            />
          </div>
        )}

        {/* Status */}
        <div className='mb-4 flex items-center gap-2'>
          <span className='text-muted-foreground text-sm'>Status:</span>
          <ApplicationStatusBadge status={application.status} />
        </div>

        {/* Actions */}
        {canUpdate && application.status === 'pending' && (
          <div className='mb-6 flex gap-2'>
            <Button
              size='sm'
              variant='outline'
              className='flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
              disabled={isPending}
              onClick={() => handleStatus('approved')}
            >
              {isPending ? (
                <Icons.spinner className='mr-2 size-4 animate-spin' />
              ) : (
                <Icons.check className='mr-2 size-4' />
              )}
              Aprovar
            </Button>
            <Button
              size='sm'
              variant='outline'
              className='flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40'
              disabled={isPending}
              onClick={() => handleStatus('reproved')}
            >
              {isPending ? (
                <Icons.spinner className='mr-2 size-4 animate-spin' />
              ) : (
                <Icons.close className='mr-2 size-4' />
              )}
              Reprovar
            </Button>
          </div>
        )}

        {/* Info rows */}
        <dl className='space-y-3 text-sm'>
          <div>
            <dt className='text-muted-foreground font-medium'>E-mail</dt>
            <dd className='mt-0.5'>{application.email}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground font-medium'>Telefone</dt>
            <dd className='mt-0.5'>{application.phone}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground font-medium'>Instagram</dt>
            <dd className='mt-0.5'>{application.instagram}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground font-medium'>Como ficou sabendo</dt>
            <dd className='mt-0.5'>{application.how_heard}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground font-medium'>Tamanho de camiseta</dt>
            <dd className='mt-0.5'>{application.shirt_size}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground font-medium'>Motivação</dt>
            <dd className='mt-0.5 whitespace-pre-wrap'>{application.motivation}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground font-medium'>Por que a Watt</dt>
            <dd className='mt-0.5 whitespace-pre-wrap'>{application.why_watt}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground font-medium'>Inscrito em</dt>
            <dd className='mt-0.5'>{formatDate(application.created_at)}</dd>
          </div>
        </dl>

        {/* Documents */}
        <div className='mt-5 space-y-2'>
          <p className='text-muted-foreground text-sm font-medium'>Documentos</p>
          <div className='flex flex-wrap gap-2'>
            {application.resume_signed_url && (
              <a
                href={application.resume_signed_url}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors'
              >
                <Icons.fileTypePdf className='size-3.5' />
                Currículo
              </a>
            )}
            {application.transcript_signed_url && (
              <a
                href={application.transcript_signed_url}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors'
              >
                <Icons.post className='size-3.5' />
                Histórico
              </a>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Application Card ─────────────────────────────────────────────────────────

function ApplicationCard({
  application,
  canUpdate,
  onOpen
}: {
  application: SelectionProcessApplication;
  canUpdate: boolean;
  onOpen: () => void;
}) {
  const updateMutation = SelectionProcessRepository.useUpdateApplicationStatus();
  const isPending = updateMutation.isPending;

  function handleStatus(e: React.MouseEvent, status: 'approved' | 'reproved') {
    e.stopPropagation();
    updateMutation.mutate(
      { applicationId: application.id, payload: { status } },
      {
        onSuccess: () =>
          toast.success(status === 'approved' ? 'Candidatura aprovada!' : 'Candidatura reprovada!'),
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <div
      onClick={onOpen}
      className='group relative overflow-hidden rounded-xl border bg-card cursor-pointer transition-all hover:shadow-md hover:border-primary/30'
    >
      {/* Header */}
      <div className='flex items-start justify-between gap-2 p-3 pb-2'>
        <div className='min-w-0'>
          <p className='font-semibold leading-tight truncate'>{application.name}</p>
          <p className='text-muted-foreground text-xs mt-0.5 truncate'>
            {application.course} · {application.period}º período
          </p>
        </div>

        {/* Action buttons */}
        <div className='flex items-center gap-1 shrink-0' onClick={(e) => e.stopPropagation()}>
          {canUpdate && application.status === 'pending' && (
            <>
              <Button
                variant='ghost'
                size='icon'
                className='size-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                disabled={isPending}
                onClick={(e) => handleStatus(e, 'reproved')}
                title='Reprovar'
              >
                {isPending ? (
                  <Icons.spinner className='size-3.5 animate-spin' />
                ) : (
                  <Icons.close className='size-3.5' />
                )}
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='size-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                disabled={isPending}
                onClick={(e) => handleStatus(e, 'approved')}
                title='Aprovar'
              >
                {isPending ? (
                  <Icons.spinner className='size-3.5 animate-spin' />
                ) : (
                  <Icons.check className='size-3.5' />
                )}
              </Button>
            </>
          )}
          <Button
            variant='ghost'
            size='icon'
            className='size-7 text-muted-foreground hover:text-foreground'
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            title='Ver detalhes'
          >
            <Icons.info className='size-3.5' />
          </Button>
        </div>
      </div>

      {/* Status badge */}
      <div className='px-3 pb-2'>
        <ApplicationStatusBadge status={application.status} />
      </div>

      {/* Photo */}
      {application.photo_signed_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={application.photo_signed_url}
          alt={application.name}
          className='w-full aspect-[4/3] object-cover object-top'
        />
      ) : (
        <div className='w-full aspect-[4/3] bg-muted flex items-center justify-center'>
          <Icons.user2 className='size-12 text-muted-foreground/40' />
        </div>
      )}
    </div>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

export function ApplicationsTab() {
  const { rank } = useUserProfile();
  const canUpdate = rank >= 3;

  const { data: processes } = SelectionProcessRepository.useProcesses();
  const [selectedProcessId, setSelectedProcessId] = useState<string | undefined>(undefined);
  const [sheetApp, setSheetApp] = useState<SelectionProcessApplication | null>(null);

  const { data: applications, isLoading } =
    SelectionProcessRepository.useApplications(selectedProcessId);

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-9 w-64 rounded-lg' />
        <div className='grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className='aspect-[3/4] w-full rounded-xl' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Filter */}
      <div className='flex flex-wrap items-center gap-2'>
        <p className='text-sm font-medium text-muted-foreground'>Filtrar por processo:</p>
        <Select
          value={selectedProcessId ?? '__all__'}
          onValueChange={(v) => setSelectedProcessId(v === '__all__' ? undefined : v)}
        >
          <SelectTrigger className='h-8 w-auto min-w-48 text-sm'>
            <SelectValue placeholder='Todos os processos' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='__all__'>Todos os processos</SelectItem>
            {(processes ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {!applications || applications.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14 text-center'>
          <div className='flex size-12 items-center justify-center rounded-full bg-muted'>
            <Icons.usersGroup className='size-5 text-muted-foreground' />
          </div>
          <div>
            <p className='font-medium'>Nenhuma candidatura</p>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              Não há candidaturas {selectedProcessId ? 'para este processo' : 'registradas'}.
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className='text-xs text-muted-foreground font-medium'>
            {applications.length} candidatura{applications.length !== 1 ? 's' : ''}
          </p>
          <div className='grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'>
            {applications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                canUpdate={canUpdate}
                onOpen={() => setSheetApp(app)}
              />
            ))}
          </div>
        </>
      )}

      {/* Detail sheet */}
      <ApplicationSheet
        application={sheetApp}
        open={!!sheetApp}
        onOpenChange={(open) => {
          if (!open) setSheetApp(null);
        }}
        canUpdate={canUpdate}
      />
    </div>
  );
}
