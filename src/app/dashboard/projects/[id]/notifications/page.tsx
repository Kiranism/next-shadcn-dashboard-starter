/**
 * @file: notifications/page.tsx
 * @description: Страница уведомлений проекта
 * @project: Gupil.ru - SaaS Bonus System
 * @dependencies: @/features/projects/components/notifications-view
 * @created: 2024-09-11
 * @author: AI Assistant + User
 */

import NotificationsView from '@/features/projects/components/notifications-view';

interface NotificationsPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Уведомления - Gupil.ru'
};

export default async function NotificationsPage({
  params
}: NotificationsPageProps) {
  const { id } = await params;

  return <NotificationsView projectId={id} />;
}
