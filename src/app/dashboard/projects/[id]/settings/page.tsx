/**
 * @file: src/app/dashboard/projects/[id]/settings/page.tsx
 * @description: Страница настроек проекта
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, PageContainer
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { Metadata } from 'next';
import { ProjectSettingsView } from '@/features/projects/components/project-settings-view';

export const metadata: Metadata = {
  title: 'Настройки проекта - SaaS Bonus System',
  description: 'Настройка и управление проектом бонусной системы'
};

interface SettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { id } = await params;

  return (
    <div className='p-6'>
      <ProjectSettingsView projectId={id} />
    </div>
  );
}
