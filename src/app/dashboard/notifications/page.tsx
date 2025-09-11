/**
 * @file: src/app/dashboard/notifications/page.tsx
 * @description: Страница глобального управления уведомлениями
 * @project: SaaS Bonus System
 * @dependencies: Next.js, React, UI components
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Send,
  History,
  BarChart3,
  Users,
  Image,
  Link,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationLog {
  id: string;
  projectId: string;
  channel: string;
  type: string;
  message: string;
  status: string;
  createdAt: string;
  metadata?: any;
  project: {
    id: string;
    name: string;
    domain: string;
  };
}

interface NotificationStats {
  sent: number;
  failed: number;
  pending: number;
}

interface Project {
  id: string;
  name: string;
  domain: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    sent: 0,
    failed: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Форма отправки уведомления
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [parseMode, setParseMode] = useState<'Markdown' | 'HTML'>('Markdown');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Загружаем уведомления
      const notificationsResponse = await fetch('/api/notifications');
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData.notifications);
        setStats(notificationsData.stats);
      }

      // Загружаем проекты
      const projectsResponse = await fetch('/api/projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.projects || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendNotification = async () => {
    if (!selectedProject || !message.trim()) {
      toast.error('Выберите проект и введите сообщение');
      return;
    }

    try {
      setSending(true);

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: selectedProject,
          message: message.trim(),
          imageUrl: imageUrl.trim() || undefined,
          parseMode
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(
          `Уведомление отправлено! Получено: ${result.result.sent}, Ошибок: ${result.result.failed}`
        );

        // Очищаем форму
        setMessage('');
        setImageUrl('');

        // Обновляем данные
        await loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка отправки уведомления');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Ошибка отправки уведомления');
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'failed':
        return <XCircle className='h-4 w-4 text-red-500' />;
      case 'pending':
        return <Clock className='h-4 w-4 text-yellow-500' />;
      case 'partial':
        return <AlertCircle className='h-4 w-4 text-orange-500' />;
      default:
        return <AlertCircle className='h-4 w-4 text-gray-500' />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      sent: 'default',
      failed: 'destructive',
      pending: 'secondary',
      partial: 'outline'
    };

    const labels: Record<string, string> = {
      sent: 'Отправлено',
      failed: 'Ошибка',
      pending: 'В ожидании',
      partial: 'Частично'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='text-center'>
          <div className='border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2'></div>
          <p className='text-muted-foreground'>Загрузка уведомлений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Заголовок */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Уведомления</h1>
          <p className='text-muted-foreground'>
            Управление глобальными уведомлениями и рассылками
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard')}>
          <Users className='mr-2 h-4 w-4' />
          Вернуться в дашборд
        </Button>
      </div>

      {/* Статистика */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Отправлено</CardTitle>
            <CheckCircle className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.sent}</div>
            <p className='text-muted-foreground text-xs'>Успешно доставлено</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Ошибки</CardTitle>
            <XCircle className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.failed}</div>
            <p className='text-muted-foreground text-xs'>
              Не удалось отправить
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>В ожидании</CardTitle>
            <Clock className='h-4 w-4 text-yellow-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.pending}</div>
            <p className='text-muted-foreground text-xs'>Ожидают отправки</p>
          </CardContent>
        </Card>
      </div>

      {/* Основной контент */}
      <Tabs defaultValue='send' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='send'>
            <Send className='mr-2 h-4 w-4' />
            Отправить
          </TabsTrigger>
          <TabsTrigger value='history'>
            <History className='mr-2 h-4 w-4' />
            История
          </TabsTrigger>
        </TabsList>

        {/* Отправка уведомления */}
        <TabsContent value='send'>
          <Card>
            <CardHeader>
              <CardTitle>Отправить уведомление</CardTitle>
              <CardDescription>
                Создайте и отправьте уведомление выбранным пользователям
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='project'>Проект</Label>
                  <Select
                    value={selectedProject}
                    onValueChange={setSelectedProject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Выберите проект' />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='parseMode'>Режим разметки</Label>
                  <Select
                    value={parseMode}
                    onValueChange={(value: 'Markdown' | 'HTML') =>
                      setParseMode(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Markdown'>Markdown</SelectItem>
                      <SelectItem value='HTML'>HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='message'>Сообщение</Label>
                <Textarea
                  id='message'
                  placeholder='Введите текст уведомления...'
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='imageUrl'>URL изображения (опционально)</Label>
                <div className='flex gap-2'>
                  <Image className='text-muted-foreground mt-3 h-4 w-4' />
                  <Input
                    id='imageUrl'
                    placeholder='https://example.com/image.jpg'
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleSendNotification}
                disabled={sending || !selectedProject || !message.trim()}
                className='w-full'
              >
                {sending ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                    Отправка...
                  </>
                ) : (
                  <>
                    <Send className='mr-2 h-4 w-4' />
                    Отправить уведомление
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* История уведомлений */}
        <TabsContent value='history'>
          <Card>
            <CardHeader>
              <CardTitle>История уведомлений</CardTitle>
              <CardDescription>
                Все отправленные уведомления и их статус
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-[600px]'>
                <div className='space-y-4'>
                  {notifications.length === 0 ? (
                    <div className='py-8 text-center'>
                      <Bell className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                      <p className='text-muted-foreground'>
                        Уведомления не найдены
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className='space-y-3 rounded-lg border p-4'
                      >
                        <div className='flex items-start justify-between'>
                          <div className='space-y-1'>
                            <div className='flex items-center gap-2'>
                              {getStatusIcon(notification.status)}
                              <span className='font-medium'>
                                {notification.project.name}
                              </span>
                              {getStatusBadge(notification.status)}
                            </div>
                            <p className='text-muted-foreground text-sm'>
                              {notification.channel} • {notification.type}
                            </p>
                          </div>
                          <div className='text-muted-foreground text-right text-sm'>
                            <div className='flex items-center gap-1'>
                              <Calendar className='h-3 w-3' />
                              {formatDate(notification.createdAt)}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className='space-y-2'>
                          <p className='text-sm'>{notification.message}</p>

                          {notification.metadata && (
                            <div className='text-muted-foreground text-xs'>
                              {notification.metadata.sentCount && (
                                <span className='mr-4'>
                                  Отправлено: {notification.metadata.sentCount}
                                </span>
                              )}
                              {notification.metadata.failedCount && (
                                <span>
                                  Ошибок: {notification.metadata.failedCount}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
