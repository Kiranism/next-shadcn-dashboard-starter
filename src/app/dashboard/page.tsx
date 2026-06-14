/**
 * @file: page.tsx
 * @description: Главная страница дашборда (Server Component)
 * @project: SaaS Bonus System
 * @created: 2025-01-31
 * @updated: 2026-01-17 (Refactoring to RSC & Premium UI)
 */

import { Suspense } from 'react';
import { getDashboardStats } from './data-access';
import { DashboardStats } from './components/dashboard-stats';
import { RecentProjects } from './components/recent-projects';
import { DashboardCharts } from './components/dashboard-charts';
import { QuickActions } from './components/quick-actions';
import { DashboardWelcome } from './components/dashboard-welcome';

export const metadata = {
  title: 'Дашборд | Gupil',
  description: 'Обзор системы бонусных программ'
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  if (stats.totalProjects === 0) {
    return <DashboardWelcome />;
  }

  return (
    <div className='flex flex-1 flex-col space-y-6 px-6 py-6'>
      <Suspense fallback={<div>Загрузка статистики...</div>}>
        <DashboardStats
          totalProjects={stats.totalProjects}
          totalUsers={stats.totalUsers}
          activeUsers={stats.activeUsers}
          activeBots={stats.activeBots}
          totalBonuses={stats.totalBonuses}
        />
      </Suspense>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-7'>
        <div className='col-span-1 lg:col-span-4'>
          <DashboardCharts
            data={stats.userGrowth}
            dataByDays={stats.userGrowthByDays}
            dataByWeeks={stats.userGrowthByWeeks}
          />
        </div>
        <div className='col-span-1 lg:col-span-3'>
          <QuickActions />
        </div>
      </div>

      <div className='grid grid-cols-1'>
        <RecentProjects projects={stats.recentProjects} />
      </div>
    </div>
  );
}
