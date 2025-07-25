/**
 * @file: src/app/dashboard/projects/[id]/bot/page.tsx
 * @description: Страница настройки Telegram бота для проекта
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, PageContainer
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { Metadata } from 'next';
import PageContainer from '@/components/layout/page-container';
import { BotManagementView } from '@/features/bots/components/bot-management-view';

export const metadata: Metadata = {
  title: 'Настройка бота - SaaS Bonus System',
  description: 'Настройка и управление Telegram ботом проекта',
};

interface BotPageProps {
  params: Promise<{ id: string }>;
}

export default async function BotPage({ params }: BotPageProps) {
  const { id } = await params;
  
  return (
    <PageContainer scrollable={false}>
      <BotManagementView projectId={id} />
    </PageContainer>
  );
} 