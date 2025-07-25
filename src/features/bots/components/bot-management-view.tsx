/**
 * @file: src/features/bots/components/bot-management-view.tsx
 * @description: Компонент управления Telegram ботом проекта
 * @project: SaaS Bonus System
 * @dependencies: React, HeroUI, form handling
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, BotOff, Settings, Eye, EyeOff, ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BotTestDialog } from './bot-test-dialog';
import type { Project, BotSettings } from '@/types/bonus';

interface BotManagementViewProps {
  projectId: string;
}

export function BotManagementView({ projectId }: BotManagementViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [botSettings, setBotSettings] = useState<BotSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);


  // Form state
  const [formData, setFormData] = useState({
    botToken: '',
    botUsername: '',
    welcomeMessage: '',
    isActive: true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load project
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData);
      }

      // Load bot settings
      const botResponse = await fetch(`/api/projects/${projectId}/bot`);
      if (botResponse.ok) {
        const botData = await botResponse.json();
        if (botData) {
          setBotSettings(botData);
          setFormData({
            botToken: botData.botToken || '',
            botUsername: botData.botUsername || '',
            welcomeMessage: botData.welcomeMessage || '',
            isActive: botData.isActive ?? true
          });
        }
      }
    } catch (error) {
      // TODO: логгер
      // console.error('Ошибка загрузки данных:', error);
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
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!formData.botToken.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Токен бота обязателен',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      const method = botSettings ? 'PUT' : 'POST';
      const response = await fetch(`/api/projects/${projectId}/bot`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedBot = await response.json();
        setBotSettings(updatedBot);
        
        toast({
          title: 'Успех',
          description: botSettings ? 'Настройки бота обновлены' : 'Бот успешно настроен',
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }
    } catch (error) {
      // TODO: логгер
      // console.error('Ошибка сохранения:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось сохранить настройки',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!botSettings) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/bot`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBotSettings({ ...botSettings, isActive: false });
        setFormData({ ...formData, isActive: false });
        
        toast({
          title: 'Успех',
          description: 'Бот деактивирован',
        });
      }
    } catch (error) {
      // TODO: логгер
      // console.error('Ошибка деактивации:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось деактивировать бота',
        variant: 'destructive',
      });
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

  const getBotStatusBadge = () => {
    if (!botSettings) {
      return <Badge variant="secondary">Не настроен</Badge>;
    }
    
    if (botSettings.isActive) {
      return <Badge variant="default" className="bg-green-600">Активен</Badge>;
    } else {
      return <Badge variant="destructive">Неактивен</Badge>;
    }
  };

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
              title={`Telegram бот: ${project?.name || 'Проект'}`}
              description="Настройка и управление ботом для бонусной программы"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getBotStatusBadge()}
          {botSettings?.isActive && project && (
            <BotTestDialog 
              project={project}
              botSettings={botSettings}
            />
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
                Настройки бота
              </CardTitle>
              <CardDescription>
                Основные параметры для подключения и настройки Telegram бота
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bot Token */}
              <div className="space-y-2">
                <Label htmlFor="botToken">Токен бота *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="botToken"
                    type={showToken ? 'text' : 'password'}
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                    value={formData.botToken}
                    onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Получите токен у @BotFather в Telegram
                </p>
              </div>

              {/* Bot Username */}
              <div className="space-y-2">
                <Label htmlFor="botUsername">Имя пользователя бота</Label>
                <Input
                  id="botUsername"
                  placeholder="@my_bonus_bot"
                  value={formData.botUsername}
                  onChange={(e) => setFormData({ ...formData, botUsername: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Имя пользователя бота для справочной информации
                </p>
              </div>

              {/* Welcome Message */}
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Приветственное сообщение</Label>
                <Textarea
                  id="welcomeMessage"
                  placeholder="Добро пожаловать в нашу бонусную программу! 🎉"
                  value={formData.welcomeMessage}
                  onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Персонализированное сообщение для новых пользователей
                </p>
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">Активность бота</Label>
                  <p className="text-sm text-muted-foreground">
                    Включить или отключить работу бота
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
          <div className="flex justify-between">
            <div>
              {botSettings && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeactivate}
                  disabled={!botSettings.isActive}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Деактивировать
                </Button>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.botToken.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Сохранение...' : 'Сохранить настройки'}
            </Button>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          {/* Project info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Информация о проекте</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Название</Label>
                <p className="text-sm text-muted-foreground">{project?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Домен</Label>
                <p className="text-sm text-muted-foreground">{project?.domain || 'Не указан'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Процент бонусов</Label>
                <p className="text-sm text-muted-foreground">{project?.bonusPercentage}%</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Срок действия</Label>
                <p className="text-sm text-muted-foreground">{project?.bonusExpiryDays} дней</p>
              </div>
            </CardContent>
          </Card>

          {/* Bot info */}
          {botSettings && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  {botSettings.isActive ? (
                    <Bot className="h-5 w-5 mr-2 text-green-600" />
                  ) : (
                    <BotOff className="h-5 w-5 mr-2 text-gray-400" />
                  )}
                  Статус бота
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Состояние</Label>
                  <p className="text-sm">{getBotStatusBadge()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Имя пользователя</Label>
                  <p className="text-sm text-muted-foreground">
                    {botSettings.botUsername || 'Не указано'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Создан</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(botSettings.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Обновлен</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(botSettings.updatedAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Справка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-medium mb-1">Как создать бота:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Напишите @BotFather в Telegram</li>
                  <li>Отправьте команду /newbot</li>
                  <li>Выберите имя и username</li>
                  <li>Скопируйте токен сюда</li>
                </ol>
              </div>
              <div>
                <p className="font-medium mb-1">Webhook URL:</p>
                <code className="text-xs bg-gray-100 p-1 rounded">
                  {process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/telegram/webhook/{projectId}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 