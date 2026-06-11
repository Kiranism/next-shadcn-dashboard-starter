/**
 * @file: layout.tsx
 * @description: Layout проекта с защитой от зарезервированного id "new"
 * @project: SaaS Bonus System
 * @created: 2026-06-11
 * @author: AI Assistant + User
 */

import { redirect } from 'next/navigation';

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ProjectLayout({
  children,
  params
}: ProjectLayoutProps) {
  const { id } = await params;

  if (id === 'new') {
    redirect('/dashboard/projects?create=true');
  }

  return children;
}
