/**
 * @file: src/app/dashboard/settings/page.tsx
 * @description: Страница настроек профиля администратора
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Shield,
  Bell,
  Key,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Mail,
  Phone,
  Calendar,
  Crown
} from 'lucide-react';
import { toast } from 'sonner';

interface ProfileSettings {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar: string;
  };
  security: {
    enableTwoFactor: boolean;
    sessionTimeout: number;
    changePassword: boolean;
  };
  notifications: {
    enableEmailNotifications: boolean;
    enableSystemNotifications: boolean;
    enableSecurityAlerts: boolean;
    notificationEmail: string;
  };
  preferences: {
    language: string;
    timezone: string;
    theme: string;
    dateFormat: string;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<ProfileSettings>({
    personal: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      avatar: ''
    },
    security: {
      enableTwoFactor: false,
      sessionTimeout: 24,
      changePassword: false
    },
    notifications: {
      enableEmailNotifications: true,
      enableSystemNotifications: true,
      enableSecurityAlerts: true,
      notificationEmail: ''
    },
    preferences: {
      language: 'ru',
      timezone: 'Europe/Moscow',
      theme: 'system',
      dateFormat: 'DD.MM.YYYY'
    }
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/profile/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else {
        toast.error('Ошибка загрузки настроек профиля');
      }
    } catch (error) {
      console.error('Error loading profile settings:', error);
      toast.error('Ошибка загрузки настроек профиля');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/profile/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        toast.success('Настройки профиля сохранены');
      } else {
        toast.error('Ошибка сохранения настроек');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    section: keyof ProfileSettings,
    field: string,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <PageContainer>
        <div className='flex h-64 items-center justify-center'>
          <div className='text-center'>
            <div className='border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2'></div>
            <p className='text-muted-foreground'>
              Загрузка настроек профиля...
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='space-y-6'>
        {/* Заголовок */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Настройки профиля
            </h1>
            <p className='text-muted-foreground'>
              Управление настройками вашего профиля
            </p>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => router.push('/dashboard')}>
              Вернуться в дашборд
            </Button>
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className='mr-2 h-4 w-4' />
                  Сохранить
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Основной контент */}
        <Tabs defaultValue='personal' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='personal'>
              <User className='mr-2 h-4 w-4' />
              Личная информация
            </TabsTrigger>
            <TabsTrigger value='security'>
              <Shield className='mr-2 h-4 w-4' />
              Безопасность
            </TabsTrigger>
            <TabsTrigger value='notifications'>
              <Bell className='mr-2 h-4 w-4' />
              Уведомления
            </TabsTrigger>
            <TabsTrigger value='preferences'>
              <Key className='mr-2 h-4 w-4' />
              Предпочтения
            </TabsTrigger>
          </TabsList>

          {/* Личная информация */}
          <TabsContent value='personal'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <User className='h-5 w-5' />
                  Личная информация
                </CardTitle>
                <CardDescription>
                  Основная информация о вашем профиле
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Аватар */}
                <div className='flex items-center gap-4'>
                  <Avatar className='h-20 w-20'>
                    <AvatarImage src={settings.personal.avatar} />
                    <AvatarFallback className='text-lg'>
                      {settings.personal.firstName?.[0] || 'A'}
                      {settings.personal.lastName?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant='outline' size='sm'>
                      Изменить фото
                    </Button>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      JPG, PNG до 2MB
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Основные поля */}
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='firstName'>Имя</Label>
                    <Input
                      id='firstName'
                      value={settings.personal.firstName}
                      onChange={(e) =>
                        handleInputChange(
                          'personal',
                          'firstName',
                          e.target.value
                        )
                      }
                      placeholder='Введите ваше имя'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='lastName'>Фамилия</Label>
                    <Input
                      id='lastName'
                      value={settings.personal.lastName}
                      onChange={(e) =>
                        handleInputChange(
                          'personal',
                          'lastName',
                          e.target.value
                        )
                      }
                      placeholder='Введите вашу фамилию'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      value={settings.personal.email}
                      onChange={(e) =>
                        handleInputChange('personal', 'email', e.target.value)
                      }
                      placeholder='example@domain.com'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Телефон</Label>
                    <Input
                      id='phone'
                      type='tel'
                      value={settings.personal.phone}
                      onChange={(e) =>
                        handleInputChange('personal', 'phone', e.target.value)
                      }
                      placeholder='+7 (999) 123-45-67'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Безопасность */}
          <TabsContent value='security'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Shield className='h-5 w-5' />
                  Безопасность
                </CardTitle>
                <CardDescription>
                  Настройки безопасности вашего аккаунта
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <Label>Двухфакторная аутентификация</Label>
                      <p className='text-muted-foreground text-sm'>
                        Дополнительная защита вашего аккаунта
                      </p>
                    </div>
                    <Switch
                      checked={settings.security.enableTwoFactor}
                      onCheckedChange={(checked) =>
                        handleInputChange(
                          'security',
                          'enableTwoFactor',
                          checked
                        )
                      }
                    />
                  </div>

                  <Separator />

                  <div className='space-y-2'>
                    <Label htmlFor='sessionTimeout'>
                      Таймаут сессии (часы)
                    </Label>
                    <Input
                      id='sessionTimeout'
                      type='number'
                      value={settings.security.sessionTimeout}
                      onChange={(e) =>
                        handleInputChange(
                          'security',
                          'sessionTimeout',
                          parseInt(e.target.value)
                        )
                      }
                      min={1}
                      max={168}
                    />
                    <p className='text-muted-foreground text-sm'>
                      Автоматический выход из системы через указанное время
                    </p>
                  </div>

                  <Separator />

                  <div className='space-y-2'>
                    <Label>Смена пароля</Label>
                    <Button variant='outline' className='w-full'>
                      Изменить пароль
                    </Button>
                    <p className='text-muted-foreground text-sm'>
                      Рекомендуется менять пароль каждые 3 месяца
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Уведомления */}
          <TabsContent value='notifications'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Bell className='h-5 w-5' />
                  Уведомления
                </CardTitle>
                <CardDescription>
                  Настройки уведомлений для вашего профиля
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <Label>Email уведомления</Label>
                      <p className='text-muted-foreground text-sm'>
                        Получать уведомления на email
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.enableEmailNotifications}
                      onCheckedChange={(checked) =>
                        handleInputChange(
                          'notifications',
                          'enableEmailNotifications',
                          checked
                        )
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <Label>Системные уведомления</Label>
                      <p className='text-muted-foreground text-sm'>
                        Уведомления о важных событиях в системе
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.enableSystemNotifications}
                      onCheckedChange={(checked) =>
                        handleInputChange(
                          'notifications',
                          'enableSystemNotifications',
                          checked
                        )
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <Label>Уведомления безопасности</Label>
                      <p className='text-muted-foreground text-sm'>
                        Критические уведомления о безопасности
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.enableSecurityAlerts}
                      onCheckedChange={(checked) =>
                        handleInputChange(
                          'notifications',
                          'enableSecurityAlerts',
                          checked
                        )
                      }
                    />
                  </div>

                  <Separator />

                  <div className='space-y-2'>
                    <Label htmlFor='notificationEmail'>
                      Email для уведомлений
                    </Label>
                    <Input
                      id='notificationEmail'
                      type='email'
                      value={settings.notifications.notificationEmail}
                      onChange={(e) =>
                        handleInputChange(
                          'notifications',
                          'notificationEmail',
                          e.target.value
                        )
                      }
                      placeholder='notifications@domain.com'
                    />
                    <p className='text-muted-foreground text-sm'>
                      Адрес для получения системных уведомлений
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Предпочтения */}
          <TabsContent value='preferences'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Key className='h-5 w-5' />
                  Предпочтения
                </CardTitle>
                <CardDescription>
                  Персональные настройки интерфейса
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='language'>Язык</Label>
                    <select
                      id='language'
                      className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                      value={settings.preferences.language}
                      onChange={(e) =>
                        handleInputChange(
                          'preferences',
                          'language',
                          e.target.value
                        )
                      }
                    >
                      <option value='ru'>Русский</option>
                      <option value='en'>English</option>
                    </select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='timezone'>Часовой пояс</Label>
                    <select
                      id='timezone'
                      className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                      value={settings.preferences.timezone}
                      onChange={(e) =>
                        handleInputChange(
                          'preferences',
                          'timezone',
                          e.target.value
                        )
                      }
                    >
                      <option value='Europe/Moscow'>Москва (UTC+3)</option>
                      <option value='Europe/London'>Лондон (UTC+0)</option>
                      <option value='America/New_York'>Нью-Йорк (UTC-5)</option>
                    </select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='theme'>Тема</Label>
                    <select
                      id='theme'
                      className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                      value={settings.preferences.theme}
                      onChange={(e) =>
                        handleInputChange(
                          'preferences',
                          'theme',
                          e.target.value
                        )
                      }
                    >
                      <option value='system'>Системная</option>
                      <option value='light'>Светлая</option>
                      <option value='dark'>Темная</option>
                    </select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='dateFormat'>Формат даты</Label>
                    <select
                      id='dateFormat'
                      className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                      value={settings.preferences.dateFormat}
                      onChange={(e) =>
                        handleInputChange(
                          'preferences',
                          'dateFormat',
                          e.target.value
                        )
                      }
                    >
                      <option value='DD.MM.YYYY'>DD.MM.YYYY</option>
                      <option value='MM/DD/YYYY'>MM/DD/YYYY</option>
                      <option value='YYYY-MM-DD'>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
