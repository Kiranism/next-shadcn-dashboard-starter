/**
 * @file: page.tsx
 * @description: MAX Bot Integration Page
 * @project: SaaS Bonus System
 * @created: 2026-05-21
 * @author: Antigravity AI
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Bot,
  Play,
  Square,
  Save,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface MaxBotStatus {
  maxBotToken: string | null;
  maxBotUsername: string | null;
  isConfigured: boolean;
  isRunning: boolean;
  operationMode?: string;
}

export default function MaxBotPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { toast } = useToast();

  const [status, setStatus] = useState<MaxBotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/max-bot`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.maxBotUsername) {
          setUsernameInput(data.maxBotUsername);
        }
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить состояние MAX бота',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() && !status?.isConfigured) {
      toast({
        title: 'Заполните поля',
        description: 'Пожалуйста, введите токен MAX бота',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/max-bot`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maxBotToken: tokenInput || undefined,
          maxBotUsername: usernameInput || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: 'Успешно',
          description: data.message || 'Настройки сохранены и бот запущен'
        });
        setTokenInput(''); // очищаем поле ввода
        await fetchStatus();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка сохранения настроек');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description:
          error instanceof Error
            ? error.message
            : 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Вы уверены, что хотите отключить MAX бота? Все процессы будут остановлены.'
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/max-bot`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast({
          title: 'Успешно',
          description: 'Интеграция отключена, бот остановлен'
        });
        setTokenInput('');
        setUsernameInput('');
        await fetchStatus();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка удаления бота');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description:
          error instanceof Error ? error.message : 'Не удалось отключить бота',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className='flex h-[400px] items-center justify-center'>
        <Loader2 className='text-primary h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col space-y-6 px-6 py-6'>
      <Link
        href={`/dashboard/projects/${projectId}/integrations`}
        className='text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors'
      >
        <ChevronLeft className='h-4 w-4' />
        Назад к интеграциям
      </Link>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            MAX Bot Интеграция
          </h1>
          <p className='text-muted-foreground mt-1'>
            Настройка интеграции с корпоративным мессенджером MAX для
            автоматизации лояльности
          </p>
        </div>
        <div className='flex items-center gap-3'>
          {status?.isConfigured && (
            <Badge
              variant='outline'
              className={
                status.isRunning
                  ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
                  : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }
            >
              {status.isRunning ? 'Активен' : 'Не запущен'}
            </Badge>
          )}
          <Button
            variant='outline'
            size='icon'
            onClick={fetchStatus}
            title='Обновить статус'
          >
            <RefreshCw className='h-4 w-4' />
          </Button>
        </div>
      </div>

      <Separator />

      <div className='grid gap-6 md:grid-cols-3'>
        <div className='space-y-6 md:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle>Настройки подключения</CardTitle>
              <CardDescription>
                Введите токен доступа и имя пользователя MAX бота для
                синхронизации
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='maxBotToken'>Токен доступа API</Label>
                  <div className='relative'>
                    <Input
                      id='maxBotToken'
                      type={showToken ? 'text' : 'password'}
                      placeholder={
                        status?.isConfigured
                          ? '••••••••••••••••'
                          : 'Введите токен MAX бота'
                      }
                      value={
                        tokenInput ||
                        (showToken && status?.isConfigured
                          ? status.maxBotToken || ''
                          : '')
                      }
                      onChange={(e) => setTokenInput(e.target.value)}
                      required={!status?.isConfigured}
                      className='pr-10'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent'
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? (
                        <EyeOff className='h-4 w-4 text-gray-500' />
                      ) : (
                        <Eye className='h-4 w-4 text-gray-500' />
                      )}
                    </Button>
                  </div>
                  {status?.isConfigured && !tokenInput && (
                    <p className='text-xs text-green-600 dark:text-green-400'>
                      ✓ Токен успешно сохранен (маска: {status.maxBotToken})
                    </p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='maxBotUsername'>
                    Имя пользователя бота (Username)
                  </Label>
                  <div className='flex items-center gap-2'>
                    <span className='text-muted-foreground text-sm font-medium'>
                      @
                    </span>
                    <Input
                      id='maxBotUsername'
                      type='text'
                      placeholder='my_company_max_bot'
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                    />
                  </div>
                  <p className='text-muted-foreground text-xs'>
                    Никнейм вашего бота в системе MAX (например,{' '}
                    <code>id77XXXXXXXX_bot</code>). Можно оставить пустым —
                    определится автоматически при сохранении токена.
                  </p>
                </div>
              </CardContent>
              <CardFooter className='flex justify-between border-t px-6 py-4'>
                {status?.isConfigured ? (
                  <Button
                    type='button'
                    variant='destructive'
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Trash2 className='mr-2 h-4 w-4' />
                    )}
                    Отключить интеграцию
                  </Button>
                ) : (
                  <div />
                )}
                <Button type='submit' disabled={saving}>
                  {saving ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Save className='mr-2 h-4 w-4' />
                  )}
                  {status?.isConfigured
                    ? 'Сохранить и перезапустить'
                    : 'Подключить бота'}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {status?.isConfigured && !status.isRunning && (
            <Alert
              variant='destructive'
              className='border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100'
            >
              <AlertCircle className='h-4 w-4 text-amber-600' />
              <AlertTitle>Бот не запущен</AlertTitle>
              <AlertDescription>
                Токен настроен, но процесс опроса API (polling) сейчас
                остановлен. Попробуйте обновить токен доступа или проверить
                сетевое соединение с сервером MAX.
              </AlertDescription>
            </Alert>
          )}

          {status?.operationMode === 'WITHOUT_BOT' && (
            <Alert className='border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100'>
              <MessageSquare className='h-4 w-4 text-blue-600' />
              <AlertTitle>Режим работы проекта</AlertTitle>
              <AlertDescription>
                В настройках проекта сейчас выбран режим «Без бота». Вы можете
                привязать MAX бота, однако сценарии (workflows) и автоматические
                сообщения будут ограничены, пока вы не переключите режим работы
                в настройках проекта.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Как настроить?</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 text-sm leading-relaxed'>
              <div>
                <h4 className='font-semibold'>1. Создайте бота в MAX</h4>
                <p className='text-muted-foreground mt-1 text-xs'>
                  Откройте панель администратора MAX или напишите служебному
                  боту создания ботов на вашей MAX-платформе для получения
                  токена API.
                </p>
              </div>
              <div>
                <h4 className='font-semibold'>2. Скопируйте Токен доступа</h4>
                <p className='text-muted-foreground mt-1 text-xs'>
                  Токен выглядит как строка буквенно-цифровых символов. Вставьте
                  его в поле слева.
                </p>
              </div>
              <div>
                <h4 className='font-semibold'>3. Запустите автоматизацию</h4>
                <p className='text-muted-foreground mt-1 text-xs'>
                  В отличие от Telegram, MAX-бот работает через механизм Long
                  Polling, поэтому не требует настройки публичных вебхуков или
                  TLS-сертификатов.
                </p>
              </div>
              <Separator />
              <div className='flex flex-col gap-2 pt-2'>
                <a
                  href='https://max.mail.ru/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary flex items-center gap-1 text-xs hover:underline'
                >
                  Официальный сайт MAX <ExternalLink className='h-3 w-3' />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
