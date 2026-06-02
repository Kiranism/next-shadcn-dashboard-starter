'use client';

import { useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReembolsosRepository } from '@/repositories/reembolsos.repository';
import { UserRepository } from '@/repositories/users.repository';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { TopUsersChart } from './top-users-chart';
import { CategoryChart } from './sector-chart';
import {
  ControleFilters,
  countActiveFilters,
  EMPTY_FILTERS,
  type ControleFiltersState
} from './controle-filters';
import { ReembolsoControleCard } from './reembolso-controle-card';
import { StatusUpdateDialog } from './status-update-dialog';
import { Icons } from '@/components/icons';
import type { Reimbursement } from '@/types/api';

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const SUMMARY_CARDS = [
  {
    key: 'total' as const,
    label: 'Total solicitado',
    Icon: Icons.receipt,
    iconClass: 'text-muted-foreground',
    valueClass: ''
  },
  {
    key: 'approved' as const,
    label: 'Total aprovado',
    Icon: Icons.check,
    iconClass: 'text-emerald-500',
    valueClass: 'text-emerald-600 dark:text-emerald-400'
  },
  {
    key: 'pending' as const,
    label: 'Total pendente',
    Icon: Icons.clock,
    iconClass: 'text-amber-500',
    valueClass: 'text-amber-600 dark:text-amber-400'
  },
  {
    key: 'rejected' as const,
    label: 'Total recusado',
    Icon: Icons.close,
    iconClass: 'text-red-500',
    valueClass: 'text-red-600 dark:text-red-400'
  }
];

export function ControleView() {
  const { rank } = useUserProfile();
  const isPresidente = rank >= 4;

  const { data: reimbursements = [], isLoading: rLoading } = ReembolsosRepository.useAll();
  const { data: users = [], isLoading: uLoading } = UserRepository.useAll();
  const isLoading = rLoading || uLoading;

  const [filters, setFilters] = useState<ControleFiltersState>(EMPTY_FILTERS);

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
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        const inTitle = reimbursement.title.toLowerCase().includes(kw);
        const inDesc = reimbursement.description.toLowerCase().includes(kw);
        if (!inTitle && !inDesc) return false;
      }
      if (filters.sector && userSector !== filters.sector) return false;
      if (filters.role && userRole !== filters.role) return false;
      if (filters.status && reimbursement.status !== filters.status) return false;
      if (filters.dateFrom) {
        const created = new Date(reimbursement.created_at);
        const from = new Date(filters.dateFrom);
        if (created < from) return false;
      }
      if (filters.dateTo) {
        const created = new Date(reimbursement.created_at);
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (created > to) return false;
      }
      return true;
    });
  }, [enriched, filters]);

  const summary = useMemo(() => {
    let total = 0,
      approved = 0,
      pending = 0,
      rejected = 0;
    for (const { reimbursement } of filtered) {
      total += reimbursement.amount_cents;
      if (reimbursement.status === 'approved') approved += reimbursement.amount_cents;
      else if (reimbursement.status === 'pending') pending += reimbursement.amount_cents;
      else if (reimbursement.status === 'rejected') rejected += reimbursement.amount_cents;
    }
    return { total, approved, pending, rejected };
  }, [filtered]);

  const topUsers = useMemo(() => {
    const acc = new Map<string, { name: string; total: number }>();
    for (const { reimbursement, userName } of filtered) {
      if (reimbursement.status !== 'approved') continue;
      const cur = acc.get(reimbursement.user_id) ?? { name: userName, total: 0 };
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

  const activeFilterCount = countActiveFilters(filters);

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
    <div className='space-y-5'>
      {/* Filtros */}
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-base font-semibold'>Filtros</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant='secondary' className='text-xs tabular-nums'>
                {activeFilterCount}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className='pt-0'>
          <ControleFilters filters={filters} onChange={setFilters} />
        </CardContent>
      </Card>

      {/* Sumário */}
      <div className='grid gap-3 grid-cols-2 lg:grid-cols-4'>
        {SUMMARY_CARDS.map(({ key, label, Icon, iconClass, valueClass }) => (
          <Card key={key}>
            <CardContent className='p-4 sm:p-5'>
              {isLoading ? (
                <>
                  <Skeleton className='h-4 w-24 rounded' />
                  <Skeleton className='mt-3 h-7 w-32 rounded' />
                </>
              ) : (
                <>
                  <div className='flex items-center justify-between'>
                    <p className='text-muted-foreground text-xs sm:text-sm'>{label}</p>
                    <Icon className={`size-4 shrink-0 ${iconClass}`} />
                  </div>
                  <p className={`mt-2 text-xl sm:text-2xl font-bold tracking-tight ${valueClass}`}>
                    {formatBRL(summary[key])}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
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

      {/* Lista */}
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-base font-semibold'>Todas as Solicitações</CardTitle>
              {!isLoading && (
                <p className='text-muted-foreground mt-0.5 text-xs'>
                  {filtered.length} de {enriched.length}{' '}
                  {enriched.length !== 1 ? 'solicitações' : 'solicitação'}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className='pt-0'>
          {isLoading ? (
            <div className='space-y-3'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-28 w-full rounded-xl' />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
              <div className='bg-muted flex size-12 items-center justify-center rounded-full'>
                <Icons.receipt className='text-muted-foreground size-6' />
              </div>
              <div>
                <p className='text-sm font-medium'>Nenhuma solicitação encontrada</p>
                <p className='text-muted-foreground mt-0.5 text-xs'>
                  Tente ajustar os filtros aplicados
                </p>
              </div>
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
