import { Suspense } from 'react';
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
import {
  Users,
  Briefcase,
  Gift,
  Bot,
  TrendingUp,
  Activity,
  Plus,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

// Компонент для загрузки статистики
async function DashboardStats() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5006'}/api/projects`,
      {
        cache: 'no-store' // Всегда свежие данные
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    const data = await response.json();
    const projects = data.projects || [];

    // Вычисляем статистику
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p: any) => p.isActive).length;
    const totalUsers = projects.reduce(
      (sum: number, p: any) => sum + (p._count?.users || 0),
      0
    );

    // Для подсчета активных ботов проверяем реальный статус
    let activeBots = 0;
    for (const project of projects) {
      if (project.botToken) {
        try {
          // Проверяем актуальный статус бота
          const statusResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5006'}/api/projects/${project.id}/bot/status`,
            {
              cache: 'no-store'
            }
          );
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (statusData.status === 'ACTIVE') {
              activeBots++;
            }
          }
        } catch (error) {
          // Если не можем проверить статус, используем статус из базы
          if (project.botStatus === 'ACTIVE') {
            activeBots++;
          }
        }
      }
    }

    return (
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Всего проектов
            </CardTitle>
            <Briefcase className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalProjects}</div>
            <p className='text-muted-foreground text-xs'>
              {activeProjects} активных
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Всего пользователей
            </CardTitle>
            <Users className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalUsers}</div>
            <p className='text-muted-foreground text-xs'>Во всех проектах</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Активных ботов
            </CardTitle>
            <Bot className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{activeBots}</div>
            <p className='text-muted-foreground text-xs'>
              Из {totalProjects} проектов
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Средний процент
            </CardTitle>
            <Gift className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {projects.length > 0
                ? (
                    projects.reduce(
                      (sum: number, p: any) => sum + (p.bonusPercentage || 1),
                      0
                    ) / projects.length
                  ).toFixed(1)
                : '0'}
              %
            </div>
            <p className='text-muted-foreground text-xs'>Бонусных начислений</p>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className='text-sm font-medium'>Загрузка...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='bg-muted h-8 animate-pulse rounded' />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
}

// Компонент для быстрых действий
function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Быстрые действия</CardTitle>
        <CardDescription>
          Основные операции для управления системой
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <Link href='/dashboard/projects'>
            <Button variant='outline' className='w-full justify-between'>
              <div className='flex items-center'>
                <Briefcase className='mr-2 h-4 w-4' />
                Управление проектами
              </div>
              <ArrowRight className='h-4 w-4' />
            </Button>
          </Link>

          <Button variant='outline' className='w-full justify-between' asChild>
            <Link href='/dashboard/projects'>
              <div className='flex items-center'>
                <Plus className='mr-2 h-4 w-4' />
                Создать проект
              </div>
              <ArrowRight className='h-4 w-4' />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Компонент для последних проектов
async function RecentProjects() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5006'}/api/projects`,
      {
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    const data = await response.json();
    let projects = (data.projects || []).slice(0, 5); // Показываем только 5 последних

    // Для каждого проекта с ботом получаем актуальный статус
    for (let i = 0; i < projects.length; i++) {
      if (projects[i].botToken) {
        try {
          const statusResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5006'}/api/projects/${projects[i].id}/bot/status`,
            {
              cache: 'no-store'
            }
          );
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            projects[i] = {
              ...projects[i],
              actualBotStatus: statusData.status
            };
          }
        } catch (error) {
          // Если не можем проверить статус, используем статус из базы
          projects[i] = {
            ...projects[i],
            actualBotStatus: projects[i].botStatus
          };
        }
      }
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Последние проекты</CardTitle>
          <CardDescription>
            Недавно созданные или обновленные проекты
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className='py-8 text-center'>
              <Briefcase className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <p className='text-muted-foreground'>Пока нет проектов</p>
              <Link href='/dashboard/projects'>
                <Button className='mt-4'>
                  <Plus className='mr-2 h-4 w-4' />
                  Создать первый проект
                </Button>
              </Link>
            </div>
          ) : (
            <div className='space-y-4'>
              {projects.map((project: any) => (
                <div
                  key={project.id}
                  className='hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors'
                >
                  <div className='flex items-center space-x-4'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 font-medium text-white'>
                      {project.name[0]?.toUpperCase() || 'P'}
                    </div>
                    <div>
                      <p className='font-medium'>{project.name}</p>
                      <div className='text-muted-foreground flex items-center space-x-2 text-sm'>
                        <Users className='h-3 w-3' />
                        <span>{project._count?.users || 0} польз.</span>
                        <span>•</span>
                        <Gift className='h-3 w-3' />
                        <span>{project.bonusPercentage || 1}% бонусов</span>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Badge variant={project.isActive ? 'default' : 'secondary'}>
                      {project.isActive ? 'Активен' : 'Неактивен'}
                    </Badge>
                    {project.botToken && (
                      <Badge
                        variant={
                          (project.actualBotStatus || project.botStatus) ===
                          'ACTIVE'
                            ? 'default'
                            : 'outline'
                        }
                      >
                        <Bot className='mr-1 h-3 w-3' />
                        Бот
                      </Badge>
                    )}
                    <Link href={`/dashboard/projects/${project.id}/settings`}>
                      <Button variant='ghost' size='sm'>
                        <ArrowRight className='h-4 w-4' />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

              {projects.length >= 5 && (
                <div className='pt-4 text-center'>
                  <Link href='/dashboard/projects'>
                    <Button variant='outline'>
                      Посмотреть все проекты
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Последние проекты</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>Ошибка загрузки проектов</p>
        </CardContent>
      </Card>
    );
  }
}

export default function DashboardPage() {
  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold'>Обзор системы</h1>
          <p className='text-muted-foreground'>
            Управление мультитенантной системой бонусных программ
          </p>
        </div>

        {/* Stats Cards */}
        <Suspense
          fallback={
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className='bg-muted h-4 w-3/4 animate-pulse rounded' />
                  </CardHeader>
                  <CardContent>
                    <div className='bg-muted h-8 animate-pulse rounded' />
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        >
          <DashboardStats />
        </Suspense>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Recent Projects - занимает 2 колонки */}
          <div className='lg:col-span-2'>
            <Suspense
              fallback={
                <Card>
                  <CardHeader>
                    <div className='bg-muted h-6 w-1/3 animate-pulse rounded' />
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className='bg-muted h-16 animate-pulse rounded'
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <RecentProjects />
            </Suspense>
          </div>

          {/* Quick Actions - 1 колонка */}
          <QuickActions />
        </div>
      </div>
    </PageContainer>
  );
}
