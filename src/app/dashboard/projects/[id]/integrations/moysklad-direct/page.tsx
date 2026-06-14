/**
 * @file: page.tsx
 * @description: МойСклад Direct integration settings page
 * @project: SaaS Bonus System
 * @dependencies: Next.js 15, React 19
 * @created: 2026-03-06
 * @author: AI Assistant + User
 */

import { Suspense } from 'react';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { getIntegrationPageData } from './data-access';
import { IntegrationStatusCard } from './components/status-card';
import { IntegrationForm } from './components/integration-form';
import { WebhookCredentials } from './components/webhook-credentials';
import { WebhookManager } from './components/webhook-manager';
import { SyncStatsCards } from './components/stats-cards';
import { SyncLogsTable } from './components/sync-logs-table';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'МойСклад (Direct API) | Gupil',
  description:
    'Настройка прямой интеграции с МойСклад для синхронизации бонусов'
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    page?: string;
  }>;
}

export default async function MoySkladDirectIntegrationPage({
  params,
  searchParams
}: PageProps) {
  const { id } = await params;
  const pageParam = searchParams ? (await searchParams).page : undefined;
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const data = await getIntegrationPageData(id, isNaN(page) ? 1 : page);

  return (
    <div className='flex flex-1 flex-col space-y-6 px-6 py-6'>
      {/* Breadcrumb */}
      <Link
        href={`/dashboard/projects/${id}/integrations`}
        className='text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors'
      >
        <ChevronLeft className='h-4 w-4' />
        Назад к интеграциям
      </Link>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <Heading
          title='МойСклад (Direct API)'
          description='Прямая интеграция с МойСклад для синхронизации бонусов между онлайн и офлайн каналами'
        />
      </div>

      <Separator className='my-4' />

      {/* Status Card */}
      {data.integration && (
        <Suspense fallback={<div>Загрузка статуса...</div>}>
          <IntegrationStatusCard
            integration={data.integration}
            projectId={id}
          />
        </Suspense>
      )}

      {/* Stats Cards */}
      {data.integration && (
        <Suspense fallback={<div>Загрузка статистики...</div>}>
          <SyncStatsCards stats={data.stats as any} />
        </Suspense>
      )}

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Integration Form */}
        <div className='col-span-1'>
          <IntegrationForm integration={data.integration} projectId={id} />
        </div>

        {/* Webhook Credentials */}
        <div className='col-span-1'>
          <WebhookCredentials
            webhookUrl={data.webhookUrl}
            webhookSecret={data.integration?.webhookSecret || null}
          />
        </div>
      </div>

      {/* Webhook Manager */}
      {data.integration && (
        <div className='grid grid-cols-1'>
          <WebhookManager projectId={id} />
        </div>
      )}

      {/* Recent Sync Logs */}
      {data.integration && (
        <div className='grid grid-cols-1'>
          <SyncLogsTable
            logs={data.recentLogs}
            pagination={data.pagination}
            integrationId={data.integration.id}
            projectId={id}
          />
        </div>
      )}
    </div>
  );
}
