/**
 * @file: referral-program-sidebar.tsx
 * @description: Контекстная боковая панель реферальной программы — меняется по активной вкладке
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Gift,
  Network,
  Share2,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import type { Project, ReferralProgram, ReferralStats } from '@/types/bonus';
import { getReferralLinkExample } from '@/lib/utils/referral-link';

interface ReferralProgramSidebarProps {
  projectId: string;
  activeTab: string;
  project: Project | null;
  referralProgram: ReferralProgram | null;
  enablePartnerRoles: boolean;
}

export function ReferralProgramSidebar({
  projectId,
  activeTab,
  project,
  referralProgram,
  enablePartnerRoles
}: ReferralProgramSidebarProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null);

  useEffect(() => {
    if (activeTab !== 'stats') return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/projects/${projectId}/referral-program/stats?period=month`
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, activeTab]);

  if (activeTab === 'stats') {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>За месяц</CardTitle>
            <CardDescription>
              Ключевые показатели реферальной программы
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <SidebarMetric
              icon={<Users className='h-4 w-4 text-blue-600' />}
              label='Новых рефералов'
              value={stats ? String(stats.periodReferrals) : '—'}
            />
            <SidebarMetric
              icon={<Gift className='h-4 w-4 text-green-600' />}
              label='Выплачено бонусов'
              value={
                stats
                  ? `${Number(stats.periodBonusPaid).toLocaleString('ru-RU')} ₽`
                  : '—'
              }
            />
            <SidebarMetric
              icon={<TrendingUp className='h-4 w-4 text-purple-600' />}
              label='Активных рефереров'
              value={stats ? String(stats.activeReferrers) : '—'}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Всего за всё время</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <SidebarMetric
              icon={<Users className='h-4 w-4 text-blue-600' />}
              label='Рефералов'
              value={stats ? String(stats.totalReferrals) : '—'}
            />
            <SidebarMetric
              icon={<Gift className='h-4 w-4 text-green-600' />}
              label='Бонусов выплачено'
              value={
                stats
                  ? `${Number(stats.totalBonusPaid).toLocaleString('ru-RU')} ₽`
                  : '—'
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === 'plans') {
    if (enablePartnerRoles) {
      return (
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>
                Как начисляются комиссии
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              <div className='rounded-md border px-3 py-2'>
                <p className='font-medium'>L1 — тренер</p>
                <p className='text-muted-foreground text-xs'>
                  % с покупки своего клиента
                </p>
              </div>
              <div className='rounded-md border px-3 py-2'>
                <p className='font-medium'>L2 — менеджер</p>
                <p className='text-muted-foreground text-xs'>
                  % с покупки клиента тренера из его команды
                </p>
              </div>
              <div className='rounded-md border px-3 py-2'>
                <p className='font-medium'>L3 — директор</p>
                <p className='text-muted-foreground text-xs'>
                  % с покупки в своей сети (организации)
                </p>
              </div>
              <p className='text-muted-foreground text-xs'>
                Приоритет плана: персональный → план организации → план по
                умолчанию
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Организации и ссылки</CardTitle>
              <CardDescription>
                Организация — это не отдельная программа, а группа партнёров с
                общим планом
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              <p className='text-muted-foreground'>
                В одной ссылке могут быть оба параметра:{' '}
                <code className='text-xs'>utm_ref</code> (кто пригласил) и{' '}
                <code className='text-xs'>utm_org</code> (какая сеть). Они
                работают вместе.
              </p>
              <div className='flex flex-col gap-2'>
                <Button variant='outline' size='sm' asChild>
                  <Link
                    href={`/dashboard/projects/${projectId}/referral/organizations`}
                  >
                    <Building2 className='mr-2 h-4 w-4' />
                    Управление организациями
                  </Link>
                </Button>
                <Button variant='outline' size='sm' asChild>
                  <Link
                    href={`/dashboard/projects/${projectId}/referral/hierarchy`}
                  >
                    <Network className='mr-2 h-4 w-4' />
                    Иерархия партнёров
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Бонусы клиентам</CardTitle>
            </CardHeader>
            <CardContent className='text-muted-foreground text-sm'>
              Приветственные бонусы и скидки настраиваются на вкладке{' '}
              <strong>«Настройки»</strong> и начисляются клиентам независимо от
              комиссий партнёрам.
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Персональные планы</CardTitle>
          </CardHeader>
          <CardContent className='text-muted-foreground space-y-2 text-sm'>
            <p>
              Включите переключатель «Персональные планы», чтобы назначать
              разные проценты отдельным партнёрам.
            </p>
            <p>
              Без включения используются уровни из вкладки «Настройки» для всех
              рефералов одинаково.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>О программе</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div>
            <label className='text-sm font-medium'>Статус</label>
            <p className='text-muted-foreground text-sm'>
              {referralProgram?.isActive ? 'Активна' : 'Неактивна'}
            </p>
          </div>
          <div>
            <label className='text-sm font-medium'>Бонус новому клиенту</label>
            <p className='text-muted-foreground text-sm'>
              {referralProgram?.refereeBonus || 0}%
            </p>
          </div>
          <div>
            <label className='text-sm font-medium'>
              Приветственное вознаграждение
            </label>
            <p className='text-muted-foreground text-sm'>
              {referralProgram?.welcomeRewardType === 'DISCOUNT' ? (
                <>
                  Скидка {referralProgram?.firstPurchaseDiscountPercent || 0}%
                  на первую покупку
                </>
              ) : (
                <>
                  {Number(referralProgram?.welcomeBonus || 0).toLocaleString(
                    'ru-RU'
                  )}{' '}
                  бонусов
                </>
              )}
            </p>
          </div>
          <div>
            <label className='text-sm font-medium'>Мин. сумма заказа</label>
            <p className='text-muted-foreground text-sm'>
              {Number(referralProgram?.minPurchaseAmount || 0).toLocaleString(
                'ru-RU'
              )}{' '}
              ₽
            </p>
          </div>
          <div>
            <label className='text-sm font-medium'>Отслеживание ссылки</label>
            <p className='text-muted-foreground text-sm'>
              {referralProgram?.cookieLifetime || 0} дней
            </p>
          </div>
          {enablePartnerRoles && (
            <div className='rounded-md border border-amber-200/80 bg-amber-50/50 p-2 dark:border-amber-900/40 dark:bg-amber-950/20'>
              <p className='text-xs'>
                Уровни ниже — legacy для c2c-рефералов. Комиссии партнёрам
                настраиваются на вкладке «Комиссии».
              </p>
            </div>
          )}
          <div>
            <label className='text-sm font-medium'>
              {enablePartnerRoles ? 'Уровни (legacy)' : 'Уровни'}
            </label>
            <div className='mt-2 space-y-2'>
              {(referralProgram?.levels || []).length > 0 ? (
                referralProgram?.levels
                  ?.slice()
                  .sort((a, b) => a.level - b.level)
                  .map((level) => (
                    <div
                      key={level.id}
                      className='flex items-center justify-between rounded border px-2 py-1 text-sm'
                    >
                      <span>Уровень {level.level}</span>
                      <span className='font-semibold'>
                        {Number(level.percent)}%
                      </span>
                    </div>
                  ))
              ) : (
                <p className='text-muted-foreground text-sm'>
                  Уровни не настроены
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Как это работает</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div className='flex items-start space-x-2'>
            <Share2 className='mt-0.5 h-4 w-4 shrink-0 text-blue-600' />
            <div>
              <p className='font-medium'>Реферальная ссылка</p>
              <p className='text-muted-foreground'>
                Партнёр делится ссылкой с utm_ref — система запоминает, кто
                пригласил клиента
              </p>
            </div>
          </div>
          <div className='flex items-start space-x-2'>
            <Gift className='mt-0.5 h-4 w-4 shrink-0 text-green-600' />
            <div>
              <p className='font-medium'>Бонусы клиенту</p>
              <p className='text-muted-foreground'>
                Начисление при регистрации и первой покупке по правилам выше
              </p>
            </div>
          </div>
          {enablePartnerRoles && (
            <div className='flex items-start space-x-2'>
              <Target className='mt-0.5 h-4 w-4 shrink-0 text-purple-600' />
              <div>
                <p className='font-medium'>Комиссии партнёрам</p>
                <p className='text-muted-foreground'>
                  Отдельно на вкладке «Комиссии» — не путать с бонусами клиенту
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Формат ссылки</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          <code className='bg-muted block rounded px-2 py-1 text-xs break-all'>
            {getReferralLinkExample(project?.domain)}
            {enablePartnerRoles && '&utm_org=slug-сети'}
          </code>
          {enablePartnerRoles && (
            <p className='text-muted-foreground text-xs'>
              <Badge variant='outline' className='mr-1'>
                utm_org
              </Badge>
              добавляется автоматически для ссылок организации
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SidebarMetric({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center space-x-2'>
        {icon}
        <span className='text-sm'>{label}</span>
      </div>
      <span className='font-semibold'>{value}</span>
    </div>
  );
}
