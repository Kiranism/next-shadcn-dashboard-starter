/**
 * @file: tilda-integration-view.tsx
 * @description: Компонент для настройки интеграции с Tilda
 * @project: SaaS Bonus System
 * @dependencies: React, shadcn/ui
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Copy,
  CheckCircle2,
  AlertCircle,
  Code,
  Webhook,
  Settings,
  FileText,
  Clock
} from 'lucide-react';
import { Project } from '@/types';
import { PageContainer } from '@/components/page-container';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { WebhookLogEntry } from '@/types/api-responses';

export function ProjectIntegrationView({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [widgetUrl, setWidgetUrl] = useState('');
  const [recentLogs, setRecentLogs] = useState<WebhookLogEntry[]>([]);
  const [recentLogsLoading, setRecentLogsLoading] = useState<boolean>(false);
  const resolvedParams = useParams();
  const projectId = resolvedParams?.id as string;

  useEffect(() => {
    if (!projectId) return;

    // Формируем URL для виджета
    const currentUrl = window.location.origin;
    setWidgetUrl(`${currentUrl}/tilda-bonus-widget.js`);

    // Загружаем данные проекта
    loadProject();
    // Загружаем последние логи
    loadRecentLogs();
  }, [projectId]);

  async function loadProject() {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to load project');

      const data = await response.json();
      setProject(data);
    } catch (error) {
      toast.error('Ошибка загрузки проекта');
    } finally {
      setLoading(false);
    }
  }

  async function loadRecentLogs() {
    if (!projectId) return;
    try {
      setRecentLogsLoading(true);
      const response = await fetch(
        `/api/projects/${projectId}/integration/logs?limit=10`
      );
      if (!response.ok) throw new Error('Failed to load logs');
      const data = await response.json();
      setRecentLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (_error) {
      // Тихо игнорируем, страница интеграции не критична без логов
      setRecentLogs([]);
    } finally {
      setRecentLogsLoading(false);
    }
  }

  function copyToClipboard(text: string, type: string) {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Скопировано в буфер обмена');

    setTimeout(() => setCopied(null), 3000);
  }

  if (loading) {
    return (
      <PageContainer>
        <div className='animate-pulse'>
          <div className='mb-4 h-8 w-1/4 rounded bg-gray-200'></div>
          <div className='h-64 rounded bg-gray-200'></div>
        </div>
      </PageContainer>
    );
  }

  if (!project) {
    return (
      <PageContainer>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>Проект не найден</AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  const webhookUrl = `${window.location.origin}/api/webhook/${project.webhookSecret}`;

  const widgetCode = `<!-- Бонусная система для Tilda -->
<script src="${widgetUrl}"></script>
<script>
  // Инициализация виджета бонусной системы
  TildaBonusWidget.init({
    projectId: '${projectId}',
    apiUrl: '${window.location.origin}',
    bonusToRuble: 1, // 1 бонус = 1 рубль
    minOrderAmount: 100, // Минимальная сумма заказа
    debug: false // Включить отладку в консоли
  });
</script>`;

  const testWebhookData = JSON.stringify(
    {
      action: 'purchase',
      payload: {
        userEmail: 'test@example.com',
        purchaseAmount: 1000,
        orderId: 'TEST-' + Date.now(),
        description: 'Тестовый заказ'
      }
    },
    null,
    2
  );

  return (
    <PageContainer scrollable>
      <div className='space-y-6'>
        {/* Заголовок */}
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Интеграция с Tilda
          </h1>
          <p className='text-muted-foreground mt-2'>
            Настройте интеграцию бонусной системы с вашим сайтом на Tilda
          </p>
        </div>

        {/* Статус интеграции */}
        <Alert>
          <CheckCircle2 className='h-4 w-4' />
          <AlertTitle>Готово к интеграции</AlertTitle>
          <AlertDescription>
            Следуйте инструкциям ниже для подключения бонусной системы к вашему
            сайту
          </AlertDescription>
        </Alert>

        {/* Табы с инструкциями */}
        <Tabs defaultValue='widget' className='space-y-4'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='widget'>
              <Code className='mr-2 h-4 w-4' />
              Виджет
            </TabsTrigger>
            <TabsTrigger value='webhook'>
              <Webhook className='mr-2 h-4 w-4' />
              Webhook
            </TabsTrigger>
            <TabsTrigger value='settings'>
              <Settings className='mr-2 h-4 w-4' />
              Настройки
            </TabsTrigger>
            <TabsTrigger value='logs'>
              <FileText className='mr-2 h-4 w-4' />
              Логи
            </TabsTrigger>
          </TabsList>

          {/* Виджет */}
          <TabsContent value='widget' className='mt-0 space-y-4'>
            <Card className='overflow-hidden'>
              <CardHeader>
                <CardTitle>Шаг 1: Установка виджета</CardTitle>
                <CardDescription>
                  Вставьте этот код в настройки вашего сайта на Tilda
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label>Где вставить код:</Label>
                  <p className='text-muted-foreground text-sm'>
                    Настройки сайта → Дополнительно → Вставить код → В футер
                    (перед &lt;/body&gt;)
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label>Код для вставки:</Label>
                  <div className='relative'>
                    <pre className='bg-muted overflow-x-auto rounded-lg p-4 text-sm'>
                      <code>{widgetCode}</code>
                    </pre>
                    <Button
                      size='sm'
                      variant='outline'
                      className='absolute top-2 right-2'
                      onClick={() => copyToClipboard(widgetCode, 'widget')}
                    >
                      {copied === 'widget' ? (
                        <CheckCircle2 className='h-4 w-4 text-green-600' />
                      ) : (
                        <Copy className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className='h-4 w-4' />
                  <AlertTitle>Что делает виджет:</AlertTitle>
                  <AlertDescription>
                    <ul className='mt-2 list-inside list-disc space-y-1'>
                      <li>Показывает баланс бонусов в корзине</li>
                      <li>Позволяет применить бонусы к заказу</li>
                      <li>
                        Автоматически определяет пользователя по email/телефону
                      </li>
                      <li>Работает со всеми типами корзин Tilda</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhook */}
          <TabsContent value='webhook' className='mt-0 space-y-4'>
            <Card className='overflow-hidden'>
              <CardHeader>
                <CardTitle>Шаг 2: Настройка Webhook</CardTitle>
                <CardDescription>
                  Настройте автоматическую отправку данных о заказах
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label>Webhook URL:</Label>
                  <div className='flex space-x-2'>
                    <Input
                      value={webhookUrl}
                      readOnly
                      className='font-mono text-sm'
                    />
                    <Button
                      size='icon'
                      variant='outline'
                      onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                    >
                      {copied === 'webhook' ? (
                        <CheckCircle2 className='h-4 w-4 text-green-600' />
                      ) : (
                        <Copy className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>Где настроить в Tilda:</Label>
                  <ol className='text-muted-foreground list-inside list-decimal space-y-1 text-sm'>
                    <li>Перейдите в настройки сайта</li>
                    <li>Найдите раздел "Уведомления и интеграции"</li>
                    <li>Добавьте новый webhook</li>
                    <li>Вставьте URL и выберите тип "Заказы"</li>
                    <li>Сохраните настройки</li>
                  </ol>
                </div>

                <Separator />

                <div className='space-y-2'>
                  <Label>Тестовые данные для проверки:</Label>
                  <div className='relative'>
                    <pre className='bg-muted overflow-x-auto rounded-lg p-4 text-sm'>
                      <code>{testWebhookData}</code>
                    </pre>
                    <Button
                      size='sm'
                      variant='outline'
                      className='absolute top-2 right-2'
                      onClick={() => copyToClipboard(testWebhookData, 'test')}
                    >
                      {copied === 'test' ? (
                        <CheckCircle2 className='h-4 w-4 text-green-600' />
                      ) : (
                        <Copy className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    Используйте эти данные для тестирования webhook через
                    Postman или curl
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Настройки */}
          <TabsContent value='settings' className='mt-0 space-y-4'>
            <Card className='overflow-hidden'>
              <CardHeader>
                <CardTitle>Настройки интеграции</CardTitle>
                <CardDescription>
                  Дополнительные параметры для тонкой настройки
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='bonus-rate'>Курс бонусов</Label>
                    <Input
                      id='bonus-rate'
                      type='number'
                      defaultValue='1'
                      min='0.1'
                      step='0.1'
                    />
                    <p className='text-muted-foreground text-sm'>
                      Сколько рублей равен 1 бонус
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='min-order'>Минимальная сумма заказа</Label>
                    <Input
                      id='min-order'
                      type='number'
                      defaultValue='100'
                      min='0'
                    />
                    <p className='text-muted-foreground text-sm'>
                      Минимальная сумма для применения бонусов
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='max-percent'>
                      Максимальный процент оплаты бонусами
                    </Label>
                    <Input
                      id='max-percent'
                      type='number'
                      defaultValue='50'
                      min='1'
                      max='100'
                    />
                    <p className='text-muted-foreground text-sm'>
                      Какую часть заказа можно оплатить бонусами (в %)
                    </p>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className='h-4 w-4' />
                  <AlertTitle>Примечание</AlertTitle>
                  <AlertDescription>
                    Эти настройки применяются только к новым заказам. Изменения
                    вступят в силу после обновления кода виджета на сайте.
                  </AlertDescription>
                </Alert>

                <div className='flex justify-end'>
                  <Button>Сохранить настройки</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Логи (компактно) */}
          <TabsContent value='logs' className='mt-0 space-y-4'>
            <Card className='overflow-hidden'>
              <CardHeader className='flex flex-row items-center justify-between'>
                <div>
                  <CardTitle>Последние логи</CardTitle>
                  <CardDescription>
                    Показаны последние 10 записей webhook
                  </CardDescription>
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={loadRecentLogs}
                    disabled={recentLogsLoading}
                  >
                    <Clock
                      className={`mr-2 h-4 w-4 ${recentLogsLoading ? 'animate-spin' : ''}`}
                    />
                    Обновить
                  </Button>
                  <Link href={`/dashboard/projects/${projectId}/logs`}>
                    <Button size='sm'>Открыть все</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentLogsLoading ? (
                  <div className='bg-muted h-24 animate-pulse rounded' />
                ) : recentLogs.length === 0 ? (
                  <div className='text-muted-foreground text-sm'>
                    Логи отсутствуют
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className='hover:bg-muted/50 rounded-lg border p-3 transition-colors'
                      >
                        <div className='mb-1 flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <Badge variant='outline'>{log.method}</Badge>
                            <code className='max-w-[40vw] truncate font-mono text-xs md:max-w-[50vw] md:text-sm'>
                              {log.endpoint}
                            </code>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Badge
                              variant={
                                log.status >= 200 && log.status < 300
                                  ? 'default'
                                  : 'destructive'
                              }
                            >
                              {log.status}
                            </Badge>
                          </div>
                        </div>
                        <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                          <Clock className='h-3 w-3' />{' '}
                          {new Date(log.createdAt).toLocaleString('ru-RU')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Дополнительная информация */}
        <Card>
          <CardHeader>
            <CardTitle>Нужна помощь?</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <Button
                variant='outline'
                className='hover:bg-muted/50 flex h-auto flex-col items-start p-6 text-left transition-colors'
                onClick={() => {
                  // Здесь можно добавить логику открытия документации
                  window.open('/docs/webhook-integration.md', '_blank');
                }}
              >
                <div className='mb-2 flex items-center gap-3'>
                  <div className='text-2xl'>📚</div>
                  <h4 className='font-medium'>Документация</h4>
                </div>
                <p className='text-muted-foreground mb-3 text-sm'>
                  Подробное руководство по интеграции с примерами кода
                </p>
                <span className='text-primary text-sm font-medium'>
                  Читать документацию →
                </span>
              </Button>

              <Button
                variant='outline'
                className='hover:bg-muted/50 flex h-auto flex-col items-start p-6 text-left transition-colors'
                onClick={() => {
                  // Здесь можно добавить логику открытия техподдержки
                  window.open(
                    'mailto:support@example.com?subject=Вопрос по интеграции',
                    '_blank'
                  );
                }}
              >
                <div className='mb-2 flex items-center gap-3'>
                  <div className='text-2xl'>💬</div>
                  <h4 className='font-medium'>Техподдержка</h4>
                </div>
                <p className='text-muted-foreground mb-3 text-sm'>
                  Свяжитесь с нами, если возникли вопросы
                </p>
                <span className='text-primary text-sm font-medium'>
                  Написать в поддержку →
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
