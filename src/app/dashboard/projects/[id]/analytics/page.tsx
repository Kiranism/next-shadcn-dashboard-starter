/**
 * @file: src/app/dashboard/projects/[id]/analytics/page.tsx
 * @description: Страница аналитики и статистики проекта
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, PageContainer, Charts
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { ProjectAnalyticsView } from '@/features/projects/components/project-analytics-view';

export const metadata: Metadata = {
  title: 'Аналитика проекта - SaaS Bonus System',
  description: 'Статистика, графики и аналитические данные проекта',
};

interface AnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { id } = await params;
  
  return (
    <PageContainer scrollable={true}>
      <div className="space-y-6 md:px-6">
        <ProjectAnalyticsView projectId={id} />
      </div>
    </PageContainer>
  );
} 