/**
 * @file: src/features/projects/components/projects-view-page.tsx
 * @description: Главный компонент страницы управления проектами
 * @project: SaaS Bonus System
 * @dependencies: React, Next.js, Shadcn/ui components
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Settings,
  Users,
  BarChart3,
  Bot,
  BotOff
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { ProjectCreateDialog } from './project-create-dialog';
import type { Project } from '@/types/bonus';

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Загрузка проектов
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');

      if (!response.ok) {
        throw new Error('Ошибка загрузки проектов');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация проектов по поисковому запросу
  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.domain &&
        project.domain.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateProject = () => {
    setShowCreateDialog(false);
    loadProjects(); // Перезагружаем список после создания
  };

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      {/* Заголовок и действия */}
      <div className='flex items-start justify-between'>
        <Heading
          title='Проекты'
          description='Управляйте проектами вашей бонусной системы'
        />
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Создать проект
        </Button>
      </div>
      <Separator />

      {/* Поиск */}
      <div className='flex items-center space-x-2'>
        <div className='relative max-w-sm flex-1'>
          <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
          <Input
            placeholder='Поиск проектов...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-8'
          />
        </div>
      </div>

      {/* Список проектов */}
      {loading ? (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/2' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-8 w-full' />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className='py-12 text-center'>
          <div className='mx-auto max-w-md'>
            <div className='text-muted-foreground/50 mx-auto h-12 w-12'>
              <BarChart3 className='h-full w-full' />
            </div>
            <h3 className='mt-4 text-lg font-semibold'>
              {searchQuery ? 'Проекты не найдены' : 'Нет проектов'}
            </h3>
            <p className='text-muted-foreground mt-2 text-sm'>
              {searchQuery
                ? 'Попробуйте изменить поисковый запрос'
                : 'Создайте первый проект для начала работы'}
            </p>
            {!searchQuery && (
              <Button
                className='mt-4'
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className='mr-2 h-4 w-4' />
                Создать проект
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Диалог создания проекта */}
      <ProjectCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateProject}
      />
    </div>
  );
}

// Компонент карточки проекта
function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className='hover:bg-muted/50 transition-colors'>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <CardTitle className='text-lg'>{project.name}</CardTitle>
            {project.domain && (
              <CardDescription>{project.domain}</CardDescription>
            )}
          </div>
          <Badge variant={project.isActive ? 'default' : 'secondary'}>
            {project.isActive ? 'Активен' : 'Неактивен'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>Процент бонусов:</span>
          <span className='font-medium'>{project.bonusPercentage}%</span>
        </div>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>Срок действия:</span>
          <span className='font-medium'>{project.bonusExpiryDays} дней</span>
        </div>
        {project._count && (
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Пользователей:</span>
            <span className='font-medium'>{project._count.users}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className='flex flex-col gap-2'>
        <div className='flex w-full gap-2'>
          <Link
            href={`/dashboard/projects/${project.id}/settings`}
            className='flex-1'
          >
            <Button variant='outline' size='sm' className='w-full'>
              <Settings className='mr-2 h-4 w-4' />
              Настройки
            </Button>
          </Link>
          <div className='flex-1'>
            <BotStatusButton project={project} />
          </div>
        </div>
        <div className='flex w-full gap-2'>
          <Link
            href={`/dashboard/projects/${project.id}/users`}
            className='flex-1'
          >
            <Button variant='outline' size='sm' className='w-full'>
              <Users className='mr-2 h-4 w-4' />
              Пользователи
            </Button>
          </Link>
          <Link
            href={`/dashboard/projects/${project.id}/analytics`}
            className='flex-1'
          >
            <Button variant='outline' size='sm' className='w-full'>
              <BarChart3 className='mr-2 h-4 w-4' />
              Аналитика
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

// Компонент кнопки статуса бота
function BotStatusButton({ project }: { project: Project }) {
  const [botSettings, setBotSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadBotSettings = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/bot`);
      if (response.ok) {
        const data = await response.json();
        setBotSettings(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек бота:', error);
    }
  };

  useEffect(() => {
    loadBotSettings();
  }, [loadBotSettings]);

  const hasBotConfigured = botSettings && botSettings.botToken;
  const isBotActive = hasBotConfigured && botSettings.isActive;

  return (
    <Link href={`/dashboard/projects/${project.id}/bot`}>
      <Button variant='outline' size='sm' className='w-full'>
        {isBotActive ? (
          <>
            <Bot className='mr-2 h-4 w-4 text-green-600' />
            Бот активен
          </>
        ) : hasBotConfigured ? (
          <>
            <BotOff className='mr-2 h-4 w-4 text-orange-600' />
            Настроить бота
          </>
        ) : (
          <>
            <Bot className='mr-2 h-4 w-4 text-gray-400' />
            Настроить бота
          </>
        )}
      </Button>
    </Link>
  );
}
