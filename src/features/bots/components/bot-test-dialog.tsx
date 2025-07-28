/**
 * @file: src/features/bots/components/bot-test-dialog.tsx
 * @description: Улучшенный диалог для тестирования Telegram бота
 * @project: SaaS Bonus System
 * @dependencies: React, Dialog components, новые API endpoints
 * @created: 2024-12-31
 * @updated: 2025-01-23
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Copy,
  ExternalLink,
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Bot,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import type { Project } from '@/types/bonus';

interface BotTestDialogProps {
  project: Project;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface BotTestResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: {
    botActive: boolean;
    webhookStatus?: string;
    lastUpdate?: string | null;
    canSendMessages?: boolean;
    testType?: string;
    projectName?: string;
    timestamp?: string;
  };
}

interface BotStatusInfo {
  configured: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  message: string;
  bot?: {
    id: number;
    username: string;
    firstName: string;
  };
  connection?: {
    hasWebhook: boolean;
    lastUpdate?: string | null;
    canReceiveUpdates: boolean;
  };
}

export function BotTestDialog({
  project,
  trigger,
  open: externalOpen,
  onOpenChange
}: BotTestDialogProps) {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);

  // Use external control if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const [testing, setTesting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [testResults, setTestResults] = useState<BotTestResult | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatusInfo | null>(null);
  const [testChatId, setTestChatId] = useState('');

  const webhookUrl = `${window.location.origin}/api/telegram/webhook/${project.id}`;

  useEffect(() => {
    if (open) {
      loadBotStatus();
    }
  }, [open]);

  const loadBotStatus = async () => {
    try {
      setLoadingStatus(true);
      const response = await fetch(`/api/projects/${project.id}/bot/status`);
      if (response.ok) {
        const status = await response.json();
        setBotStatus(status);
      }
    } catch (error) {
      console.error('Ошибка загрузки статуса:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const runBotTest = async () => {
    try {
      setTesting(true);
      setTestResults(null);

      const response = await fetch(`/api/projects/${project.id}/bot/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testChatId: testChatId || undefined
        })
      });

      const result = await response.json();
      setTestResults(result);

      if (result.success) {
        toast({
          title: '✅ Тест пройден успешно',
          description: result.message
        });
      } else {
        toast({
          title: '❌ Тест не пройден',
          description: result.error || 'Произошла ошибка при тестировании',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка тестирования:', error);
      toast({
        title: 'Ошибка тестирования',
        description: 'Не удалось выполнить тест бота',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Скопировано',
        description: 'Текст скопирован в буфер обмена'
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось скопировать текст',
        variant: 'destructive'
      });
    }
  };

  const openTelegram = () => {
    if (botStatus?.bot?.username) {
      window.open(`https://t.me/${botStatus.bot.username}`, '_blank');
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className='h-5 w-5 text-green-500' />;
      case 'ERROR':
        return <XCircle className='h-5 w-5 text-red-500' />;
      case 'INACTIVE':
        return <AlertCircle className='h-5 w-5 text-yellow-500' />;
      default:
        return <Clock className='h-5 w-5 text-gray-500' />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className='border-green-200 bg-green-100 text-green-700'>
            Активен
          </Badge>
        );
      case 'ERROR':
        return <Badge variant='destructive'>Ошибка</Badge>;
      case 'INACTIVE':
        return (
          <Badge className='border-yellow-200 bg-yellow-100 text-yellow-700'>
            Неактивен
          </Badge>
        );
      default:
        return <Badge variant='secondary'>Неизвестно</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant='outline' size='sm'>
            <TestTube className='mr-2 h-4 w-4' />
            Тестировать
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center'>
            <MessageSquare className='mr-2 h-5 w-5' />
            Тестирование бота: {project.name}
          </DialogTitle>
          <DialogDescription>
            Проверка работы Telegram бота и просмотр доступных команд
          </DialogDescription>
        </DialogHeader>

        <div className='mt-6 space-y-6'>
          {/* Status Section */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center text-lg'>
                <Bot className='mr-2 h-5 w-5' />
                Статус бота
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStatus ? (
                <div className='flex items-center space-x-2'>
                  <Clock className='h-4 w-4 animate-spin' />
                  <span className='text-muted-foreground text-sm'>
                    Проверка статуса...
                  </span>
                </div>
              ) : botStatus ? (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      {getStatusIcon(botStatus.status)}
                      <div>
                        <div className='flex items-center space-x-2'>
                          {getStatusBadge(botStatus.status)}
                          {botStatus.bot?.username && (
                            <Badge variant='outline'>
                              @{botStatus.bot.username}
                            </Badge>
                          )}
                        </div>
                        <p className='text-muted-foreground mt-1 text-sm'>
                          {botStatus.message}
                        </p>
                      </div>
                    </div>
                    <Button variant='outline' size='sm' onClick={loadBotStatus}>
                      Обновить
                    </Button>
                  </div>

                  {botStatus.connection && (
                    <div className='grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-3'>
                      <div className='text-center'>
                        <div className='text-sm font-medium'>Webhook</div>
                        <div className='text-muted-foreground text-xs'>
                          {botStatus.connection.hasWebhook
                            ? '✅ Установлен'
                            : '❌ Не установлен'}
                        </div>
                      </div>
                      <div className='text-center'>
                        <div className='text-sm font-medium'>Обновления</div>
                        <div className='text-muted-foreground text-xs'>
                          {botStatus.connection.canReceiveUpdates
                            ? '✅ Получает'
                            : '❌ Не получает'}
                        </div>
                      </div>
                      <div className='text-center'>
                        <div className='text-sm font-medium'>
                          Последняя активность
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          {botStatus.connection.lastUpdate
                            ? new Date(
                                botStatus.connection.lastUpdate
                              ).toLocaleString('ru-RU')
                            : 'Нет данных'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>
                    Не удалось загрузить статус бота
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Test Section */}
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center text-lg'>
                  <TestTube className='mr-2 h-5 w-5' />
                  Тестирование
                </CardTitle>
                <CardDescription>
                  Проверить работоспособность бота
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='testChatId'>
                    ID чата для теста (опционально)
                  </Label>
                  <Input
                    id='testChatId'
                    value={testChatId}
                    onChange={(e) => setTestChatId(e.target.value)}
                    placeholder='@username или chat_id'
                    className='font-mono text-sm'
                  />
                  <p className='text-muted-foreground text-xs'>
                    Если указано, бот отправит тестовое сообщение в этот чат
                  </p>
                </div>

                <Button
                  onClick={runBotTest}
                  disabled={testing || botStatus?.status !== 'ACTIVE'}
                  className='w-full'
                >
                  {testing ? (
                    <>
                      <Clock className='mr-2 h-4 w-4 animate-spin' />
                      Тестирование...
                    </>
                  ) : (
                    <>
                      <Send className='mr-2 h-4 w-4' />
                      Запустить тест
                    </>
                  )}
                </Button>

                {botStatus?.bot?.username && (
                  <Button
                    variant='outline'
                    onClick={openTelegram}
                    className='w-full'
                  >
                    <ExternalLink className='mr-2 h-4 w-4' />
                    Открыть @{botStatus.bot.username}
                  </Button>
                )}

                {testResults && (
                  <Alert
                    className={
                      testResults.success
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }
                  >
                    <div className='flex items-start space-x-2'>
                      {testResults.success ? (
                        <CheckCircle className='mt-0.5 h-5 w-5 text-green-600' />
                      ) : (
                        <XCircle className='mt-0.5 h-5 w-5 text-red-600' />
                      )}
                      <div className='space-y-2'>
                        <AlertDescription
                          className={
                            testResults.success
                              ? 'text-green-800'
                              : 'text-red-800'
                          }
                        >
                          <div className='font-medium'>
                            {testResults.success
                              ? 'Тест пройден успешно!'
                              : 'Тест не пройден'}
                          </div>
                          {testResults.message && (
                            <div className='mt-1 text-sm'>
                              {testResults.message}
                            </div>
                          )}
                          {testResults.error && (
                            <div className='mt-1 text-sm'>
                              {testResults.error}
                            </div>
                          )}
                        </AlertDescription>

                        {testResults.details && (
                          <div className='grid grid-cols-2 gap-4 text-xs'>
                            <div>
                              <span className='font-medium'>Активность:</span>{' '}
                              {testResults.details.botActive ? '✅' : '❌'}
                            </div>
                            {testResults.details.webhookStatus && (
                              <div>
                                <span className='font-medium'>Webhook:</span>{' '}
                                {testResults.details.webhookStatus}
                              </div>
                            )}
                            {testResults.details.canSendMessages !==
                              undefined && (
                              <div>
                                <span className='font-medium'>Отправка:</span>{' '}
                                {testResults.details.canSendMessages
                                  ? '✅'
                                  : '❌'}
                              </div>
                            )}
                            {testResults.details.timestamp && (
                              <div>
                                <span className='font-medium'>Время:</span>{' '}
                                {testResults.details.timestamp}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Commands Section */}
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center text-lg'>
                  <MessageCircle className='mr-2 h-5 w-5' />
                  Команды бота
                </CardTitle>
                <CardDescription>Список доступных команд</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {[
                    {
                      command: '/start',
                      description: 'Начать работу с ботом',
                      badge: 'Главная'
                    },
                    {
                      command: '/balance',
                      description: 'Проверить баланс бонусов',
                      badge: 'Баланс'
                    },
                    {
                      command: '/level',
                      description: 'Текущий уровень и прогресс',
                      badge: 'Уровень'
                    },
                    {
                      command: '/referral',
                      description: 'Реферальная программа',
                      badge: 'Рефералы'
                    },
                    {
                      command: '/invite',
                      description: 'Пригласить друга',
                      badge: 'Приглашение'
                    },
                    {
                      command: '/help',
                      description: 'Помощь и поддержка',
                      badge: 'Помощь'
                    }
                  ].map((cmd, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between rounded-lg border p-3'
                    >
                      <div className='space-y-1'>
                        <div className='flex items-center space-x-2'>
                          <code className='rounded bg-gray-100 px-2 py-1 font-mono text-sm'>
                            {cmd.command}
                          </code>
                          <Badge variant='outline' className='text-xs'>
                            {cmd.badge}
                          </Badge>
                        </div>
                        <p className='text-muted-foreground text-sm'>
                          {cmd.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Webhook Info */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg'>Информация о webhook</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div>
                  <Label className='text-sm font-medium'>Webhook URL</Label>
                  <div className='mt-1 flex items-center space-x-2'>
                    <Input
                      value={webhookUrl}
                      readOnly
                      className='font-mono text-sm'
                    />
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => copyToClipboard(webhookUrl)}
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
                <p className='text-muted-foreground text-xs'>
                  Этот URL используется Telegram для отправки обновлений вашему
                  боту
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
