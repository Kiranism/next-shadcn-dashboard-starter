/**
 * @file: logs/page.tsx
 * @description: Страница логов интеграции (webhook логи)
 * @project: SaaS Bonus System
 */

import { Metadata } from 'next';
import { ProjectLogsView } from '@/features/projects/components/project-logs-view';

export const metadata: Metadata = {
  title: 'Логи интеграции | SaaS Bonus System',
  description: 'Просмотр логов интеграции (webhook) по проекту'
};

export default function ProjectLogsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  return <ProjectLogsView params={params} />;
}
