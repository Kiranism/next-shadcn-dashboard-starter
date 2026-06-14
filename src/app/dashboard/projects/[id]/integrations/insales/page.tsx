/**
 * @file: page.tsx
 * @description: InSales Integration Settings
 * @project: SaaS Bonus System
 * @created: 2026-03-02
 * @author: AI Assistant
 */

import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Suspense } from 'react';
import { InSalesIntegrationForm } from './components/integration-form';
import { InSalesStatsCards } from './components/stats-cards';
import { InSalesWebhookLogs } from './components/webhook-logs';
import { InSalesCredentials } from './components/credentials';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Интеграция с InSales | Gupil',
  description: 'Настройка интеграции InSales для бонусной системы'
};

async function getIntegrationData(projectId: string) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/auth/login');
  }

  // Owner filter для мультитенантности
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      ownerId: admin.sub
    },
    select: {
      id: true,
      name: true,
      bonusBehavior: true,
      bonusExpiryDays: true,
      bonusPercentage: true
    }
  });

  if (!project) {
    redirect('/dashboard/projects');
  }

  const integration = await db.inSalesIntegration.findUnique({
    where: { projectId },
    select: {
      id: true,
      apiKey: true,
      shopDomain: true,
      webhookSecret: true,
      bonusPercent: true,
      maxBonusSpend: true,
      widgetEnabled: true,
      showProductBadges: true,
      isActive: true,
      lastWebhookAt: true,
      totalOrders: true,
      totalBonusAwarded: true,
      totalBonusSpent: true,
      createdAt: true,
      updatedAt: true
    }
  });

  // Статистика webhook логов
  const stats = integration
    ? await db.inSalesWebhookLog.aggregate({
        where: { integrationId: integration.id },
        _count: { id: true }
      })
    : null;

  const successCount = integration
    ? await db.inSalesWebhookLog.count({
        where: {
          integrationId: integration.id,
          success: true
        }
      })
    : 0;

  const errorCount = integration
    ? await db.inSalesWebhookLog.count({
        where: {
          integrationId: integration.id,
          success: false
        }
      })
    : 0;

  return {
    project,
    integration,
    stats: {
      totalWebhooks: stats?._count.id || 0,
      successWebhooks: successCount,
      errorWebhooks: errorCount,
      successRate: stats?._count.id
        ? ((successCount / stats._count.id) * 100).toFixed(1)
        : '0'
    }
  };
}

export default async function InSalesIntegrationPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const { project, integration, stats } = await getIntegrationData(projectId);

  return (
    <div className='flex flex-1 flex-col space-y-6 px-6 py-6'>
      {/* Breadcrumb */}
      <Link
        href={`/dashboard/projects/${projectId}/integrations`}
        className='text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors'
      >
        <ChevronLeft className='h-4 w-4' />
        Назад к интеграциям
      </Link>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <Heading
          title='Интеграция с InSales'
          description='Интеграция с InSales магазином через REST API и JavaScript виджет'
        />
      </div>

      <Separator className='my-4' />

      {/* Stats Cards */}
      {integration && (
        <Suspense fallback={<div>Загрузка статистики...</div>}>
          <InSalesStatsCards stats={stats} integration={integration} />
        </Suspense>
      )}

      {/* Credentials Section */}
      {integration && (
        <InSalesCredentials
          projectId={project.id}
          shopDomain={integration.shopDomain}
          webhookSecret={integration.webhookSecret}
          isActive={integration.isActive}
        />
      )}

      {/* Integration Form */}
      <InSalesIntegrationForm
        projectId={project.id}
        integration={integration}
        defaultBonusPercent={project.bonusPercentage.toNumber()}
      />

      {/* Webhook Logs */}
      {integration && (
        <Suspense fallback={<div>Загрузка логов...</div>}>
          <InSalesWebhookLogs projectId={project.id} />
        </Suspense>
      )}

      {/* Setup Instructions */}
      {!integration && (
        <div className='rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950'>
          <h3 className='mb-4 text-lg font-semibold text-blue-900 dark:text-blue-100'>
            📘 Инструкция по настройке InSales интеграции
          </h3>
          <ol className='list-inside list-decimal space-y-3 text-sm text-blue-800 dark:text-blue-200'>
            <li>
              <strong>Получите API credentials в InSales</strong>
              <ul className='mt-2 ml-6 list-inside list-disc space-y-1'>
                <li>Войдите в админ-панель InSales</li>
                <li>Перейдите в Настройки → API</li>
                <li>Создайте новый API ключ</li>
                <li>Скопируйте API Key и API Password</li>
              </ul>
            </li>
            <li>
              <strong>Активируйте интеграцию</strong> - заполните форму ниже и
              нажмите "Сохранить"
            </li>
            <li>
              <strong>Настройте webhooks в InSales</strong>
              <ul className='mt-2 ml-6 list-inside list-disc space-y-1'>
                <li>Перейдите в Настройки → Webhooks</li>
                <li>Добавьте webhook для события "Создание заказа"</li>
                <li>Добавьте webhook для события "Создание клиента"</li>
                <li>URL webhook будет показан после активации</li>
              </ul>
            </li>
            <li>
              <strong>Встройте виджет на сайт</strong>
              <ul className='mt-2 ml-6 list-inside list-disc space-y-1'>
                <li>Скопируйте код виджета из раздела "Credentials"</li>
                <li>
                  Вставьте код в тему InSales (перед закрывающим тегом
                  &lt;/body&gt;)
                </li>
                <li>Виджет автоматически отобразится на всех страницах</li>
              </ul>
            </li>
            <li>
              <strong>Протестируйте</strong> - создайте тестовый заказ и
              проверьте начисление бонусов
            </li>
          </ol>

          <div className='mt-4 rounded border border-blue-300 bg-white p-4 dark:border-blue-800 dark:bg-zinc-900'>
            <p className='mb-2 text-sm font-medium text-blue-900 dark:text-blue-100'>
              ℹ️ Как работает интеграция:
            </p>
            <ul className='list-inside list-disc space-y-1 text-xs text-blue-700 dark:text-blue-300'>
              <li>
                InSales отправляет webhooks при создании заказов и клиентов
              </li>
              <li>Наша система автоматически начисляет бонусы за покупки</li>
              <li>
                JavaScript виджет показывает баланс и позволяет применять бонусы
              </li>
              <li>Все операции логируются для мониторинга</li>
              <li>Поддерживается логика BonusBehavior проекта</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
