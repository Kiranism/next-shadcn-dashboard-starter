/**
 * @file: src/app/super-admin/errors/page.tsx
 * @description: Страница мониторинга ошибок и логов
 * @project: SaaS Bonus System
 * @created: 2025-01-30
 * @author: AI Assistant
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { ErrorsTable } from '@/components/super-admin/errors-table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminErrorsPage() {
  const grafanaUrl = process.env.NEXT_PUBLIC_GRAFANA_URL?.trim();

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Мониторинг ошибок
          </h1>
          <p className='text-muted-foreground'>
            Просмотр системных логов и ошибок
          </p>
        </div>
        {grafanaUrl ? (
          <Button asChild variant='outline' className='shrink-0'>
            <Link href={grafanaUrl} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='mr-2 h-4 w-4' />
              Открыть Grafana
            </Link>
          </Button>
        ) : (
          <Button variant='outline' className='shrink-0' disabled>
            <ExternalLink className='mr-2 h-4 w-4' />
            Grafana не настроена
          </Button>
        )}
      </div>

      {!grafanaUrl && (
        <Alert>
          <AlertTitle>Ссылка на Grafana не задана</AlertTitle>
          <AlertDescription className='space-y-2'>
            <p>
              Укажите публичный URL вашей Grafana в переменной окружения{' '}
              <code className='bg-muted rounded px-1 py-0.5 text-sm'>
                NEXT_PUBLIC_GRAFANA_URL
              </code>{' '}
              (например{' '}
              <code className='bg-muted rounded px-1 py-0.5 text-sm'>
                https://grafana.example.com
              </code>
              ). Раньше по умолчанию использовался порт 3000 — он совпадает с
              Next.js, поэтому кнопка вела на само приложение, а не на Grafana.
            </p>
            <p className='text-sm'>
              Развёртывание стека Loki + Grafana описано в файле репозитория{' '}
              <code className='bg-muted rounded px-1 py-0.5 text-sm'>
                docs/grafana-loki-setup.md
              </code>
              .
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Системные логи</CardTitle>
          <CardDescription>
            Ошибки и предупреждения из SystemLog базы данных
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorsTable />
        </CardContent>
      </Card>
    </div>
  );
}
