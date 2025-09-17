/**
 * @file: bonus-levels/page.tsx
 * @description: Страница управления уровнями бонусной программы
 * @project: SaaS Bonus System
 * @dependencies: Next.js, React
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import { Metadata } from 'next';
import { PageContainer } from '@/components/page-container';
import { BonusLevelsManagement } from '@/features/bonuses/components/bonus-levels-management';

export const metadata: Metadata = {
  title: 'Уровни бонусов | SaaS Bonus System',
  description: 'Управление уровнями бонусной программы'
};

export default async function BonusLevelsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Уровни бонусов</h1>
          <p className="text-muted-foreground mt-2">
            Настройте многоуровневую систему с разными условиями для каждого уровня
          </p>
        </div>

        <BonusLevelsManagement projectId={id} />
      </div>
    </PageContainer>
  );
}