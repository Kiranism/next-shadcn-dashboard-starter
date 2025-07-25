/**
 * @file: src/app/dashboard/projects/page.tsx
 * @description: Страница управления проектами в Admin Dashboard
 * @project: SaaS Bonus System
 * @dependencies: Next.js, React, ProjectsView
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { ProjectsView } from '@/features/projects/components/projects-view-page';

export const metadata: Metadata = {
  title: 'Проекты - SaaS Bonus System',
  description: 'Управление проектами бонусной системы',
};

export default function ProjectsPage() {
  return (
    <PageContainer scrollable={false}>
      <ProjectsView />
    </PageContainer>
  );
} 