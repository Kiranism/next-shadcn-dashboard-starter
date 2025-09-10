/**
 * @file: tilda-integration-view.tsx
 * @description: Компонент для настройки интеграции с Tilda
 * @project: SaaS Bonus System
 * @dependencies: Next.js, React, UI components
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  domain?: string | null;
  webhookSecret: string;
  bonusPercentage: number;
  _count?: {
    users: number;
  };
}

interface TildaIntegrationViewProps {
  project: Project;
}

export function TildaIntegrationView({ project }: TildaIntegrationViewProps) {
  const [config, setConfig] = useState({
    tildaFormId: '',
    tildaPageId: '',
    bonusDisplayText: 'Использовать бонусы',
    successMessage: 'Бонусы успешно применены!',
    errorMessage: 'Ошибка применения бонусов'
  });

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://your-domain.com';
  const webhookUrl = `${baseUrl}/api/webhook/${project.webhookSecret}`;
  const balanceApiUrl = `${baseUrl}/api/projects/${project.id}/users/balance`;
  const spendApiUrl = `${baseUrl}/api/projects/${project.id}/users/spend`;
  const statusApiUrl = `${baseUrl}/api/projects/${project.id}/integration/status`;
  const logsApiUrl = `${baseUrl}/api/projects/${project.id}/integration/logs?limit=10`;

  const [status, setStatus] = useState<{
    connected: boolean;
    lastSuccessAt?: string | null;
  } | null>(null);
  const [logs, setLogs] = useState<
    Array<{
      id: string;
      method: string;
      endpoint: string;
      headers?: any;
      status: number;
      success: boolean;
      createdAt: string;
      body?: any;
      response?: any;
    }>
  >([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, l] = await Promise.all([
          fetch(statusApiUrl).then((r) => r.json()),
          fetch(logsApiUrl).then((r) => r.json())
        ]);
        setStatus(s);
        setLogs(l.logs || []);
      } catch (_e) {
        // ignore
      }
    };
    load();
  }, [statusApiUrl, logsApiUrl]);

  const generateJavaScriptCode = () => {
    const scriptSrc = `${baseUrl}/tilda-bonus-widget.js?projectId=${project.id}&apiUrl=${baseUrl}`;
    return `<script src="${scriptSrc}"></script>`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    const fallbackCopy = (value: string) => {
      const el = document.createElement('textarea');
      el.value = value;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    };

    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(text);
      } else {
        const ok = fallbackCopy(text);
        if (!ok) throw new Error('copy failed');
      }
      toast.success(`${label} скопирован`);
    } catch (_e) {
      const ok = fallbackCopy(text);
      if (ok) toast.success(`${label} скопирован`);
      else toast.error('Не удалось скопировать');
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Файл ${filename} загружен`);
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Интеграция с Tilda</h1>
        <p className='text-muted-foreground'>
          Настройка виджета бонусной системы для сайта на Tilda
        </p>
      </div>

      {/* Информация о проекте */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о проекте</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='font-medium'>Проект:</span>
            <Badge variant='secondary'>{project.name}</Badge>
          </div>
          <div className='flex items-center justify-between'>
            <span className='font-medium'>Процент бонусов:</span>
            <Badge>{project.bonusPercentage}%</Badge>
          </div>
          <div className='flex items-center justify-between'>
            <span className='font-medium'>Пользователей:</span>
            <Badge variant='outline'>{project._count?.users || 0}</Badge>
          </div>
          <div className='flex items-center justify-between'>
            <span className='font-medium'>Статус подключения сайта:</span>
            {status?.connected ? (
              <Badge className='bg-green-600 text-white hover:bg-green-700'>
                Подключен
              </Badge>
            ) : (
              <Badge className='bg-red-600 text-white hover:bg-red-700'>
                Нет событий
              </Badge>
            )}
          </div>
          {status?.lastSuccessAt && (
            <div className='text-muted-foreground text-xs'>
              Последний успешный webhook:{' '}
              {new Date(status.lastSuccessAt).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Настройки виджета */}
      <Card>
        <CardHeader>
          <CardTitle>Настройки виджета</CardTitle>
          <CardDescription>
            Настройте параметры виджета бонусной системы для вашего сайта
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='tilda-form-id'>ID формы Tilda</Label>
              <Input
                id='tilda-form-id'
                placeholder='form123456789'
                value={config.tildaFormId}
                onChange={(e) =>
                  setConfig({ ...config, tildaFormId: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor='tilda-page-id'>ID страницы Tilda</Label>
              <Input
                id='tilda-page-id'
                placeholder='page123456789'
                value={config.tildaPageId}
                onChange={(e) =>
                  setConfig({ ...config, tildaPageId: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor='bonus-text'>Текст кнопки применения бонусов</Label>
            <Input
              id='bonus-text'
              value={config.bonusDisplayText}
              onChange={(e) =>
                setConfig({ ...config, bonusDisplayText: e.target.value })
              }
            />
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='success-message'>Сообщение об успехе</Label>
              <Input
                id='success-message'
                value={config.successMessage}
                onChange={(e) =>
                  setConfig({ ...config, successMessage: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor='error-message'>Сообщение об ошибке</Label>
              <Input
                id='error-message'
                value={config.errorMessage}
                onChange={(e) =>
                  setConfig({ ...config, errorMessage: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>API Эндпоинты</CardTitle>
          <CardDescription>
            Точки интеграции с внешними системами
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label>Webhook URL (для автоматического начисления бонусов)</Label>
            <div className='mt-1 flex gap-2'>
              <Input
                value={webhookUrl}
                readOnly
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                variant='outline'
                size='icon'
                onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
              >
                <Copy className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <div>
            <Label>API для проверки баланса</Label>
            <div className='mt-1 flex gap-2'>
              <Input value={balanceApiUrl} readOnly />
              <Button
                variant='outline'
                size='icon'
                onClick={() =>
                  copyToClipboard(balanceApiUrl, 'Balance API URL')
                }
              >
                <Copy className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <div>
            <Label>API для списания бонусов</Label>
            <div className='mt-1 flex gap-2'>
              <Input value={spendApiUrl} readOnly />
              <Button
                variant='outline'
                size='icon'
                onClick={() => copyToClipboard(spendApiUrl, 'Spend API URL')}
              >
                <Copy className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Последние вебхук события */}
      <Card>
        <CardHeader>
          <CardTitle>Последние события вебхука</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              Событий пока нет. Tilda при подключении отправляет тестовый POST
              <code className='mx-1 rounded bg-gray-100 px-1 py-0.5'>
                test=test
              </code>
              — выполните тест, чтобы увидеть статус.
            </p>
          ) : (
            <div className='space-y-2'>
              {logs.map((l) => {
                const pretty = (v: unknown, limit = 20000) => {
                  try {
                    const s =
                      typeof v === 'string' ? v : JSON.stringify(v, null, 2);
                    return s.length > limit
                      ? s.slice(0, limit) + '\n… (truncated)'
                      : s;
                  } catch {
                    return String(v);
                  }
                };
                return (
                  <details key={l.id} className='rounded border p-2 text-sm'>
                    <summary className='flex cursor-pointer items-center justify-between'>
                      <span className='truncate'>
                        {new Date(l.createdAt).toLocaleString()} — {l.method}{' '}
                        {l.endpoint}
                      </span>
                      <span
                        className={
                          l.success ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {l.success ? '200 OK' : l.status}
                      </span>
                    </summary>
                    <div className='mt-2 grid gap-2 md:grid-cols-2'>
                      <div className='rounded bg-gray-50 p-2'>
                        <div className='mb-1 text-xs font-semibold'>
                          Request
                        </div>
                        <pre className='text-xs break-all whitespace-pre-wrap'>
                          {pretty({
                            method: l.method,
                            url: l.endpoint,
                            headers: l.headers,
                            body: l.body
                          })}
                        </pre>
                      </div>
                      <div className='rounded bg-gray-50 p-2'>
                        <div className='mb-1 text-xs font-semibold'>
                          Response
                        </div>
                        <pre className='text-xs break-all whitespace-pre-wrap'>
                          {pretty({
                            status: l.status,
                            success: l.success,
                            body: l.response
                          })}
                        </pre>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Быстрое подключение виджета (по Tilda) */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрое подключение виджета</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className='mb-3'>
            <AlertDescription>
              В Tilda подключите приемщик «Webhook» (Настройки сайта → Формы →
              Webhook). Сразу после подключения Tilda отправит POST с данными
              <code className='mx-1 rounded bg-gray-100 px-1 py-0.5'>
                test=test
              </code>
              и ожидает ответ <b>200 OK</b> за &lt;5 секунд.
            </AlertDescription>
          </Alert>
          <p className='text-muted-foreground mb-2 text-sm'>
            Добавьте одну строку перед закрывающим тегом{' '}
            <code>&lt;/body&gt;</code> на вашем сайте:
          </p>
          <div className='rounded-lg bg-gray-50 p-3'>
            <code className='text-xs break-all'>
              {`<script src="${baseUrl}/tilda-bonus-widget.js?projectId=${project.id}&apiUrl=${baseUrl}"></script>`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
