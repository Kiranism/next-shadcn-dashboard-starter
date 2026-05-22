/**
 * @file: src/app/dashboard/projects/[id]/integrations/page.tsx
 * @description: Хаб страница всех интеграций проекта
 * @project: SaaS Bonus System
 * @created: 2026-03-11
 */

import { Metadata } from 'next';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { IntegrationsHub } from './components/integrations-hub';

export const metadata: Metadata = {
  title: 'Интеграции | Gupil',
  description: 'Управление интеграциями бонусной системы'
};

async function getIntegrationStatuses(projectId: string) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/auth/login');

  const project = await db.project.findFirst({
    where: { id: projectId, ownerId: admin.sub },
    select: {
      id: true,
      name: true,
      maxBotToken: true,
      maxBotUsername: true
    }
  });

  if (!project) redirect('/dashboard/projects');

  // Проверяем статус МойСклад
  const moySkladIntegration = await db.moySkladDirectIntegration
    .findUnique({
      where: { projectId },
      select: { id: true, isActive: true, lastSyncAt: true, accountId: true }
    })
    .catch(() => null);

  // Проверяем статус InSales
  const inSalesIntegration = await db.inSalesIntegration
    .findUnique({
      where: { projectId },
      select: {
        id: true,
        isActive: true,
        shopDomain: true,
        lastWebhookAt: true
      }
    })
    .catch(() => null);

  // Tilda — всегда доступна (настраивается через виджет)
  const widgetSettings = await db.widgetSettings
    .findUnique({
      where: { projectId },
      select: { id: true }
    })
    .catch(() => null);

  // Проверяем настройки Telegram бота
  const telegramSettings = await db.botSettings
    .findUnique({
      where: { projectId },
      select: { botToken: true, botUsername: true, isActive: true }
    })
    .catch(() => null);

  // Проверяем, запущен ли Telegram бот
  let isTelegramBotRunning = false;
  if (telegramSettings?.botToken && telegramSettings.isActive) {
    try {
      const { botManager } = await import('@/lib/telegram/bot-manager');
      const instance = botManager.getBot(projectId);
      isTelegramBotRunning = !!instance?.isActive;
    } catch {
      // Игнорируем
    }
  }

  // Проверяем, запущен ли MAX бот
  let isMaxBotRunning = false;
  if (project?.maxBotToken) {
    try {
      const { maxBotManager } = await import('@/lib/max-bot/bot-manager');
      const instance = maxBotManager.getBot(projectId);
      isMaxBotRunning = !!instance?.isActive;
    } catch {
      // Игнорируем
    }
  }

  return {
    project,
    moySklad: moySkladIntegration,
    inSales: inSalesIntegration,
    tilda: widgetSettings,
    telegramBot: {
      isConfigured: !!telegramSettings?.botToken,
      isRunning: isTelegramBotRunning,
      botUsername: telegramSettings?.botUsername || null,
      isActive: telegramSettings?.isActive ?? false
    },
    maxBot: {
      isConfigured: !!project?.maxBotToken,
      isRunning: isMaxBotRunning,
      maxBotUsername: project?.maxBotUsername || null
    }
  };
}

export default async function IntegrationsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const data = await getIntegrationStatuses(projectId);

  return (
    <div className='flex flex-1 flex-col space-y-6 px-6 py-6'>
      <IntegrationsHub projectId={projectId} data={data} />
    </div>
  );
}
