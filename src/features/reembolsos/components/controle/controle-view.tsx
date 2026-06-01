'use client';

import { useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReembolsosRepository } from '@/repositories/reembolsos.repository';
import { UserRepository } from '@/repositories/users.repository';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { TopUsersChart } from './top-users-chart';
import { CategoryChart } from './sector-chart';
import { ControleFilters, type ControleFiltersState } from './controle-filters';
import { ReembolsoControleCard } from './reembolso-controle-card';
import { StatusUpdateDialog } from './status-update-dialog';
import { Icons } from '@/components/icons';
import type { Reimbursement } from '@/types/api';

export function ControleView() {
  const { rank } = useUserProfile();
  const isPresidente = rank >= 4;

  const { data: reimbursements = [], isLoading: rLoading } = ReembolsosRepository.useAll();
  const { data: users = [], isLoading: uLoading } = UserRepository.useAll();
  const isLoading = rLoading || uLoading;

  const [filters, setFilters] = useState<ControleFiltersState>({
    search: '',
    sector: '',
    role: '',
    status: ''
  });

  const [dialogReimb, setDialogReimb] = useState<Reimbursement | null>(null);
  const [dialogAction, setDialogAction] = useState<'approved' | 'rejected' | null>(null);

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const enriched = useMemo(
    () =>
      reimbursements.map((r) => {
        const user = userMap.get(r.user_id);
        return {
          reimbursement: r,
          userName: user?.name ?? 'Usuário desconhecido',
          userRole: user?.role ?? '',
          userSector: user?.sector ?? null
        };
      }),
    [reimbursements, userMap]
  );

  const filtered = useMemo(() => {
    return enriched.filter(({ reimbursement, userName, userRole, userSector }) => {
      if (filters.search) {
        const term = filters.search.toLowerCase();
        if (!userName.toLowerCase().includes(term)) return false;
      }
      if (filters.sector && userSector !== filters.sector) return false;
      if (filters.role && userRole !== filters.role) return false;
      if (filters.status && reimbursement.status !== filters.status) return false;
      return true;
    });
  }, [enriched, filters]);

  const topUsers = useMemo(() => {
    const acc = new Map<string, { name: string; total: number }>();
    for (const { reimbursement, userName } of filtered) {
      if (reimbursement.status !== 'approved') continue;
      const cur = acc.get(reimbursement.user_id) ?? {
        name: userName,
        total: 0
      };
      acc.set(reimbursement.user_id, {
        name: cur.name,
        total: cur.total + reimbursement.amount_cents
      });
    }
    return Array.from(acc.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filtered]);

  const categoryData = useMemo(() => {
    const acc = new Map<string, number>();
    for (const { reimbursement } of filtered) {
      if (reimbursement.status !== 'approved') continue;
      acc.set(
        reimbursement.category,
        (acc.get(reimbursement.category) ?? 0) + reimbursement.amount_cents
      );
    }
    return Array.from(acc.entries())
      .map(([category, total]) => ({
        category: category as import('@/types/api').ReimbursementCategory,
        total
      }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  function openApprove(r: Reimbursement) {
    setDialogReimb(r);
    setDialogAction('approved');
  }

  function openReject(r: Reimbursement) {
    setDialogReimb(r);
    setDialogAction('rejected');
  }

  function closeDialog() {
    setDialogReimb(null);
    setDialogAction(null);
  }

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Valor Aprovado por Usuário</CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            {isLoading ? (
              <Skeleton className='h-[220px] w-full rounded-lg' />
            ) : (
              <TopUsersChart data={topUsers} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Aprovado por Tipo de Reembolso
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            {isLoading ? (
              <Skeleton className='h-[220px] w-full rounded-lg' />
            ) : (
              <CategoryChart data={categoryData} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <CardTitle className='text-base font-semibold'>Todas as Solicitações</CardTitle>
              {!isLoading && (
                <p className='text-muted-foreground mt-0.5 text-xs'>
                  {filtered.length} de {enriched.length} solicitaç
                  {enriched.length !== 1 ? 'ões' : 'ão'}
                </p>
              )}
            </div>
          </div>
          <ControleFilters filters={filters} onChange={setFilters} />
        </CardHeader>

        <CardContent className='pt-0'>
          {isLoading ? (
            <div className='space-y-3'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-28 w-full rounded-xl' />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-3 py-12 text-center'>
              <Icons.receipt className='size-8 text-muted-foreground' />
              <p className='text-muted-foreground text-sm'>Nenhuma solicitação encontrada.</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {filtered.map(({ reimbursement, userName, userRole, userSector }) => (
                <ReembolsoControleCard
                  key={reimbursement.id}
                  reimbursement={reimbursement}
                  userName={userName}
                  userRole={userRole}
                  userSector={userSector}
                  isPresidente={isPresidente}
                  onApprove={openApprove}
                  onReject={openReject}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <StatusUpdateDialog reimbursement={dialogReimb} action={dialogAction} onClose={closeDialog} />
    </div>
  );
}
