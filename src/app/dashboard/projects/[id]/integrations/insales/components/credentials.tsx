'use client';

/**
 * @file: credentials.tsx
 * @description: InSales Integration Credentials Display
 * @project: SaaS Bonus System
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Eye, EyeOff, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InSalesCredentialsProps {
  projectId: string;
  shopDomain: string;
  webhookSecret: string;
  isActive: boolean;
}

export function InSalesCredentials({
  projectId,
  shopDomain,
  webhookSecret,
  isActive
}: InSalesCredentialsProps) {
  const { toast } = useToast();
  const [showSecret, setShowSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://gupil.ru'}/api/insales/webhook/${projectId}`;
  const widgetCode = `<!-- InSales Bonus Widget -->
<script 
  src="${process.env.NEXT_PUBLIC_APP_URL || 'https://gupil.ru'}/insales-widget-loader.js" 
  data-project-id="${projectId}"
></script>`;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: 'Скопировано',
        description: 'Текст скопирован в буфер обмена'
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось скопировать',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className='space-y-4'>
      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Code className='h-5 w-5' />
            Настройка Webhooks в InSales
          </CardTitle>
          <CardDescription>
            Используйте эти данные для настройки webhooks в админ-панели InSales
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Webhook URL */}
          <div className='space-y-2'>
            <label
              htmlFor='insales-webhook-url'
              className='text-sm font-medium'
            >
              Webhook URL
            </label>
            <div className='flex gap-2'>
              <input
                id='insales-webhook-url'
                type='text'
                value={webhookUrl}
                readOnly
                className='flex-1 rounded-md border bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900'
              />
              <Button
                size='sm'
                variant='outline'
                aria-label='Скопировать Webhook URL'
                onClick={() => copyToClipboard(webhookUrl, 'webhook')}
              >
                {copiedField === 'webhook' ? (
                  <Check className='h-4 w-4' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
            <p className='text-xs text-zinc-500'>
              Добавьте этот URL для событий: orders/create, clients/create
            </p>
          </div>

          {/* Webhook Secret */}
          <div className='space-y-2'>
            <label
              htmlFor='insales-webhook-secret'
              className='text-sm font-medium'
            >
              Webhook Secret
            </label>
            <div className='flex gap-2'>
              <input
                id='insales-webhook-secret'
                type={showSecret ? 'text' : 'password'}
                value={webhookSecret}
                readOnly
                className='flex-1 rounded-md border bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900'
              />
              <Button
                size='sm'
                variant='outline'
                aria-label={showSecret ? 'Скрыть секрет' : 'Показать секрет'}
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </Button>
              <Button
                size='sm'
                variant='outline'
                aria-label='Скопировать Webhook Secret'
                onClick={() => copyToClipboard(webhookSecret, 'secret')}
              >
                {copiedField === 'secret' ? (
                  <Check className='h-4 w-4' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
            <p className='text-xs text-zinc-500'>
              Используйте для подписи webhooks (опционально)
            </p>
          </div>

          {/* Shop Domain */}
          <div className='space-y-2'>
            <label
              htmlFor='insales-shop-domain'
              className='text-sm font-medium'
            >
              Домен магазина
            </label>
            <div className='flex gap-2'>
              <input
                id='insales-shop-domain'
                type='text'
                value={shopDomain}
                readOnly
                className='flex-1 rounded-md border bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900'
              />
              <Button
                size='sm'
                variant='outline'
                aria-label='Скопировать домен магазина'
                onClick={() => copyToClipboard(shopDomain, 'domain')}
              >
                {copiedField === 'domain' ? (
                  <Check className='h-4 w-4' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Widget Code */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Code className='h-5 w-5' />
            Код виджета для сайта
          </CardTitle>
          <CardDescription>
            Вставьте этот код в тему InSales перед закрывающим тегом
            &lt;/body&gt;
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium'>HTML код</label>
              <Button
                size='sm'
                variant='outline'
                onClick={() => copyToClipboard(widgetCode, 'widget')}
              >
                {copiedField === 'widget' ? (
                  <>
                    <Check className='mr-2 h-4 w-4' />
                    Скопировано
                  </>
                ) : (
                  <>
                    <Copy className='mr-2 h-4 w-4' />
                    Копировать
                  </>
                )}
              </Button>
            </div>
            <pre className='overflow-x-auto rounded-md border bg-zinc-50 p-4 text-xs dark:bg-zinc-900'>
              <code>{widgetCode}</code>
            </pre>
          </div>

          <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950'>
            <p className='mb-2 text-sm font-medium text-amber-900 dark:text-amber-100'>
              💡 Где вставить код:
            </p>
            <ol className='list-inside list-decimal space-y-1 text-xs text-amber-800 dark:text-amber-200'>
              <li>Войдите в админ-панель InSales</li>
              <li>Перейдите в Дизайн → Редактор тем</li>
              <li>Откройте файл layout.liquid или theme.liquid</li>
              <li>Найдите закрывающий тег &lt;/body&gt;</li>
              <li>Вставьте код виджета ПЕРЕД этим тегом</li>
              <li>Сохраните изменения</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Status Warning */}
      {!isActive && (
        <Card className='border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'>
          <CardContent className='pt-6'>
            <p className='text-sm font-medium text-red-900 dark:text-red-100'>
              ⚠️ Интеграция неактивна
            </p>
            <p className='mt-1 text-xs text-red-800 dark:text-red-200'>
              Включите интеграцию в настройках ниже, чтобы начать получать
              webhooks
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
