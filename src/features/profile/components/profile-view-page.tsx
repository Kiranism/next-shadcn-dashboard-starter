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
  IconCreditCard,
  IconLogout
} from '@tabler/icons-react';
import { useState } from 'react';

export default function ProfileViewPage() {
  const [user] = useState({
    name: 'Администратор',
    email: 'admin@gupil.ru',
    role: 'Администратор',
    plan: 'Enterprise',
    createdAt: '2024-01-01',
    lastLogin: '2024-09-11'
  });

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
                <h3 className='font-semibold'>{user.name}</h3>
                <p className='text-muted-foreground text-sm'>{user.email}</p>
              </div>
            </div>

            <Separator />

            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <IconMail className='text-muted-foreground h-4 w-4' />
                <span className='text-sm'>{user.email}</span>
              </div>
              <div className='flex items-center gap-2'>
                <IconShield className='text-muted-foreground h-4 w-4' />
                <Badge variant='secondary'>{user.role}</Badge>
              </div>
              <div className='flex items-center gap-2'>
                <IconCalendar className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground text-sm'>
                  Регистрация:{' '}
                  {new Date(user.createdAt).toLocaleDateString('ru-RU')}
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
                <div className='text-primary text-2xl font-bold'>12</div>
                <div className='text-muted-foreground text-sm'>Проектов</div>
              </div>
              <div className='bg-muted rounded-lg p-4 text-center'>
                <div className='text-primary text-2xl font-bold'>1,234</div>
                <div className='text-muted-foreground text-sm'>
                  Пользователей
                </div>
              </div>
              <div className='bg-muted rounded-lg p-4 text-center'>
                <div className='text-primary text-2xl font-bold'>45</div>
                <div className='text-muted-foreground text-sm'>Ботов</div>
              </div>
              <div className='bg-muted rounded-lg p-4 text-center'>
                <div className='text-primary text-2xl font-bold'>98%</div>
                <div className='text-muted-foreground text-sm'>Uptime</div>
              </div>
            </div>

            <Separator />

            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Последний вход:</span>
                <span>{new Date(user.lastLogin).toLocaleString('ru-RU')}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Тарифный план:</span>
                <Badge variant='outline'>{user.plan}</Badge>
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
              variant='outline'
              className='flex h-auto flex-col items-center gap-2 p-4'
            >
              <IconBell className='h-5 w-5' />
              <span>Уведомления</span>
            </Button>
            <Button
              variant='outline'
              className='flex h-auto flex-col items-center gap-2 p-4'
            >
              <IconSettings className='h-5 w-5' />
              <span>Настройки</span>
            </Button>
            <Button
              variant='outline'
              className='flex h-auto flex-col items-center gap-2 p-4'
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
                <span>v2.1.0</span>
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
                  Подключена
                </Badge>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Redis:</span>
                <Badge variant='outline'>Активен</Badge>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Telegram API:</span>
                <Badge variant='default' className='bg-green-500'>
                  Работает
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
