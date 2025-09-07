/**
 * @file: page.tsx
 * @description: Главная страница дашборда с общей статистикой системы
 * @project: SaaS Bonus System
 * @dependencies: React, API, UI components
 * @created: 2025-01-31
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import {
  Bot,
  Users,
  Gift,
  TrendingUp,
  Activity,
  Settings,
  ExternalLink,
  Zap,
  Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SystemStats {
  totalProjects: number;
  totalUsers: number;
  activeBots: number;
  totalBonuses: number;
  recentProjects: Array<{
    id: string;
    name: string;
    userCount: number;
    botStatus: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col space-y-6 px-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Heading
            title='Панель управления'
            description='Обзор системы бонусных программ'
          />
        </div>
        <div className='flex items-center space-x-2'>
          <Button onClick={() => router.push('/dashboard/projects')}>
            <Settings className='mr-2 h-4 w-4' />
            Управление проектами
          </Button>
        </div>
      </div>

      <Separator />

      {/* Stats Cards */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Проекты</CardTitle>
            <Settings className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats?.totalProjects || 0}
            </div>
            <p className='text-muted-foreground text-xs'>
              Активных бонусных программ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Пользователи</CardTitle>
            <Users className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats?.totalUsers || 0}</div>
            <p className='text-muted-foreground text-xs'>
              Зарегистрированных участников
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Telegram боты</CardTitle>
            <Bot className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats?.activeBots || 0}</div>
            <p className='text-muted-foreground text-xs'>Активных ботов</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Бонусы</CardTitle>
            <Gift className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats?.totalBonuses || 0}₽
            </div>
            <p className='text-muted-foreground text-xs'>
              Всего начислено бонусов
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              Последние проекты
            </CardTitle>
            <CardDescription>
              Недавно созданные бонусные программы
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentProjects && stats.recentProjects.length > 0 ? (
              <div className='space-y-4'>
                {stats.recentProjects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className='hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors'
                  >
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600'>
                        <Star className='h-4 w-4 text-white' />
                      </div>
                      <div>
                        <p className='font-medium'>{project.name}</p>
                        <p className='text-muted-foreground text-sm'>
                          {project.userCount} пользователей
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Badge
                        variant={
                          project.botStatus === 'ACTIVE'
                            ? 'default'
                            : 'secondary'
                        }
                        className='text-xs'
                      >
                        {project.botStatus === 'ACTIVE' ? (
                          <>
                            <Activity className='mr-1 h-3 w-3' />
                            Активен
                          </>
                        ) : (
                          <>
                            <Bot className='mr-1 h-3 w-3' />
                            Неактивен
                          </>
                        )}
                      </Badge>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          router.push(`/dashboard/projects/${project.id}`)
                        }
                      >
                        <ExternalLink className='h-3 w-3' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='py-8 text-center'>
                <TrendingUp className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                <p className='text-muted-foreground'>Нет проектов</p>
                <Button
                  variant='outline'
                  className='mt-2'
                  onClick={() => router.push('/dashboard/projects')}
                >
                  Создать первый проект
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Zap className='h-5 w-5' />
              Быстрые действия
            </CardTitle>
            <CardDescription>
              Часто используемые функции системы
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-3'>
              <Button
                variant='outline'
                className='justify-start'
                onClick={() => router.push('/dashboard/projects')}
              >
                <Settings className='mr-2 h-4 w-4' />
                Управление проектами
              </Button>

              <Button
                variant='outline'
                className='mt-2 justify-start'
                onClick={() => router.push('/dashboard/bonuses')}
              >
                <Gift className='mr-2 h-4 w-4' />
                Управление бонусами
              </Button>

              <Button
                variant='outline'
                className='mt-2 justify-start'
                onClick={() => router.push('/dashboard/kanban')}
              >
                <Activity className='mr-2 h-4 w-4' />
                Канбан доска
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
