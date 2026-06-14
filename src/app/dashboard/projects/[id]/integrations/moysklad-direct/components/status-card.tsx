/**
 * @file: status-card.tsx
 * @description: Integration status card component with quick actions
 * @project: SaaS Bonus System
 * @dependencies: React 19, framer-motion
 * @created: 2026-03-06
 * @author: AI Assistant + User
 */

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  TestTube2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface IntegrationStatusCardProps {
  integration: {
    id: string;
    isActive: boolean;
    lastSyncAt: Date | null;
    lastError: string | null;
  };
  projectId: string;
}

export function IntegrationStatusCard({
  integration,
  projectId
}: IntegrationStatusCardProps) {
  const router = useRouter();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/integrations/moysklad-direct/test`,
        {
          method: 'POST'
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Подключение успешно');
      } else {
        toast.error('Ошибка подключения', {
          description: data.error || data.message
        });
      }
    } catch (error) {
      toast.error('Ошибка', { description: (error as Error).message });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/integrations/moysklad-direct/sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Синхронизация завершена', {
          description: `Успешно: ${data.syncedCount} · Ошибок: ${data.errorsCount}`
        });
        router.refresh();
      } else {
        toast.error('Ошибка синхронизации', {
          description: data.error || data.message
        });
      }
    } catch (error) {
      toast.error('Ошибка', { description: (error as Error).message });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className='glass-card border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/50'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-xl font-semibold'>
                Статус интеграции
              </CardTitle>
              <CardDescription>
                Текущее состояние синхронизации с МойСклад
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              {integration.isActive ? (
                <Badge
                  variant='default'
                  className='bg-emerald-500 hover:bg-emerald-600'
                >
                  <CheckCircle2 className='mr-1 h-3 w-3' />
                  Активна
                </Badge>
              ) : (
                <Badge variant='secondary'>
                  <XCircle className='mr-1 h-3 w-3' />
                  Неактивна
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Last Sync */}
          <div className='flex items-center justify-between rounded-lg border border-zinc-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900'>
            <div>
              <p className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
                Последняя синхронизация
              </p>
              <p className='text-xs text-zinc-500 dark:text-zinc-400'>
                {integration.lastSyncAt
                  ? formatDistanceToNow(new Date(integration.lastSyncAt), {
                      addSuffix: true,
                      locale: ru
                    })
                  : 'Еще не выполнялась'}
              </p>
            </div>
            {integration.lastSyncAt && (
              <CheckCircle2 className='h-5 w-5 text-emerald-500' />
            )}
          </div>

          {/* Last Error */}
          {integration.lastError && (
            <div className='rounded-lg border border-rose-100 bg-rose-50 p-3 dark:border-rose-900/50 dark:bg-rose-900/20'>
              <div className='flex items-start gap-2'>
                <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-rose-900 dark:text-rose-100'>
                    Последняя ошибка
                  </p>
                  <p className='mt-1 text-xs text-rose-700 dark:text-rose-300'>
                    {showError
                      ? integration.lastError
                      : integration.lastError.substring(0, 100) + '...'}
                  </p>
                  {integration.lastError.length > 100 && (
                    <button
                      onClick={() => setShowError(!showError)}
                      className='mt-1 text-xs text-rose-600 hover:underline dark:text-rose-400'
                    >
                      {showError ? 'Скрыть' : 'Показать полностью'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className='flex gap-2'>
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              variant='outline'
              size='sm'
              className='flex-1'
            >
              {isTestingConnection ? (
                <>
                  <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                  Проверка...
                </>
              ) : (
                <>
                  <TestTube2 className='mr-2 h-4 w-4' />
                  Проверить подключение
                </>
              )}
            </Button>
            <Button
              onClick={handleManualSync}
              disabled={isSyncing || !integration.isActive}
              variant='default'
              size='sm'
              className='flex-1'
            >
              {isSyncing ? (
                <>
                  <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                  Синхронизация...
                </>
              ) : (
                <>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Синхронизировать
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
