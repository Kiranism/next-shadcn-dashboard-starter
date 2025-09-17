/**
 * @file: integration/page.tsx
 * @description: Страница интеграции с Tilda - генерация кода для встраивания
 * @project: SaaS Bonus System
 * @dependencies: Next.js, React
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import { Metadata } from 'next';
import { ProjectIntegrationView } from '@/features/projects/components/tilda-integration-view';

export const metadata: Metadata = {
  title: 'Интеграция с Tilda | SaaS Bonus System',
  description: 'Настройка интеграции бонусной системы с Tilda'
};

export default function ProjectIntegrationPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  return <ProjectIntegrationView params={params} />;
}