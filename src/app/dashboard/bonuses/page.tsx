/**
 * @file: page.tsx
 * @description: Главная страница управления бонусами с полным функционалом (Server Component)
 * @project: SaaS Bonus System
 * @created: 2026-01-21
 * @updated: 2026-01-21 (Full functional page)
 */

import { Suspense } from 'react';
import { getBonusesData } from './data-access';
import { BonusManagementClient } from './components/bonus-management-client';

export const metadata = {
  title: 'Управление бонусами | Gupil',
  description: 'Управление бонусной программой и пользователями'
};

export default async function BonusesPage() {
  const data = await getBonusesData();

  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <BonusManagementClient initialData={data} />
    </Suspense>
  );
}
