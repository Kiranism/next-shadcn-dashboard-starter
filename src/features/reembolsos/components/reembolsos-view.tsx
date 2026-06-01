'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { ReembolsosRepository } from '@/repositories/reembolsos.repository';
import { ReembolsoCard } from './reembolso-card';
import { ReembolsoFormDialog } from './reembolso-form-dialog';
import { ReembolsoSummary } from './reembolso-summary';

export function ReembolsosView() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: reimbursements = [], isLoading } = ReembolsosRepository.useOwn();

  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between gap-3'>
        {!isLoading && reimbursements.length > 0 && (
          <ReembolsoSummary reimbursements={reimbursements} />
        )}
        <Button onClick={() => setDialogOpen(true)} className='ml-auto shrink-0' size='sm'>
          <Icons.add className='mr-1.5 size-4' />
          Nova Solicitação
        </Button>
      </div>

      {isLoading ? (
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='rounded-xl border p-4 space-y-3'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-start gap-3'>
                  <Skeleton className='size-9 rounded-full' />
                  <div className='space-y-1.5'>
                    <Skeleton className='h-4 w-40' />
                    <Skeleton className='h-3 w-24' />
                  </div>
                </div>
                <div className='space-y-1.5 text-right'>
                  <Skeleton className='h-5 w-20 ml-auto' />
                  <Skeleton className='h-5 w-16 ml-auto' />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reimbursements.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center'>
          <div className='flex size-14 items-center justify-center rounded-full bg-muted'>
            <Icons.receipt className='size-6 text-muted-foreground' />
          </div>
          <div>
            <p className='font-medium'>Nenhuma solicitação ainda</p>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              Clique em "Nova Solicitação" para começar.
            </p>
          </div>
          <Button variant='outline' size='sm' onClick={() => setDialogOpen(true)}>
            <Icons.add className='mr-1.5 size-4' />
            Nova Solicitação
          </Button>
        </div>
      ) : (
        <div className='space-y-3'>
          {reimbursements.map((r) => (
            <ReembolsoCard key={r.id} reimbursement={r} />
          ))}
        </div>
      )}

      <ReembolsoFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
