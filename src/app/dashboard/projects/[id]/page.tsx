/**
 * @file: page.tsx
 * @description: Страница проекта с редиректом на настройки
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

import { redirect } from 'next/navigation';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  // Редирект на страницу настроек проекта
  redirect(`/dashboard/projects/${id}/settings`);
}
