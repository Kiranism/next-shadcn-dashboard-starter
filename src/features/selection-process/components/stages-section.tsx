'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { SelectionProcessRepository } from '@/repositories/selection-process.repository';
import { StageFormDialog } from './stage-form-dialog';
import type { Stage } from '@/types/selection-process';

interface StagesSectionProps {
  processId: string;
  canEdit: boolean;
}

export function StagesSection({ processId, canEdit }: StagesSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);

  const { data: stages, isLoading } = SelectionProcessRepository.useStages(processId);

  const sorted = [...(stages ?? [])].sort((a, b) => a.position - b.position);

  return (
    <div className='border-t'>
      <button
        type='button'
        onClick={() => setExpanded((v) => !v)}
        className='flex w-full items-center justify-between px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
      >
        <span className='flex items-center gap-1.5 font-medium'>
          <Icons.galleryVerticalEnd className='size-3.5' />
          Etapas
          {stages && (
            <span className='rounded-full bg-muted px-1.5 py-0.5 text-xs leading-none'>
              {stages.length}
            </span>
          )}
        </span>
        {expanded ? (
          <Icons.chevronUp className='size-4' />
        ) : (
          <Icons.chevronDown className='size-4' />
        )}
      </button>

      {expanded && (
        <div className='px-4 pb-3 space-y-2'>
          {isLoading ? (
            <div className='space-y-1.5'>
              <Skeleton className='h-5 w-48' />
              <Skeleton className='h-5 w-40' />
            </div>
          ) : sorted.length === 0 ? (
            <p className='text-sm text-muted-foreground'>Nenhuma etapa cadastrada.</p>
          ) : (
            <ul className='space-y-0.5'>
              {sorted.map((stage) => (
                <li
                  key={stage.id}
                  className='flex items-center justify-between gap-2 text-sm py-0.5'
                >
                  <span>
                    <span className='font-medium'>Etapa {stage.position}</span>
                    <span className='text-muted-foreground'> — {stage.name}</span>
                  </span>
                  {canEdit && (
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-6 shrink-0 text-muted-foreground hover:text-foreground'
                      onClick={() => setEditingStage(stage)}
                      title='Editar etapa'
                    >
                      <Icons.edit className='size-3' />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canEdit && (
            <Button
              size='sm'
              variant='outline'
              className='mt-1 h-7 text-xs'
              onClick={() => setCreateOpen(true)}
            >
              <Icons.add className='mr-1 size-3.5' />
              Nova Etapa
            </Button>
          )}
        </div>
      )}

      <StageFormDialog processId={processId} open={createOpen} onOpenChange={setCreateOpen} />

      <StageFormDialog
        processId={processId}
        stage={editingStage ?? undefined}
        open={!!editingStage}
        onOpenChange={(open) => {
          if (!open) setEditingStage(null);
        }}
      />
    </div>
  );
}
