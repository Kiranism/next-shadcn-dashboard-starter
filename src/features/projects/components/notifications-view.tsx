/**
 * @file: notifications-view.tsx
 * @description: Компонент для управления уведомлениями проекта
 * @project: Gupil.ru - SaaS Bonus System
 * @dependencies: @/components/ui, @/types/notification
 * @created: 2024-09-11
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  IconBell,
  IconSend,
  IconSettings,
  IconHistory,
  IconCheck,
  IconX,
  IconClock
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationTemplate,
  NotificationLog
} from '@/types/notification';

interface NotificationsViewProps {
  projectId: string;
}

export default function NotificationsView({
  projectId
}: NotificationsViewProps) {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Форма для отправки уведомления
  const [formData, setFormData] = useState({
    userId: '',
    type: NotificationType.BONUS_EARNED,
    channel: NotificationChannel.TELEGRAM,
    title: '',
    message: '',
    priority: NotificationPriority.NORMAL,
    variables: {} as Record<string, any>
  });

  useEffect(() => {
    loadNotifications();
  }, [projectId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/notifications`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data.templates);
        setLogs(data.data.logs);
      }
    } catch (error) {
      toast.error('Ошибка загрузки уведомлений');
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async () => {
    if (!formData.title || !formData.message) {
      toast.error('Заполните заголовок и сообщение');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Уведомление отправлено');
        setFormData({
          userId: '',
          type: NotificationType.BONUS_EARNED,
          channel: NotificationChannel.TELEGRAM,
          title: '',
          message: '',
          priority: NotificationPriority.NORMAL,
          variables: {}
        });
        loadNotifications(); // Обновляем логи
      } else {
        toast.error(data.error || 'Ошибка отправки уведомления');
      }
    } catch (error) {
      toast.error('Ошибка отправки уведомления');
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <IconCheck className='h-4 w-4 text-green-500' />;
      case 'failed':
        return <IconX className='h-4 w-4 text-red-500' />;
      case 'pending':
        return <IconClock className='h-4 w-4 text-yellow-500' />;
      default:
        return <IconClock className='h-4 w-4 text-gray-500' />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: 'default' as const,
      delivered: 'default' as const,
      failed: 'destructive' as const,
      pending: 'secondary' as const
    };

    const labels = {
      sent: 'Отправлено',
      delivered: 'Доставлено',
      failed: 'Ошибка',
      pending: 'Ожидает'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Уведомления</h2>
          <p className='text-muted-foreground'>
            Управление уведомлениями и шаблонами сообщений
          </p>
        </div>
      </div>

      <Tabs defaultValue='send' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='send' className='flex items-center gap-2'>
            <IconSend className='h-4 w-4' />
            Отправить
          </TabsTrigger>
          <TabsTrigger value='templates' className='flex items-center gap-2'>
            <IconSettings className='h-4 w-4' />
            Шаблоны
          </TabsTrigger>
          <TabsTrigger value='history' className='flex items-center gap-2'>
            <IconHistory className='h-4 w-4' />
            История
          </TabsTrigger>
        </TabsList>

        <TabsContent value='send' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <IconBell className='h-5 w-5' />
                Отправить уведомление
              </CardTitle>
              <CardDescription>
                Отправка уведомления пользователям проекта
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='userId'>
                    ID пользователя (необязательно)
                  </Label>
                  <Input
                    id='userId'
                    placeholder='Оставьте пустым для массовой рассылки'
                    value={formData.userId}
                    onChange={(e) =>
                      setFormData({ ...formData, userId: e.target.value })
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='type'>Тип уведомления</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        type: value as NotificationType
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(NotificationType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='channel'>Канал</Label>
                  <Select
                    value={formData.channel}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        channel: value as NotificationChannel
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(NotificationChannel).map((channel) => (
                        <SelectItem key={channel} value={channel}>
                          {channel.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='priority'>Приоритет</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        priority: value as NotificationPriority
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(NotificationPriority).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='title'>Заголовок</Label>
                <Input
                  id='title'
                  placeholder='Заголовок уведомления'
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='message'>Сообщение</Label>
                <Textarea
                  id='message'
                  placeholder='Текст уведомления'
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />
              </div>

              <Button
                onClick={sendNotification}
                disabled={sending || !formData.title || !formData.message}
                className='w-full'
              >
                {sending ? 'Отправка...' : 'Отправить уведомление'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='templates' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Шаблоны уведомлений</CardTitle>
              <CardDescription>
                Предустановленные шаблоны для различных типов уведомлений
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className='space-y-2 rounded-lg border p-4'
                  >
                    <div className='flex items-center justify-between'>
                      <h4 className='font-semibold'>{template.title}</h4>
                      <Badge
                        variant={template.isActive ? 'default' : 'secondary'}
                      >
                        {template.isActive ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </div>
                    <p className='text-muted-foreground text-sm'>
                      {template.message}
                    </p>
                    <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                      <Badge variant='outline'>{template.type}</Badge>
                      <Badge variant='outline'>{template.channel}</Badge>
                      {template.variables.length > 0 && (
                        <span>Переменные: {template.variables.join(', ')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='history' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>История уведомлений</CardTitle>
              <CardDescription>
                Лог всех отправленных уведомлений
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className='text-muted-foreground py-8 text-center'>
                  Уведомления не отправлялись
                </div>
              ) : (
                <div className='space-y-3'>
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className='space-y-2 rounded-lg border p-4'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          {getStatusIcon(log.status)}
                          <span className='font-medium'>{log.title}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          {getStatusBadge(log.status)}
                          <Badge variant='outline'>{log.type}</Badge>
                          <Badge variant='outline'>{log.channel}</Badge>
                        </div>
                      </div>
                      <p className='text-muted-foreground text-sm'>
                        {log.message}
                      </p>
                      <div className='text-muted-foreground flex items-center justify-between text-xs'>
                        <span>
                          {log.userId
                            ? `Пользователь: ${log.userId}`
                            : 'Массовая рассылка'}
                        </span>
                        <span>
                          {log.sentAt
                            ? new Date(log.sentAt).toLocaleString('ru-RU')
                            : 'Не отправлено'}
                        </span>
                      </div>
                      {log.error && (
                        <div className='rounded bg-red-50 p-2 text-xs text-red-500'>
                          Ошибка: {log.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
