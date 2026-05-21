'use client';

import Link from 'next/link';
import { Plug, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface IntegrationsHubProps {
  projectId: string;
  data: {
    project: { id: string; name: string };
    moySklad: {
      id: string;
      isActive: boolean;
      accountId: string;
      lastSyncAt: Date | null;
    } | null;
    inSales: {
      id: string;
      isActive: boolean;
      shopDomain: string;
      lastWebhookAt: Date | null;
    } | null;
    tilda: { id: string } | null;
    maxBot?: {
      isConfigured: boolean;
      isRunning: boolean;
      maxBotUsername: string | null;
    } | null;
  };
}

interface IntegrationCardProps {
  icon: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'configured';
  statusLabel: string;
  secondaryText?: string;
  href: string;
}

function StatusBadge({
  status,
  label
}: {
  status: IntegrationCardProps['status'];
  label: string;
}) {
  if (status === 'connected') {
    return (
      <Badge
        variant='outline'
        className='border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
      >
        <CheckCircle2 className='mr-1 h-3 w-3' />
        {label}
      </Badge>
    );
  }
  if (status === 'configured') {
    return (
      <Badge
        variant='outline'
        className='border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
      >
        <CheckCircle2 className='mr-1 h-3 w-3' />
        {label}
      </Badge>
    );
  }
  return (
    <Badge
      variant='outline'
      className='border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
    >
      <XCircle className='mr-1 h-3 w-3' />
      {label}
    </Badge>
  );
}

function IntegrationCard({
  icon,
  name,
  description,
  status,
  statusLabel,
  secondaryText,
  href
}: IntegrationCardProps) {
  return (
    <Card className='group transition-shadow hover:shadow-md'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-3'>
            <div className='bg-muted flex h-12 w-12 items-center justify-center rounded-xl text-2xl'>
              {icon}
            </div>
            <div>
              <CardTitle className='text-lg'>{name}</CardTitle>
              <StatusBadge status={status} label={statusLabel} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <CardDescription className='text-sm leading-relaxed'>
          {description}
        </CardDescription>
        {secondaryText && (
          <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            <Clock className='h-3 w-3 shrink-0' />
            {secondaryText}
          </p>
        )}
        <Separator />
        <Link href={href}>
          <Button
            variant={status === 'disconnected' ? 'default' : 'outline'}
            className='mt-1 w-full'
            size='sm'
          >
            <ExternalLink className='mr-2 h-4 w-4' />
            {status === 'disconnected' ? 'Подключить' : 'Настроить'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function IntegrationsHub({ projectId, data }: IntegrationsHubProps) {
  const { moySklad, inSales, tilda, maxBot } = data;

  const integrations: IntegrationCardProps[] = [
    {
      icon: '🤖',
      name: 'MAX Bot',
      description:
        'Интеграция с мессенджером MAX. Запуск сценариев лояльности, регистрация пользователей и проверка баланса в экосистеме MAX.',
      status: maxBot?.isRunning
        ? 'connected'
        : maxBot?.isConfigured
          ? 'configured'
          : 'disconnected',
      statusLabel: maxBot?.isRunning
        ? 'Активен'
        : maxBot?.isConfigured
          ? 'Настроен'
          : 'Не настроен',
      secondaryText: maxBot?.maxBotUsername
        ? `Бот: @${maxBot.maxBotUsername}`
        : undefined,
      href: `/dashboard/projects/${projectId}/integrations/max-bot`
    },
    {
      icon: '🎨',
      name: 'Tilda',
      description:
        'Встройте виджет бонусной программы в ваш сайт на Tilda. Клиенты смогут видеть баланс, применять бонусы при оформлении заказа и регистрироваться в программе прямо на сайте.',
      status: tilda ? 'configured' : 'disconnected',
      statusLabel: tilda ? 'Настроена' : 'Не настроена',
      secondaryText: tilda ? 'Виджет настроен и готов к работе' : undefined,
      href: `/dashboard/projects/${projectId}/integration`
    },
    {
      icon: '🏪',
      name: 'МойСклад',
      description:
        'Прямая синхронизация клиентов и бонусных балансов с МойСклад. Изменения в МойСклад автоматически отражаются в бонусной системе, МойСклад является источником истины.',
      status: moySklad?.isActive
        ? 'connected'
        : moySklad
          ? 'configured'
          : 'disconnected',
      statusLabel: moySklad?.isActive
        ? 'Подключена'
        : moySklad
          ? 'Настраивается'
          : 'Не подключена',
      secondaryText: moySklad?.lastSyncAt
        ? `Последняя синхронизация: ${new Date(moySklad.lastSyncAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`
        : undefined,
      href: `/dashboard/projects/${projectId}/integrations/moysklad-direct`
    },
    {
      icon: '🛒',
      name: 'InSales',
      description:
        'Автоматическое начисление бонусов за заказы из InSales. Webhooks в реальном времени обрабатывают новые заказы, начисляют бонусы и ведут историю. Виджет на сайте позволяет тратить бонусы.',
      status: inSales?.isActive
        ? 'connected'
        : inSales
          ? 'configured'
          : 'disconnected',
      statusLabel: inSales?.isActive
        ? 'Подключена'
        : inSales
          ? 'Настраивается'
          : 'Не подключена',
      secondaryText: inSales?.lastWebhookAt
        ? `Последний webhook: ${new Date(inSales.lastWebhookAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`
        : inSales?.shopDomain
          ? `Магазин: ${inSales.shopDomain}`
          : undefined,
      href: `/dashboard/projects/${projectId}/integrations/insales`
    }
  ];

  const connectedCount = integrations.filter(
    (i) => i.status !== 'disconnected'
  ).length;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
            <Plug className='text-primary h-5 w-5' />
          </div>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Интеграции</h1>
            <p className='text-muted-foreground text-sm'>
              Подключите внешние системы для синхронизации данных и
              автоматизации
            </p>
          </div>
        </div>
        <Badge variant='secondary' className='text-sm'>
          {connectedCount} из {integrations.length} настроено
        </Badge>
      </div>

      <Separator />

      {/* Integration cards grid */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {integrations.map((integration) => (
          <IntegrationCard key={integration.name} {...integration} />
        ))}
      </div>
    </div>
  );
}
