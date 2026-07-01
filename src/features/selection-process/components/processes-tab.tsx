'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { SelectionProcessRepository } from '@/repositories/selection-process.repository';
import { ProcessFormDialog } from './process-form-dialog';
import { StagesSection } from './stages-section';
import type { SelectionProcess } from '@/types/selection-process';

function getProcessStatus(process: SelectionProcess): 'active' | 'past' | 'future' {
  const now = new Date();
  const start = new Date(process.starts_at);
  const end = new Date(process.ends_at);
  if (now >= start && now <= end) return 'active';
  if (now > end) return 'past';
  return 'future';
}

function statusConfig(status: 'active' | 'past' | 'future') {
  if (status === 'active')
    return {
      label: 'Em andamento',
      className:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
    };
  if (status === 'future')
    return {
      label: 'Futuro',
      className:
        'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
    };
  return { label: 'Encerrado', className: 'text-muted-foreground' };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function ProcessCard({ process, canEdit }: { process: SelectionProcess; canEdit: boolean }) {
  const [editOpen, setEditOpen] = useState(false);
  const status = getProcessStatus(process);
  const { label, className } = statusConfig(status);

  return (
    <div className='overflow-hidden rounded-xl border'>
      <div className='flex flex-wrap items-start justify-between gap-3 px-4 py-4'>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='font-semibold'>{process.title}</p>
            <Badge variant='outline' className={className}>
              {label}
            </Badge>
          </div>
          <p className='text-muted-foreground mt-1 text-xs'>
            {formatDate(process.starts_at)} → {formatDate(process.ends_at)}
          </p>
        </div>
        {canEdit && (
          <>
            <Button
              variant='ghost'
              size='icon'
              className='size-8 shrink-0'
              onClick={() => setEditOpen(true)}
            >
              <Icons.edit className='size-4' />
            </Button>
            <ProcessFormDialog open={editOpen} onOpenChange={setEditOpen} process={process} />
          </>
        )}
      </div>

      <StagesSection processId={process.id} canEdit={canEdit} />
    </div>
  );
}

export function ProcessesTab() {
  const { rank } = useUserProfile();
  const canEdit = rank >= 3;
  const { data: processes, isLoading } = SelectionProcessRepository.useProcesses();
  const [createOpen, setCreateOpen] = useState(false);

  if (isLoading) {
    return (
      <div className='space-y-3'>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className='h-20 w-full rounded-xl' />
        ))}
      </div>
    );
  }

  const sorted = [...(processes ?? [])].sort(
    (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
  );

  return (
    <div className='space-y-4'>
      {canEdit && (
        <div className='flex justify-end'>
          <Button size='sm' onClick={() => setCreateOpen(true)}>
            <Icons.add className='mr-1.5 size-4' />
            Novo Processo
          </Button>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-12 text-center'>
          <div className='flex size-12 items-center justify-center rounded-full bg-muted'>
            <Icons.usersGroup className='size-5 text-muted-foreground' />
          </div>
          <div>
            <p className='font-medium'>Nenhum processo seletivo</p>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              {canEdit
                ? 'Crie o primeiro processo seletivo clicando em "Novo Processo".'
                : 'Nenhum processo seletivo cadastrado ainda.'}
            </p>
          </div>
          {canEdit && (
            <Button size='sm' onClick={() => setCreateOpen(true)}>
              <Icons.add className='mr-1.5 size-4' />
              Novo Processo
            </Button>
          )}
        </div>
      ) : (
        <div className='space-y-2'>
          {sorted.map((p) => (
            <ProcessCard key={p.id} process={p} canEdit={canEdit} />
          ))}
        </div>
      )}

      <ProcessFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
