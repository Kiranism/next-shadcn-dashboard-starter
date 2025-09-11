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
import { Separator } from '@/components/ui/separator';
import {
  IconUser,
  IconMail,
  IconCalendar,
  IconSettings,
  IconShield,
  IconBell,
  IconCreditCard
} from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ProfileViewPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    user: {
      name: 'Загрузка...',
      email: '',
      createdAt: new Date(),
      lastLogin: new Date()
    },
    system: {
      projects: 0,
      users: 0,
      bots: 0,
      activeProjects: 0,
      totalBonuses: 0,
      uptime: 0,
      lastActivity: new Date()
    },
    version: 'v2.1.0',
    status: {
      database: 'Проверка...',
      redis: 'Проверка...',
      telegram: 'Проверка...'
    }
  });

  const loadStats = useCallback(async () => {
    try {
      // eslint-disable-next-line no-console
      console.log('Profile page - loading stats...');

      const response = await fetch('/api/profile/stats', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // eslint-disable-next-line no-console
      console.log('Profile page - response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        // eslint-disable-next-line no-console
        console.log('Profile page - data received:', data);
        setStats(data.data);
      } else {
        const errorData = await response.json();
        // eslint-disable-next-line no-console
        console.error('Profile page - error:', errorData);
        if (response.status === 401) {
          router.push('/auth/sign-in');
          return;
        }
        toast.error('Ошибка загрузки статистики');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load stats:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      // setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleNotifications = () => {
    // eslint-disable-next-line no-console
    console.log('Notifications clicked');
    // Переходим к первому проекту для отправки уведомлений
    router.push('/dashboard/projects');
  };

  const handleSettings = () => {
    // eslint-disable-next-line no-console
    console.log('Settings clicked');
    // Переходим к настройкам первого проекта
    router.push('/dashboard/projects');
  };

  const handleBilling = () => {
    // eslint-disable-next-line no-console
    console.log('Billing clicked');
    toast.info('Функция биллинга будет доступна в следующих версиях');
  };

  return (
    <div className='flex w-full flex-col space-y-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Профиль</h1>
          <p className='text-muted-foreground'>
            Управление настройками аккаунта и системой
          </p>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* Информация о пользователе */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <IconUser className='h-5 w-5' />
              Информация о пользователе
            </CardTitle>
            <CardDescription>Основные данные вашего аккаунта</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary flex h-12 w-12 items-center justify-center rounded-full'>
                <IconUser className='text-primary-foreground h-6 w-6' />
              </div>
              <div>
                <h3 className='font-semibold'>{stats.user.name}</h3>
                <p className='text-muted-foreground text-sm'>
                  {stats.user.email}
                </p>
              </div>
            </div>

            <Separator />

            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <IconMail className='text-muted-foreground h-4 w-4' />
                <span className='text-sm'>{stats.user.email}</span>
              </div>
              <div className='flex items-center gap-2'>
                <IconShield className='text-muted-foreground h-4 w-4' />
                <Badge variant='secondary'>Администратор</Badge>
              </div>
              <div className='flex items-center gap-2'>
                <IconCalendar className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground text-sm'>
                  Регистрация:{' '}
                  {new Date(stats.user.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Статистика */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <IconSettings className='h-5 w-5' />
              Статистика системы
            </CardTitle>
            <CardDescription>Обзор активности и использования</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='bg-muted rounded-lg p-4 text-center'>
                <div className='text-primary text-2xl font-bold'>
                  {stats.system.projects}
                </div>
                <div className='text-muted-foreground text-sm'>Проектов</div>
              </div>
              <div className='bg-muted rounded-lg p-4 text-center'>
                <div className='text-primary text-2xl font-bold'>
                  {stats.system.users.toLocaleString()}
                </div>
                <div className='text-muted-foreground text-sm'>
                  Пользователей
                </div>
              </div>
              <div className='bg-muted rounded-lg p-4 text-center'>
                <div className='text-primary text-2xl font-bold'>
                  {stats.system.bots}
                </div>
                <div className='text-muted-foreground text-sm'>Ботов</div>
              </div>
              <div className='bg-muted rounded-lg p-4 text-center'>
                <div className='text-primary text-2xl font-bold'>
                  {stats.system.uptime}%
                </div>
                <div className='text-muted-foreground text-sm'>Uptime</div>
              </div>
            </div>

            <Separator />

            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Последний вход:</span>
                <span>
                  {new Date(stats.user.lastLogin).toLocaleString('ru-RU')}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Активные проекты:</span>
                <Badge variant='outline'>{stats.system.activeProjects}</Badge>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Общие бонусы:</span>
                <span className='font-medium'>
                  {stats.system.totalBonuses.toLocaleString()} ₽
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Быстрые действия */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
          <CardDescription>
            Часто используемые функции управления системой
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-3'>
            <Button
              type='button'
              variant='outline'
              className='flex h-auto flex-col items-center gap-2 p-4'
              onClick={handleNotifications}
            >
              <IconBell className='h-5 w-5' />
              <span>Уведомления</span>
            </Button>
            <Button
              type='button'
              variant='outline'
              className='flex h-auto flex-col items-center gap-2 p-4'
              onClick={handleSettings}
            >
              <IconSettings className='h-5 w-5' />
              <span>Настройки</span>
            </Button>
            <Button
              type='button'
              variant='outline'
              className='flex h-auto flex-col items-center gap-2 p-4'
              onClick={handleBilling}
            >
              <IconCreditCard className='h-5 w-5' />
              <span>Биллинг</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Системная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Системная информация</CardTitle>
          <CardDescription>
            Информация о версии и состоянии системы
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Версия системы:</span>
                <span>{stats.version}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Статус:</span>
                <Badge variant='default' className='bg-green-500'>
                  Активна
                </Badge>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Обновления:</span>
                <Badge variant='outline'>Доступны</Badge>
              </div>
            </div>
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>База данных:</span>
                <Badge variant='default' className='bg-green-500'>
                  {stats.status.database}
                </Badge>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Redis:</span>
                <Badge variant='outline'>{stats.status.redis}</Badge>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Telegram API:</span>
                <Badge variant='default' className='bg-green-500'>
                  {stats.status.telegram}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
