/**
 * @file: page.tsx
 * @description: МойСклад Loyalty API Integration Settings
 * @project: SaaS Bonus System
 * @created: 2026-03-02
 * @author: AI Assistant
 *
 * Архитектура: МЫ являемся API provider, МойСклад вызывает НАШИ endpoints
 */

import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Suspense } from 'react';
import { MoySkladIntegrationForm } from './components/integration-form';
import { MoySkladStatsCards } from './components/stats-cards';
import { MoySkladApiLogs } from './components/api-logs';
import { MoySkladCredentials } from './components/credentials';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'МойСклад (Loyalty API) | Gupil',
  description: 'Настройка интеграции с МойСклад через Loyalty API Provider'
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
      bonusExpiryDays: true
    }
  });

  if (!project) {
    redirect('/dashboard/projects');
  }

  const integration = await db.moySkladIntegration.findUnique({
    where: { projectId },
    select: {
      id: true,
      authToken: true,
      baseUrl: true,
      bonusPercentage: true,
      maxBonusSpend: true,
      isActive: true,
      lastRequestAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  // Статистика API запросов
  const stats = integration
    ? await db.moySkladApiLog.aggregate({
        where: { integrationId: integration.id },
        _count: { id: true },
        _avg: { processingTimeMs: true }
      })
    : null;

  const successCount = integration
    ? await db.moySkladApiLog.count({
        where: {
          integrationId: integration.id,
          responseStatus: { gte: 200, lt: 300 }
        }
      })
    : 0;

  const errorCount = integration
    ? await db.moySkladApiLog.count({
        where: {
          integrationId: integration.id,
          responseStatus: { gte: 400 }
        }
      })
    : 0;

  return {
    project,
    integration,
    stats: {
      totalRequests: stats?._count.id || 0,
      successRequests: successCount,
      errorRequests: errorCount,
      avgProcessingTime: stats?._avg.processingTimeMs || 0,
      successRate: stats?._count.id
        ? ((successCount / stats._count.id) * 100).toFixed(1)
        : '0'
    }
  };
}

export default async function MoySkladIntegrationPage({
  params
}: {
  params: { id: string };
}) {
  const { project, integration, stats } = await getIntegrationData(params.id);

  return (
    <div className='flex flex-1 flex-col space-y-6 px-6 py-6'>
      {/* Breadcrumb */}
      <Link
        href={`/dashboard/projects/${params.id}/integrations`}
        className='text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors'
      >
        <ChevronLeft className='h-4 w-4' />
        Назад к интеграциям
      </Link>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <Heading
          title='МойСклад (Loyalty API)'
          description='Интеграция с МойСклад через Loyalty API Provider'
        />
      </div>

      <Separator className='my-4' />

      {/* Stats Cards */}
      {integration && (
        <Suspense fallback={<div>Загрузка статистики...</div>}>
          <MoySkladStatsCards
            stats={stats}
            isActive={integration.isActive}
            lastRequestAt={integration.lastRequestAt}
          />
        </Suspense>
      )}

      {/* Credentials Section */}
      {integration && (
        <MoySkladCredentials
          projectId={project.id}
          baseUrl={integration.baseUrl}
          isActive={integration.isActive}
        />
      )}

      {/* Integration Form */}
      <MoySkladIntegrationForm
        projectId={project.id}
        integration={integration}
        bonusBehavior={project.bonusBehavior}
      />

      {/* API Logs */}
      {integration && (
        <Suspense fallback={<div>Загрузка логов...</div>}>
          <MoySkladApiLogs integrationId={integration.id} />
        </Suspense>
      )}

      {/* Setup Instructions */}
      {!integration && (
        <div className='rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950'>
          <h3 className='mb-4 text-lg font-semibold text-blue-900 dark:text-blue-100'>
            📘 Инструкция по настройке
          </h3>
          <ol className='list-inside list-decimal space-y-3 text-sm text-blue-800 dark:text-blue-200'>
            <li>
              <strong>Активируйте интеграцию</strong> - заполните форму ниже и
              нажмите "Активировать"
            </li>
            <li>
              <strong>Скопируйте credentials</strong> - после активации вы
              получите Auth Token и Base URL
            </li>
            <li>
              <strong>Установите решение в МойСклад</strong> - перейдите в
              маркетплейс МойСклад и установите наше решение
            </li>
            <li>
              <strong>Настройте интеграцию</strong> - введите Auth Token и Base
              URL в настройках решения в МойСклад
            </li>
            <li>
              <strong>Протестируйте</strong> - создайте тестовую продажу в
              МойСклад и проверьте начисление бонусов
            </li>
          </ol>

          <div className='mt-4 rounded border border-blue-300 bg-white p-4 dark:border-blue-800 dark:bg-zinc-900'>
            <p className='mb-2 text-sm font-medium text-blue-900 dark:text-blue-100'>
              ℹ️ Важно понимать:
            </p>
            <ul className='list-inside list-disc space-y-1 text-xs text-blue-700 dark:text-blue-300'>
              <li>МойСклад вызывает НАШИ endpoints (мы - API provider)</li>
              <li>Мы рассчитываем скидки и бонусы в реальном времени</li>
              <li>Не требуется синхронизация данных между системами</li>
              <li>Все операции логируются для мониторинга</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
