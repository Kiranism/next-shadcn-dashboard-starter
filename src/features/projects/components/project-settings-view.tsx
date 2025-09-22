/**
 * @file: src/features/projects/components/project-settings-view.tsx
 * @description: Компонент настроек проекта
 * @project: SaaS Bonus System
 * @dependencies: React, form handling
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Bot,
  Users,
  BarChart3,
  Settings,
  Coins,
  Share2,
  Code,
  Bell as IconBell
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
import { Switch } from '@/components/ui/switch';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { Project } from '@/types/bonus';
import { ProjectDeleteDialog } from './project-delete-dialog';

interface ProjectSettingsViewProps {
  projectId: string;
}

export function ProjectSettingsView({ projectId }: ProjectSettingsViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    bonusPercentage: 1.0,
    bonusExpiryDays: 365,
    isActive: true,
    welcomeBonusAmount: 0
  });

  const loadProject = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const projectData = await response.json();
        setProject(projectData);
        setFormData({
          name: projectData.name || '',
          domain: projectData.domain || '',
          bonusPercentage: Number(projectData.bonusPercentage) || 1.0,
          bonusExpiryDays: projectData.bonusExpiryDays || 365,
          isActive: projectData.isActive ?? true,
          welcomeBonusAmount: (() => {
            const metaStr = projectData?.referralProgram?.description || null;
            try {
              const meta = metaStr ? JSON.parse(metaStr) : {};
              return Number(meta.welcomeBonus || 0);
            } catch {
              return 0;
            }
          })()
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки проекта:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные проекта',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]); // Добавляем projectId в зависимости вместо loadProject

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название проекта обязательно',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);

        toast({
          title: 'Успех',
          description: 'Настройки проекта обновлены'
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
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

  const handleDeleteProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/dashboard/projects');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 w-1/3 rounded bg-gray-200'></div>
          <div className='h-4 w-1/2 rounded bg-gray-200'></div>
          <div className='h-32 rounded bg-gray-200'></div>
        </div>
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
              title={`Настройки: ${project?.name || 'Проект'}`}
              description='Основные параметры и конфигурация проекта'
            />
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          {project?.isActive ? (
            <Badge variant='default' className='bg-green-600'>
              Активен
            </Badge>
          ) : (
            <Badge variant='destructive'>Неактивен</Badge>
          )}
        </div>
      </div>

      <Separator />

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Main form */}
        <div className='space-y-6 lg:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Settings className='mr-2 h-5 w-5' />
                Основные настройки
              </CardTitle>
              <CardDescription>
                Базовые параметры проекта бонусной системы
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>Название проекта *</Label>
                    <Input
                      id='name'
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder='Мой интернет-магазин'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='domain'>Домен (необязательно)</Label>
                    <Input
                      id='domain'
                      value={formData.domain}
                      onChange={(e) =>
                        setFormData({ ...formData, domain: e.target.value })
                      }
                      placeholder='example.com'
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='welcomeBonusAmount'>
                    Приветственный бонус при регистрации (₽)
                  </Label>
                  <Input
                    id='welcomeBonusAmount'
                    type='number'
                    step='0.01'
                    min='0'
                    value={formData.welcomeBonusAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        welcomeBonusAmount: parseFloat(e.target.value) || 0
                      })
                    }
                    placeholder='0.00'
                  />
                  <p className='text-muted-foreground text-xs'>
                    Срок действия как в поле выше «Срок действия бонусов»
                  </p>
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='bonusPercentage'>Процент бонусов (%)</Label>
                    <Input
                      id='bonusPercentage'
                      type='number'
                      min='0'
                      max='100'
                      step='0.01'
                      value={formData.bonusPercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bonusPercentage: parseFloat(e.target.value) || 0
                        })
                      }
                      placeholder='1.0'
                    />
                    <p className='text-muted-foreground text-xs'>
                      Базовый процент бонусов за каждую покупку
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='bonusExpiryDays'>
                      Срок действия бонусов (дни)
                    </Label>
                    <Input
                      id='bonusExpiryDays'
                      type='number'
                      min='1'
                      max='3650'
                      value={formData.bonusExpiryDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bonusExpiryDays: parseInt(e.target.value) || 365
                        })
                      }
                      placeholder='365'
                    />
                    <p className='text-muted-foreground text-xs'>
                      Количество дней до истечения бонусов
                    </p>
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <Switch
                    id='isActive'
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor='isActive'>Проект активен</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className='flex justify-end'>
            <div className='flex items-center gap-2'>
              <Button type='submit' disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
              <Button
                type='button'
                variant='destructive'
                onClick={() => setShowDeleteDialog(true)}
              >
                Удалить проект
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Link href={`/dashboard/projects/${projectId}/bot`}>
                <Button variant='outline' className='w-full justify-start'>
                  <Bot className='mr-2 h-4 w-4' />
                  Настройка Telegram бота
                </Button>
              </Link>
              <Link href={`/dashboard/projects/${projectId}/users`}>
                <Button variant='outline' className='mt-2 w-full justify-start'>
                  <Users className='mr-2 h-4 w-4' />
                  Управление пользователями
                </Button>
              </Link>
              <Link href={`/dashboard/projects/${projectId}/bonus-levels`}>
                <Button variant='outline' className='mt-2 w-full justify-start'>
                  <Coins className='mr-2 h-4 w-4' />
                  Уровни бонусов
                </Button>
              </Link>
              <Link href={`/dashboard/projects/${projectId}/referral`}>
                <Button variant='outline' className='mt-2 w-full justify-start'>
                  <Share2 className='mr-2 h-4 w-4' />
                  Реферальная программа
                </Button>
              </Link>
              <Link href={`/dashboard/projects/${projectId}/analytics`}>
                <Button variant='outline' className='mt-2 w-full justify-start'>
                  <BarChart3 className='mr-2 h-4 w-4' />
                  Статистика и аналитика
                </Button>
              </Link>
              <Link href={`/dashboard/projects/${projectId}/notifications`}>
                <Button variant='outline' className='mt-2 w-full justify-start'>
                  <IconBell className='mr-2 h-4 w-4' />
                  Уведомления
                </Button>
              </Link>
              <Link href={`/dashboard/projects/${projectId}/integration`}>
                <Button variant='outline' className='mt-2 w-full justify-start'>
                  <Code className='mr-2 h-4 w-4' />
                  Интеграция на сайт
                </Button>
              </Link>
              {/* Кнопка логов интеграции удалена */}
            </CardContent>
          </Card>

          {/* Project Info */}
          {project && (
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Информация о проекте</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <Label className='text-sm font-medium'>ID проекта</Label>
                  <p className='text-muted-foreground font-mono text-sm'>
                    {project.id}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Webhook Secret</Label>
                  <p className='text-muted-foreground font-mono text-sm'>
                    {project.webhookSecret}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Создан</Label>
                  <p className='text-muted-foreground text-sm'>
                    {new Date(project.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Обновлен</Label>
                  <p className='text-muted-foreground text-sm'>
                    {new Date(project.updatedAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Integration info — удалено по требованию */}
        </div>
      </div>

      {/* Диалог удаления проекта */}
      {project && (
        <ProjectDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          projectName={project.name}
          onConfirm={handleDeleteProject}
        />
      )}
    </div>
  );
}
