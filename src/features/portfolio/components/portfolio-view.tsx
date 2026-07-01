'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { PortfolioRepository } from '@/repositories/portfolio.repository';
import { PortfolioItemCard } from './portfolio-item-card';
import { PortfolioFormDialog } from './portfolio-form-dialog';
import { DeletePortfolioDialog } from './delete-portfolio-dialog';
import type { PortfolioItem } from '@/types/api';

export function PortfolioView() {
  const { rank } = useUserProfile();
  const canEdit = rank >= 2;

  const { data: items = [], isLoading } = PortfolioRepository.useList();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<PortfolioItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<PortfolioItem | null>(null);

  function handleEdit(item: PortfolioItem) {
    setEditItem(item);
    setFormOpen(true);
  }

  function handleFormClose(v: boolean) {
    setFormOpen(v);
    if (!v) setEditItem(null);
  }

  return (
    <div className='space-y-5'>
      {canEdit && (
        <div className='flex justify-end'>
          <Button size='sm' onClick={() => setFormOpen(true)}>
            <Icons.add className='mr-1.5 size-4' />
            Novo Serviço
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className='space-y-3'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='flex items-start gap-3 rounded-xl border p-4'>
              <Skeleton className='size-9 rounded-full' />
              <div className='flex-1 space-y-1.5'>
                <Skeleton className='h-4 w-40' />
                <Skeleton className='h-3 w-64' />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center'>
          <div className='flex size-14 items-center justify-center rounded-full bg-muted'>
            <Icons.tag className='size-6 text-muted-foreground' />
          </div>
          <div>
            <p className='font-medium'>Nenhum serviço cadastrado</p>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              {canEdit
                ? 'Clique em "Novo Serviço" para começar.'
                : 'O portfólio ainda não possui serviços.'}
            </p>
          </div>
          {canEdit && (
            <Button variant='outline' size='sm' onClick={() => setFormOpen(true)}>
              <Icons.add className='mr-1.5 size-4' />
              Novo Serviço
            </Button>
          )}
        </div>
      ) : (
        <div className='space-y-3'>
          {items.map((item) => (
            <PortfolioItemCard
              key={item.id}
              item={item}
              canEdit={canEdit}
              onEdit={handleEdit}
              onDelete={setDeleteItem}
            />
          ))}
        </div>
      )}

      <PortfolioFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        item={editItem ?? undefined}
      />
      <DeletePortfolioDialog item={deleteItem} onClose={() => setDeleteItem(null)} />
    </div>
  );
}
