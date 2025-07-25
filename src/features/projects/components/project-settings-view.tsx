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
import { ArrowLeft, Save, Bot, Users, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { Project } from '@/types/bonus';

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

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    bonusPercentage: 1.0,
    bonusExpiryDays: 365,
    isActive: true
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
          isActive: projectData.isActive ?? true
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки проекта:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные проекта',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название проекта обязательно',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);
        
        toast({
          title: 'Успех',
          description: 'Настройки проекта обновлены',
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось сохранить настройки',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к проектам
          </Button>
          <div>
            <Heading
              title={`Настройки: ${project?.name || 'Проект'}`}
              description="Основные параметры и конфигурация проекта"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {project?.isActive ? (
            <Badge variant="default" className="bg-green-600">Активен</Badge>
          ) : (
            <Badge variant="destructive">Неактивен</Badge>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Основные настройки
              </CardTitle>
              <CardDescription>
                Базовые параметры проекта бонусной системы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Название проекта *</Label>
                <Input
                  id="name"
                  placeholder="Моя бонусная программа"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Отображается в интерфейсе и Telegram боте
                </p>
              </div>

              {/* Domain */}
              <div className="space-y-2">
                <Label htmlFor="domain">Домен сайта</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Основной домен для интеграции (опционально)
                </p>
              </div>

              {/* Bonus Percentage */}
              <div className="space-y-2">
                <Label htmlFor="bonusPercentage">Процент бонусов (%)</Label>
                <Input
                  id="bonusPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.bonusPercentage}
                  onChange={(e) => setFormData({ ...formData, bonusPercentage: Number(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">
                  Процент от суммы покупки, начисляемый как бонусы
                </p>
              </div>

              {/* Bonus Expiry */}
              <div className="space-y-2">
                <Label htmlFor="bonusExpiryDays">Срок действия бонусов (дни)</Label>
                <Input
                  id="bonusExpiryDays"
                  type="number"
                  min="1"
                  max="3650"
                  value={formData.bonusExpiryDays}
                  onChange={(e) => setFormData({ ...formData, bonusExpiryDays: Number(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">
                  Количество дней до истечения срока действия бонусов
                </p>
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">Активность проекта</Label>
                  <p className="text-sm text-muted-foreground">
                    Включить или отключить всю бонусную программу
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Сохранение...' : 'Сохранить настройки'}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/dashboard/projects/${projectId}/bot`}>
                <Button variant="outline" className="w-full justify-start">
                  <Bot className="h-4 w-4 mr-2" />
                  Настройка Telegram бота
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Users className="h-4 w-4 mr-2" />
                Управление пользователями
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <BarChart3 className="h-4 w-4 mr-2" />
                Статистика и аналитика
              </Button>
            </CardContent>
          </Card>

          {/* Project Info */}
          {project && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Информация о проекте</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">ID проекта</Label>
                  <p className="text-sm text-muted-foreground font-mono">{project.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Webhook Secret</Label>
                  <p className="text-sm text-muted-foreground font-mono">{project.webhookSecret}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Создан</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Обновлен</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.updatedAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Integration info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Интеграция</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label className="font-medium">Webhook URL:</Label>
                <code className="block mt-1 p-2 bg-gray-100 rounded text-xs break-all">
                  POST /api/webhook/{project?.webhookSecret}
                </code>
              </div>
              <div>
                <Label className="font-medium">Поддерживаемые действия:</Label>
                <ul className="mt-1 text-muted-foreground list-disc list-inside">
                  <li>register_user - регистрация пользователя</li>
                  <li>purchase - покупка с начислением бонусов</li>
                  <li>spend_bonuses - списание бонусов</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 