/**
 * @file: src/features/bots/components/bot-management-view.tsx
 * @description: Компонент управления Telegram ботом с настройками сообщений
 * @project: SaaS Bonus System
 * @dependencies: React, UI components, API
 * @created: 2025-01-23
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bot,
  Settings,
  MessageSquare,
  Power,
  AlertCircle,
  Check,
  X,
  Loader2,
  TestTube,
  Play,
  MessageCircle,
  Gift,
  Users,
  Save,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Project, BotSettings } from '@/types/bonus';
import { BotTestDialog } from './bot-test-dialog';

interface BotManagementViewProps {
  projectId: string;
}

interface BotStatus {
  configured: boolean;
  status: string; // 'ACTIVE' | 'INACTIVE' | 'ERROR'
  message: string;
  bot?: {
    id: number;
    username: string;
    firstName: string;
  };
}

export function BotManagementView({ projectId }: BotManagementViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [botSettings, setBotSettings] = useState<BotSettings | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [editingToken, setEditingToken] = useState(false);

  // Form state для настроек токена
  const [tokenForm, setTokenForm] = useState({
    botToken: '',
    botUsername: ''
  });

  // Form state для настроек сообщений
  const [messages, setMessages] = useState({
    welcomeMessage: '🤖 Добро пожаловать в бонусную программу!',
    helpMessage:
      'ℹ️ Доступные команды:\n/balance - проверить баланс\n/history - история операций\n/help - помощь',
    linkSuccessMessage: '✅ Аккаунт успешно привязан!',
    linkFailMessage: '❌ Не удалось найти аккаунт. Обратитесь в поддержку.',
    balanceMessage:
      '💰 Ваш баланс: {balance}₽\n🏆 Всего заработано: {totalEarned}₽',
    errorMessage: '❌ Произошла ошибка. Попробуйте позже.'
  });

  // Form state для функционала
  const [features, setFeatures] = useState({
    enableReferrals: true,
    enableHistory: true,
    enableNotifications: true,
    enableBonusRequests: false,
    enableSupport: true
  });

  const loadData = async () => {
    try {
      setLoading(true);

      // Загружаем проект
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData);
      }

      // Загружаем настройки бота
      const botResponse = await fetch(`/api/projects/${projectId}/bot`);
      if (botResponse.ok) {
        const botData = await botResponse.json();
        setBotSettings(botData);

        // Загружаем настройки токена
        setTokenForm({
          botToken: botData?.botToken || '',
          botUsername: botData?.botUsername || ''
        });

        // Загружаем настройки сообщений
        if (botData?.messages) {
          setMessages({ ...messages, ...botData.messages });
        }

        // Загружаем настройки функционала
        if (botData?.features) {
          setFeatures({ ...features, ...botData.features });
        }
      }

      // Проверяем статус бота
      await checkBotStatus();
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkBotStatus = async () => {
    try {
      setChecking(true);
      const response = await fetch(`/api/projects/${projectId}/bot/status`, {
        cache: 'no-store'
      });
      if (response.ok) {
        const status = await response.json();
        setBotStatus(status);

        // Обновляем проект с актуальным статусом
        if (project) {
          setProject({
            ...project,
            botStatus: status.status,
            botUsername: status.bot?.username || project.botUsername
          });
        }
      }
    } catch (error) {
      console.error('Ошибка проверки статуса:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось проверить статус бота',
        variant: 'destructive'
      });
    } finally {
      setChecking(false);
    }
  };

  const handleStartBot = async () => {
    try {
      setStarting(true);
      const response = await fetch(`/api/projects/${projectId}/bot/setup`, {
        method: 'POST'
      });

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Бот успешно запущен'
        });
        await checkBotStatus();
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось запустить бота',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось запустить бота',
        variant: 'destructive'
      });
    } finally {
      setStarting(false);
    }
  };

  const handleSaveToken = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/projects/${projectId}/bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: tokenForm.botToken,
          botUsername: tokenForm.botUsername,
          isActive: true
        })
      });

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Токен бота сохранен'
        });
        setEditingToken(false);
        await loadData();
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось сохранить токен',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить токен',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMessages = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/projects/${projectId}/bot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages
        })
      });

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Сообщения сохранены'
        });
        await loadData();
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось сохранить сообщения',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить сообщения',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFeatures = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/projects/${projectId}/bot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features
        })
      });

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Настройки функционала сохранены'
        });
        await loadData();
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось сохранить настройки',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-16'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push('/dashboard/projects')}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Назад к проектам
          </Button>
          <div>
            <Heading
              title={`Управление ботом: ${project?.name || 'Проект'}`}
              description='Настройка Telegram бота и его функционала'
            />
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          {botSettings?.botToken && (
            <>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowTestDialog(true)}
              >
                <TestTube className='mr-2 h-4 w-4' />
                Тестировать
              </Button>
              <Button size='sm' onClick={handleStartBot} disabled={starting}>
                {starting ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Play className='mr-2 h-4 w-4' />
                )}
                Перезапустить бота
              </Button>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Bot Status */}
      <Alert
        className={
          botStatus?.status === 'ACTIVE'
            ? 'border-green-200 bg-green-50'
            : botStatus?.status === 'ERROR'
              ? 'border-red-200 bg-red-50'
              : 'border-yellow-200 bg-yellow-50'
        }
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            {botStatus?.status === 'ACTIVE' ? (
              <Check className='h-4 w-4 text-green-600' />
            ) : botStatus?.status === 'ERROR' ? (
              <X className='h-4 w-4 text-red-600' />
            ) : (
              <AlertCircle className='h-4 w-4 text-yellow-600' />
            )}
            <AlertDescription
              className={
                botStatus?.status === 'ACTIVE'
                  ? 'text-green-800'
                  : botStatus?.status === 'ERROR'
                    ? 'text-red-800'
                    : 'text-yellow-800'
              }
            >
              <div className='font-medium'>
                Статус бота:{' '}
                {botStatus?.status === 'ACTIVE'
                  ? 'Активен'
                  : botStatus?.status === 'ERROR'
                    ? 'Ошибка'
                    : botStatus?.configured === false
                      ? 'Не настроен'
                      : 'Неактивен'}
              </div>
              <div className='mt-1 text-sm'>
                {botStatus?.message}
                {botStatus?.bot?.username && ` • @${botStatus.bot.username}`}
                {botStatus?.bot?.firstName && ` • ${botStatus.bot.firstName}`}
              </div>
            </AlertDescription>
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={checkBotStatus}
              disabled={checking}
            >
              {checking ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Settings className='mr-2 h-4 w-4' />
              )}
              Проверить
            </Button>
          </div>
        </div>
      </Alert>

      {/* Main Content */}
      <Tabs defaultValue='settings' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='settings'>
            <Bot className='mr-2 h-4 w-4' />
            Настройки
          </TabsTrigger>
          <TabsTrigger value='messages'>
            <MessageSquare className='mr-2 h-4 w-4' />
            Сообщения
          </TabsTrigger>
          <TabsTrigger value='features'>
            <Settings className='mr-2 h-4 w-4' />
            Функционал
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value='settings' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Настройка токена бота</CardTitle>
              <CardDescription>
                Основные настройки для подключения Telegram бота
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='botToken'>Токен бота</Label>
                  <div className='flex space-x-2'>
                    <Input
                      id='botToken'
                      value={
                        editingToken ? tokenForm.botToken : '••••••••••••••••'
                      }
                      onChange={(e) =>
                        setTokenForm({ ...tokenForm, botToken: e.target.value })
                      }
                      disabled={!editingToken}
                      type={editingToken ? 'text' : 'password'}
                      placeholder='1234567890:ABCdefGHIjklmnoPQRstuvwxyz'
                    />
                    <Button
                      variant='outline'
                      onClick={() => setEditingToken(!editingToken)}
                      disabled={saving}
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    Получите токен у @BotFather в Telegram
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='botUsername'>Имя пользователя бота</Label>
                  <Input
                    id='botUsername'
                    value={tokenForm.botUsername}
                    onChange={(e) =>
                      setTokenForm({
                        ...tokenForm,
                        botUsername: e.target.value
                      })
                    }
                    disabled={!editingToken}
                    placeholder='@your_bot_name'
                  />
                </div>

                {editingToken && (
                  <div className='flex space-x-2'>
                    <Button onClick={handleSaveToken} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Сохранение...
                        </>
                      ) : (
                        <>
                          <Save className='mr-2 h-4 w-4' />
                          Сохранить токен
                        </>
                      )}
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => setEditingToken(false)}
                    >
                      Отмена
                    </Button>
                  </div>
                )}

                {botSettings && (
                  <div className='flex items-center space-x-2 pt-4'>
                    <Badge
                      variant={botSettings.isActive ? 'default' : 'secondary'}
                    >
                      {botSettings.isActive ? 'Активен' : 'Неактивен'}
                    </Badge>
                    <span className='text-muted-foreground text-sm'>
                      Обновлено:{' '}
                      {new Date(botSettings.updatedAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                )}
              </div>

              {!botSettings?.botToken && (
                <Alert>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>
                    Настройте токен бота для начала работы. Получите токен у
                    @BotFather в Telegram.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value='messages' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Настройка сообщений бота</CardTitle>
              <CardDescription>
                Настройте текст сообщений, которые будет отправлять бот
                пользователям
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='welcomeMessage'>Приветственное сообщение</Label>
                <Textarea
                  id='welcomeMessage'
                  value={messages.welcomeMessage}
                  onChange={(e) =>
                    setMessages({ ...messages, welcomeMessage: e.target.value })
                  }
                  placeholder='Добро пожаловать в бонусную программу!'
                  rows={3}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='helpMessage'>Сообщение помощи</Label>
                <Textarea
                  id='helpMessage'
                  value={messages.helpMessage}
                  onChange={(e) =>
                    setMessages({ ...messages, helpMessage: e.target.value })
                  }
                  placeholder='Доступные команды...'
                  rows={4}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='balanceMessage'>Шаблон сообщения баланса</Label>
                <Textarea
                  id='balanceMessage'
                  value={messages.balanceMessage}
                  onChange={(e) =>
                    setMessages({ ...messages, balanceMessage: e.target.value })
                  }
                  placeholder='Используйте {balance}, {totalEarned} для подстановки значений'
                  rows={3}
                />
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='linkSuccessMessage'>Успешная привязка</Label>
                  <Textarea
                    id='linkSuccessMessage'
                    value={messages.linkSuccessMessage}
                    onChange={(e) =>
                      setMessages({
                        ...messages,
                        linkSuccessMessage: e.target.value
                      })
                    }
                    rows={2}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='linkFailMessage'>Ошибка привязки</Label>
                  <Textarea
                    id='linkFailMessage'
                    value={messages.linkFailMessage}
                    onChange={(e) =>
                      setMessages({
                        ...messages,
                        linkFailMessage: e.target.value
                      })
                    }
                    rows={2}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='errorMessage'>Сообщение об ошибке</Label>
                <Input
                  id='errorMessage'
                  value={messages.errorMessage}
                  onChange={(e) =>
                    setMessages({ ...messages, errorMessage: e.target.value })
                  }
                  placeholder='Произошла ошибка...'
                />
              </div>

              <Button onClick={handleSaveMessages} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className='mr-2 h-4 w-4' />
                    Сохранить сообщения
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value='features' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Функционал бота</CardTitle>
              <CardDescription>
                Включите или отключите различные функции бота
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <div className='flex items-center space-x-2'>
                      <Users className='h-4 w-4' />
                      <Label className='font-medium'>
                        Реферальная программа
                      </Label>
                    </div>
                    <p className='text-muted-foreground text-sm'>
                      Позволяет пользователям приглашать друзей и получать
                      бонусы
                    </p>
                  </div>
                  <Switch
                    checked={features.enableReferrals}
                    onCheckedChange={(checked) =>
                      setFeatures({ ...features, enableReferrals: checked })
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <div className='flex items-center space-x-2'>
                      <MessageCircle className='h-4 w-4' />
                      <Label className='font-medium'>История операций</Label>
                    </div>
                    <p className='text-muted-foreground text-sm'>
                      Показывает историю начислений и списаний бонусов
                    </p>
                  </div>
                  <Switch
                    checked={features.enableHistory}
                    onCheckedChange={(checked) =>
                      setFeatures({ ...features, enableHistory: checked })
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <div className='flex items-center space-x-2'>
                      <AlertCircle className='h-4 w-4' />
                      <Label className='font-medium'>Уведомления</Label>
                    </div>
                    <p className='text-muted-foreground text-sm'>
                      Автоматические уведомления о начислениях и истечении
                      бонусов
                    </p>
                  </div>
                  <Switch
                    checked={features.enableNotifications}
                    onCheckedChange={(checked) =>
                      setFeatures({ ...features, enableNotifications: checked })
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <div className='flex items-center space-x-2'>
                      <Gift className='h-4 w-4' />
                      <Label className='font-medium'>Запрос бонусов</Label>
                    </div>
                    <p className='text-muted-foreground text-sm'>
                      Позволяет пользователям запрашивать начисление бонусов
                    </p>
                  </div>
                  <Switch
                    checked={features.enableBonusRequests}
                    onCheckedChange={(checked) =>
                      setFeatures({ ...features, enableBonusRequests: checked })
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <div className='flex items-center space-x-2'>
                      <MessageSquare className='h-4 w-4' />
                      <Label className='font-medium'>Поддержка</Label>
                    </div>
                    <p className='text-muted-foreground text-sm'>
                      Возможность связаться с поддержкой через бота
                    </p>
                  </div>
                  <Switch
                    checked={features.enableSupport}
                    onCheckedChange={(checked) =>
                      setFeatures({ ...features, enableSupport: checked })
                    }
                  />
                </div>
              </div>

              <Button onClick={handleSaveFeatures} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className='mr-2 h-4 w-4' />
                    Сохранить настройки
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Dialog */}
      {project && (
        <BotTestDialog
          project={project}
          open={showTestDialog}
          onOpenChange={setShowTestDialog}
        />
      )}
    </div>
  );
}
