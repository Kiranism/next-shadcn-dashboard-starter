/**
 * @file: src/app/dashboard/projects/[id]/users/page.tsx
 * @description: Страница управления пользователями проекта
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, PageContainer
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { ProjectUsersView } from '@/features/projects/components/project-users-view';

export const metadata: Metadata = {
  title: 'Пользователи проекта - SaaS Bonus System',
  description: 'Управление пользователями и их бонусами',
};

interface UsersPageProps {
  params: Promise<{ id: string }>;
}

export default async function UsersPage({ params }: UsersPageProps) {
  const { id } = await params;
  
  return (
    <PageContainer scrollable={false}>
      <ProjectUsersView projectId={id} />
    </PageContainer>
  );
} 