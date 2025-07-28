/**
 * @file: src/app/dashboard/projects/[id]/bonus-levels/page.tsx
 * @description: Страница управления уровнями бонусной программы
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, PageContainer
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { Metadata } from 'next';
import { BonusLevelsView } from '@/features/projects/components/bonus-levels-view';

export const metadata: Metadata = {
  title: 'Уровни бонусов - SaaS Bonus System',
  description: 'Настройка многоуровневой системы бонусов проекта'
};

interface BonusLevelsPageProps {
  params: Promise<{ id: string }>;
}

export default async function BonusLevelsPage({
  params
}: BonusLevelsPageProps) {
  const { id } = await params;

  return (
    <div className='p-6'>
      <BonusLevelsView projectId={id} />
    </div>
  );
}
