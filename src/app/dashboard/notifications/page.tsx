/**
 * @file: src/app/dashboard/notifications/page.tsx
 * @description: Страница системных уведомлений
 * @project: SaaS Bonus System
 * @dependencies: Next.js, React, UI components
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Bot,
  Database,
  Shield,
  RefreshCw,
  Settings,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemNotification {
  id: string;
  type: 'subscription' | 'bot' | 'security' | 'system' | 'billing';
  title: string;
  message: string;
  status: 'unread' | 'read' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
}

const NOTIFICATION_TYPES = {
  subscription: {
    icon: CreditCard,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    label: 'Подписка'
  },
  bot: {
    icon: Bot,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    label: 'Telegram бот'
  },
  security: {
    icon: Shield,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    label: 'Безопасность'
  },
  system: {
    icon: Settings,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    label: 'Система'
  },
  billing: {
    icon: TrendingUp,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    label: 'Биллинг'
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/notifications/system');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      } else {
        toast.error('Ошибка загрузки уведомлений');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Ошибка загрузки уведомлений');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/system/${notificationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'read' })
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, status: 'read' } : n
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/system/${notificationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'dismissed' })
        }
      );

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        toast.success('Уведомление скрыто');
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast.error('Ошибка скрытия уведомления');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread':
        return 'bg-blue-500';
      case 'read':
        return 'bg-gray-400';
      case 'dismissed':
        return 'bg-gray-300';
      default:
        return 'bg-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return notification.status === 'unread';
    return notification.type === activeTab;
  });

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  if (loading) {
    return (
      <PageContainer>
        <div className='flex h-64 items-center justify-center'>
          <div className='text-center'>
            <div className='border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2'></div>
            <p className='text-muted-foreground'>Загрузка уведомлений...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='space-y-6'>
        {/* Заголовок */}
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Уведомления</h1>
          <p className='text-muted-foreground'>
            Системные уведомления и важные события
          </p>
        </div>

        {/* Кнопки действий */}
        <div className='flex gap-2'>
          <Button variant='outline' onClick={loadNotifications}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Обновить
          </Button>
          <Button variant='outline' onClick={() => router.push('/dashboard')}>
            Вернуться в дашборд
          </Button>
        </div>

        {/* Статистика */}
        <div className='grid gap-4 md:grid-cols-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <Bell className='h-4 w-4 text-blue-500' />
                <span className='text-sm font-medium'>Всего</span>
              </div>
              <div className='text-2xl font-bold'>{notifications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <Clock className='h-4 w-4 text-orange-500' />
                <span className='text-sm font-medium'>Непрочитанных</span>
              </div>
              <div className='text-2xl font-bold'>{unreadCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <AlertTriangle className='h-4 w-4 text-red-500' />
                <span className='text-sm font-medium'>Критические</span>
              </div>
              <div className='text-2xl font-bold'>
                {notifications.filter((n) => n.priority === 'critical').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-4 w-4 text-green-500' />
                <span className='text-sm font-medium'>Прочитанных</span>
              </div>
              <div className='text-2xl font-bold'>
                {notifications.filter((n) => n.status === 'read').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Основной контент */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-4'
        >
          <TabsList>
            <TabsTrigger value='all'>Все ({notifications.length})</TabsTrigger>
            <TabsTrigger value='unread'>
              Непрочитанные ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value='subscription'>Подписка</TabsTrigger>
            <TabsTrigger value='bot'>Боты</TabsTrigger>
            <TabsTrigger value='security'>Безопасность</TabsTrigger>
            <TabsTrigger value='system'>Система</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle>Список уведомлений</CardTitle>
                <CardDescription>
                  {activeTab === 'all' && 'Все системные уведомления'}
                  {activeTab === 'unread' && 'Непрочитанные уведомления'}
                  {activeTab === 'subscription' && 'Уведомления о подписке'}
                  {activeTab === 'bot' && 'Уведомления о Telegram ботах'}
                  {activeTab === 'security' && 'Уведомления безопасности'}
                  {activeTab === 'system' && 'Системные уведомления'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredNotifications.length === 0 ? (
                  <div className='py-8 text-center'>
                    <Bell className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                    <p className='text-muted-foreground'>
                      Уведомления не найдены
                    </p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {filteredNotifications.map((notification) => {
                      const typeConfig = NOTIFICATION_TYPES[notification.type];
                      const IconComponent = typeConfig.icon;

                      return (
                        <div
                          key={notification.id}
                          className={`rounded-lg border p-4 transition-colors ${
                            notification.status === 'unread'
                              ? 'border-blue-200 bg-blue-50'
                              : 'bg-white'
                          }`}
                        >
                          <div className='flex items-start gap-3'>
                            <div
                              className={`rounded-full p-2 ${typeConfig.bgColor}`}
                            >
                              <IconComponent
                                className={`h-4 w-4 ${typeConfig.color}`}
                              />
                            </div>

                            <div className='flex-1 space-y-3'>
                              <div className='flex items-center gap-2'>
                                <h3 className='font-medium'>
                                  {notification.title}
                                </h3>
                                <Badge variant='outline' className='text-xs'>
                                  {typeConfig.label}
                                </Badge>
                                <div
                                  className={`h-2 w-2 rounded-full ${getPriorityColor(notification.priority)}`}
                                />
                                <div
                                  className={`h-2 w-2 rounded-full ${getStatusColor(notification.status)}`}
                                />
                              </div>

                              <p className='text-muted-foreground text-sm'>
                                {notification.message}
                              </p>

                              <div className='flex items-center justify-between'>
                                <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                                  <Calendar className='h-3 w-3' />
                                  {formatDate(notification.createdAt)}
                                </div>
                              </div>

                              {/* Кнопки действий в отдельной строке */}
                              <div className='flex gap-2 pt-2'>
                                {notification.actionUrl && (
                                  <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() =>
                                      router.push(notification.actionUrl!)
                                    }
                                  >
                                    {notification.actionText || 'Подробнее'}
                                  </Button>
                                )}

                                {notification.status === 'unread' && (
                                  <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    Отметить как прочитанное
                                  </Button>
                                )}

                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() =>
                                    dismissNotification(notification.id)
                                  }
                                >
                                  Скрыть
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
