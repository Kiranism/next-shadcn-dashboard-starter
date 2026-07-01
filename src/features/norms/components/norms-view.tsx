'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { NormsRepository } from '@/repositories/norms.repository';
import { NormCard } from './norm-card';
import { NormFormDialog } from './norm-form-dialog';
import { DeleteNormDialog } from './delete-norm-dialog';
import type { Norm } from '@/types/norms';

export function NormsView() {
  const { rank } = useUserProfile();
  const canEdit = rank >= 3;

  const { data: norms = [], isLoading } = NormsRepository.useList();
  const [formOpen, setFormOpen] = useState(false);
  const [editNorm, setEditNorm] = useState<Norm | null>(null);
  const [deleteNorm, setDeleteNorm] = useState<Norm | null>(null);

  function handleEdit(norm: Norm) {
    setEditNorm(norm);
    setFormOpen(true);
  }

  function handleFormClose(v: boolean) {
    setFormOpen(v);
    if (!v) setEditNorm(null);
  }

  return (
    <div className='space-y-5'>
      {canEdit && (
        <div className='flex justify-end'>
          <Button size='sm' onClick={() => setFormOpen(true)}>
            <Icons.add className='mr-1.5 size-4' />
            Nova Norma
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className='space-y-3'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex items-start gap-3 rounded-xl border p-4'>
              <Skeleton className='size-9 rounded-full' />
              <div className='flex-1 space-y-2'>
                <div className='flex gap-2'>
                  <Skeleton className='h-4 w-12' />
                  <Skeleton className='h-4 w-20 rounded-md' />
                </div>
                <Skeleton className='h-3 w-3/4' />
              </div>
            </div>
          ))}
        </div>
      ) : norms.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center'>
          <div className='flex size-14 items-center justify-center rounded-full bg-muted'>
            <Icons.post className='size-6 text-muted-foreground' />
          </div>
          <div>
            <p className='font-medium'>Nenhuma norma cadastrada</p>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              {canEdit
                ? 'Clique em "Nova Norma" para começar.'
                : 'O estatuto ainda não possui normas cadastradas.'}
            </p>
          </div>
          {canEdit && (
            <Button variant='outline' size='sm' onClick={() => setFormOpen(true)}>
              <Icons.add className='mr-1.5 size-4' />
              Nova Norma
            </Button>
          )}
        </div>
      ) : (
        <div className='space-y-3'>
          {norms.map((norm) => (
            <NormCard
              key={norm.id}
              norm={norm}
              canEdit={canEdit}
              onEdit={handleEdit}
              onDelete={setDeleteNorm}
            />
          ))}
        </div>
      )}

      <NormFormDialog open={formOpen} onOpenChange={handleFormClose} norm={editNorm ?? undefined} />
      <DeleteNormDialog norm={deleteNorm} onClose={() => setDeleteNorm(null)} />
    </div>
  );
}
