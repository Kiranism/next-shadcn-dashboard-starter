'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { GamificationRepository } from '@/repositories/gamification.repository';
import { toUserMessage } from '@/lib/api-client';
import { CycleFormDialog } from './cycle-form-dialog';
import type { GamificationCycle } from '@/types/gamification';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function CycleRow({ cycle }: { cycle: GamificationCycle }) {
  const isActive = !cycle.ended_at;
  return (
    <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3'>
      <div>
        <p className='font-medium'>{cycle.name}</p>
        <p className='text-muted-foreground text-xs mt-0.5'>
          Início: {formatDate(cycle.started_at)}
          {cycle.ended_at ? ` · Fim: ${formatDate(cycle.ended_at)}` : ''}
        </p>
      </div>
      <Badge
        variant='outline'
        className={
          isActive
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
            : 'text-muted-foreground'
        }
      >
        {isActive ? 'Em andamento' : 'Encerrado'}
      </Badge>
    </div>
  );
}

export function CyclesTab() {
  const { data: cycles, isLoading } = GamificationRepository.useCycles();
  const { data: activeCycle } = GamificationRepository.useActiveCycle();
  const closeMutation = GamificationRepository.useCloseCycle();

  const [newCycleOpen, setNewCycleOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  function handleClose() {
    if (!activeCycle) return;
    closeMutation.mutate(activeCycle.id, {
      onSuccess: () => {
        toast.success('Ciclo encerrado!');
        setCloseConfirmOpen(false);
      },
      onError: (err) => {
        toast.error(toUserMessage(err));
        setCloseConfirmOpen(false);
      }
    });
  }

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-32 w-full rounded-xl' />
        <div className='space-y-2'>
          {[1, 2].map((i) => (
            <Skeleton key={i} className='h-16 w-full rounded-lg' />
          ))}
        </div>
      </div>
    );
  }

  const sorted = [...(cycles ?? [])].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );

  return (
    <div className='space-y-5'>
      {activeCycle ? (
        <Card className='border-2 border-emerald-400/60 dark:border-emerald-600/50 bg-emerald-50/40 dark:bg-emerald-950/20'>
          <CardHeader className='pb-2 pt-4'>
            <div className='flex items-center justify-between gap-2'>
              <CardTitle className='text-base'>Ciclo Ativo</CardTitle>
              <Badge className='bg-emerald-600 text-white text-xs'>Em andamento</Badge>
            </div>
          </CardHeader>
          <CardContent className='pb-4'>
            <p className='text-xl font-bold'>{activeCycle.name}</p>
            <p className='text-muted-foreground text-sm mt-0.5'>
              Iniciado em {formatDate(activeCycle.started_at)}
            </p>
            <div className='mt-4 flex justify-end'>
              <Button
                variant='outline'
                size='sm'
                className='border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40'
                onClick={() => setCloseConfirmOpen(true)}
              >
                <Icons.close className='mr-1.5 size-3.5' />
                Encerrar Ciclo
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-10 text-center'>
          <div className='flex size-12 items-center justify-center rounded-full bg-muted'>
            <Icons.calendar className='size-5 text-muted-foreground' />
          </div>
          <div>
            <p className='font-medium'>Nenhum ciclo ativo</p>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              Crie um novo ciclo para iniciar a gamificação.
            </p>
          </div>
          <Button size='sm' onClick={() => setNewCycleOpen(true)}>
            <Icons.add className='mr-1.5 size-4' />
            Novo Ciclo
          </Button>
        </div>
      )}

      {!activeCycle && cycles && cycles.length > 0 && (
        <div className='flex justify-end'>
          <Button size='sm' onClick={() => setNewCycleOpen(true)}>
            <Icons.add className='mr-1.5 size-4' />
            Novo Ciclo
          </Button>
        </div>
      )}

      {sorted.length > 0 && (
        <div className='space-y-2'>
          <p className='text-muted-foreground text-xs font-semibold uppercase tracking-wider'>
            Histórico
          </p>
          {sorted.map((c) => (
            <CycleRow key={c.id} cycle={c} />
          ))}
        </div>
      )}

      <CycleFormDialog open={newCycleOpen} onOpenChange={setNewCycleOpen} />

      <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar ciclo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O ciclo &quot;{activeCycle?.name}&quot; será
              encerrado e os pontos serão congelados. Certifique-se de que não há submissões
              pendentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closeMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClose}
              disabled={closeMutation.isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {closeMutation.isPending && <Icons.spinner className='mr-2 size-4 animate-spin' />}
              Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
