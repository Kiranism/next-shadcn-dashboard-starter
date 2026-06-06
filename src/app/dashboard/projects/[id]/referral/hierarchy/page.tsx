/**
 * @file: page.tsx
 * @description: Server Component — страница «Иерархия партнёров».
 *               (b2b-referral-hierarchy Phase 6.7, 6.10, 6.14)
 *
 *               Показывает дерево партнёров проекта с агрегатами по
 *               выбранному периоду. Если b2b-режим выключен — показывает
 *               пустое состояние с CTA на settings page.
 *
 * @project: SaaS Bonus System
 * @dependencies: getCurrentAdmin, ProjectService, getHierarchyTreeSafe,
 *                HierarchyTree (Client)
 * @created: 2026-05-24
 * @author: AI Assistant + User
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Settings, Users } from 'lucide-react';

import { getCurrentAdmin } from '@/lib/auth';
import { ProjectService } from '@/lib/services/project.service';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/composite';
import { HierarchyTree } from '@/features/projects/components/hierarchy-tree';
import { getHierarchyTreeSafe, type HierarchyPeriod } from './data-access';

export const metadata: Metadata = {
  title: 'Иерархия партнёров | Gupil',
  description:
    'Визуализация партнёрского дерева, агрегаты по периодам, CSV-экспорт.'
};

const VALID_PERIODS: HierarchyPeriod[] = ['today', '7d', '30d', 'all'];

const formatRub = (n: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(n);

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    period?: string;
    search?: string;
    organizationId?: string;
  }>;
}

export default async function HierarchyPage({
  params,
  searchParams
}: PageProps) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/auth/login');

  const { id } = await params;
  const sp = await searchParams;

  // Доступ к проекту — обязательно. ProjectService.verifyProjectAccess
  // бросает FORBIDDEN если проект не принадлежит админу.
  try {
    await ProjectService.verifyProjectAccess(id, admin.sub);
  } catch {
    redirect('/dashboard/projects');
  }

  const periodParam = (sp.period ?? '30d') as HierarchyPeriod;
  const period: HierarchyPeriod = VALID_PERIODS.includes(periodParam)
    ? periodParam
    : '30d';

  const tree = await getHierarchyTreeSafe(id, {
    period,
    search: sp.search,
    organizationId: sp.organizationId || null
  });

  return (
    <div className='flex flex-1 flex-col space-y-6 px-6 py-6'>
      <div className='flex items-center justify-between'>
        <Heading
          title='Иерархия партнёров'
          description='Карта вашей сети тренеров, менеджеров и руководителей с агрегатами по периодам.'
        />
        <div className='flex gap-2'>
          <Link href={`/dashboard/projects/${id}/referral`}>
            <Button variant='outline' size='sm'>
              К реферальной программе
            </Button>
          </Link>
          <Link href={`/dashboard/projects/${id}/settings`}>
            <Button variant='ghost' size='sm' className='gap-2'>
              <Settings className='h-4 w-4' />
              Настройки
            </Button>
          </Link>
        </div>
      </div>
      <Separator className='my-2' />

      {!tree.enablePartnerRoles ? (
        <EmptyState
          icon={Users}
          title='B2B-иерархия не включена'
          description='Чтобы построить дерево партнёров, активируйте режим в настройках проекта. После включения станут доступны роли (тренер/менеджер/руководитель), фильтрация реферальных ссылок и эта страница.'
          action={
            <Link href={`/dashboard/projects/${id}/settings`}>
              <Button className='gap-2'>
                <Settings className='h-4 w-4' />
                Включить в настройках
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Stats summary */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
            <SummaryCard
              label='Всего в дереве'
              value={tree.totals.members}
              accent='zinc'
            />
            <SummaryCard
              label='Тренеры'
              value={tree.totals.trainers}
              accent='blue'
            />
            <SummaryCard
              label='Менеджеры'
              value={tree.totals.managers}
              accent='purple'
            />
            <SummaryCard
              label='Руководители'
              value={tree.totals.directors}
              accent='amber'
            />
            <SummaryCard
              label='Вознаграждение за период'
              value={formatRub(tree.totals.commissionTotal)}
              accent='emerald'
            />
          </div>

          <HierarchyTree
            projectId={id}
            nodes={tree.nodes}
            rootIds={tree.rootIds}
            period={period}
          />
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent
}: {
  label: string;
  value: number | string;
  accent: 'zinc' | 'blue' | 'purple' | 'amber' | 'emerald';
}) {
  const accentClass: Record<typeof accent, string> = {
    zinc: 'border-zinc-200 dark:border-zinc-800',
    blue: 'border-blue-200 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20',
    purple:
      'border-purple-200 bg-purple-50/50 dark:border-purple-900/40 dark:bg-purple-950/20',
    amber:
      'border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20',
    emerald:
      'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
  };
  return (
    <div className={`glass-card rounded-xl border p-4 ${accentClass[accent]}`}>
      <div className='text-muted-foreground text-xs font-medium uppercase'>
        {label}
      </div>
      <div className='mt-2 text-2xl font-semibold'>{value}</div>
    </div>
  );
}
