/**
 * @file: src/app/dashboard/settings/page.tsx
 * @description: Страница системных настроек
 * @project: SaaS Bonus System
 * @dependencies: Next.js, React, UI components
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Shield,
  Bot,
  Mail,
  Database,
  Bell,
  Save,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    timezone: string;
    language: string;
  };
  security: {
    enableTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    enableAuditLog: boolean;
  };
  notifications: {
    enableEmailNotifications: boolean;
    enableSmsNotifications: boolean;
    enableTelegramNotifications: boolean;
    notificationEmail: string;
  };
  integrations: {
    telegramBotToken: string;
    emailSmtpHost: string;
    emailSmtpPort: number;
    emailSmtpUser: string;
    emailSmtpPassword: string;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: 'Gupil.ru',
      siteDescription: 'SaaS система бонусных программ',
      timezone: 'Europe/Moscow',
      language: 'ru'
    },
    security: {
      enableTwoFactor: false,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      enableAuditLog: true
    },
    notifications: {
      enableEmailNotifications: true,
      enableSmsNotifications: false,
      enableTelegramNotifications: true,
      notificationEmail: 'admin@gupil.ru'
    },
    integrations: {
      telegramBotToken: '',
      emailSmtpHost: 'smtp.gmail.com',
      emailSmtpPort: 587,
      emailSmtpUser: '',
      emailSmtpPassword: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      // В реальном приложении здесь был бы запрос к API
      // const response = await fetch('/api/settings');
      // const data = await response.json();
      // setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Ошибка загрузки настроек');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      // В реальном приложении здесь был бы запрос к API
      // const response = await fetch('/api/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // });

      // Имитация сохранения
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Настройки сохранены');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      toast.info('Создание резервной копии...');
      // В реальном приложении здесь был бы запрос к API
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success('Резервная копия создана');
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Ошибка создания резервной копии');
    }
  };

  const handleRestore = async () => {
    try {
      toast.info('Восстановление из резервной копии...');
      // В реальном приложении здесь был бы запрос к API
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success('Данные восстановлены');
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Ошибка восстановления данных');
    }
  };

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='text-center'>
          <div className='border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2'></div>
          <p className='text-muted-foreground'>Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Заголовок */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Настройки системы
          </h1>
          <p className='text-muted-foreground'>
            Управление системными параметрами и конфигурацией
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => router.push('/dashboard')}>
            Вернуться в дашборд
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
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
      <Tabs defaultValue='general' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='general'>
            <Settings className='mr-2 h-4 w-4' />
            Общие
          </TabsTrigger>
          <TabsTrigger value='security'>
            <Shield className='mr-2 h-4 w-4' />
            Безопасность
          </TabsTrigger>
          <TabsTrigger value='notifications'>
            <Bell className='mr-2 h-4 w-4' />
            Уведомления
          </TabsTrigger>
          <TabsTrigger value='integrations'>
            <Bot className='mr-2 h-4 w-4' />
            Интеграции
          </TabsTrigger>
          <TabsTrigger value='backup'>
            <Database className='mr-2 h-4 w-4' />
            Резервные копии
          </TabsTrigger>
        </TabsList>

        {/* Общие настройки */}
        <TabsContent value='general'>
          <Card>
            <CardHeader>
              <CardTitle>Общие настройки</CardTitle>
              <CardDescription>
                Основные параметры системы и интерфейса
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='siteName'>Название сайта</Label>
                  <Input
                    id='siteName'
                    value={settings.general.siteName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: {
                          ...settings.general,
                          siteName: e.target.value
                        }
                      })
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='timezone'>Часовой пояс</Label>
                  <Input
                    id='timezone'
                    value={settings.general.timezone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: {
                          ...settings.general,
                          timezone: e.target.value
                        }
                      })
                    }
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='siteDescription'>Описание сайта</Label>
                <Textarea
                  id='siteDescription'
                  value={settings.general.siteDescription}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: {
                        ...settings.general,
                        siteDescription: e.target.value
                      }
                    })
                  }
                  rows={3}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='language'>Язык интерфейса</Label>
                <Input
                  id='language'
                  value={settings.general.language}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, language: e.target.value }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Настройки безопасности */}
        <TabsContent value='security'>
          <Card>
            <CardHeader>
              <CardTitle>Безопасность</CardTitle>
              <CardDescription>
                Настройки безопасности и контроля доступа
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Двухфакторная аутентификация</Label>
                  <p className='text-muted-foreground text-sm'>
                    Требовать дополнительную проверку при входе
                  </p>
                </div>
                <Switch
                  checked={settings.security.enableTwoFactor}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        enableTwoFactor: checked
                      }
                    })
                  }
                />
              </div>

              <Separator />

              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='sessionTimeout'>Таймаут сессии (часы)</Label>
                  <Input
                    id='sessionTimeout'
                    type='number'
                    value={settings.security.sessionTimeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          sessionTimeout: parseInt(e.target.value)
                        }
                      })
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='maxLoginAttempts'>
                    Максимум попыток входа
                  </Label>
                  <Input
                    id='maxLoginAttempts'
                    type='number'
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          maxLoginAttempts: parseInt(e.target.value)
                        }
                      })
                    }
                  />
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Журнал аудита</Label>
                  <p className='text-muted-foreground text-sm'>
                    Записывать все действия пользователей
                  </p>
                </div>
                <Switch
                  checked={settings.security.enableAuditLog}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        enableAuditLog: checked
                      }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Настройки уведомлений */}
        <TabsContent value='notifications'>
          <Card>
            <CardHeader>
              <CardTitle>Уведомления</CardTitle>
              <CardDescription>Настройки каналов уведомлений</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Email уведомления</Label>
                  <p className='text-muted-foreground text-sm'>
                    Отправлять уведомления по электронной почте
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.enableEmailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        enableEmailNotifications: checked
                      }
                    })
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>SMS уведомления</Label>
                  <p className='text-muted-foreground text-sm'>
                    Отправлять SMS сообщения
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.enableSmsNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        enableSmsNotifications: checked
                      }
                    })
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Telegram уведомления</Label>
                  <p className='text-muted-foreground text-sm'>
                    Отправлять уведомления через Telegram ботов
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.enableTelegramNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        enableTelegramNotifications: checked
                      }
                    })
                  }
                />
              </div>

              <Separator />

              <div className='space-y-2'>
                <Label htmlFor='notificationEmail'>Email для уведомлений</Label>
                <Input
                  id='notificationEmail'
                  type='email'
                  value={settings.notifications.notificationEmail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        notificationEmail: e.target.value
                      }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Интеграции */}
        <TabsContent value='integrations'>
          <Card>
            <CardHeader>
              <CardTitle>Интеграции</CardTitle>
              <CardDescription>
                Настройки внешних сервисов и API
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-2'>
                <Label htmlFor='telegramBotToken'>Telegram Bot Token</Label>
                <Input
                  id='telegramBotToken'
                  type='password'
                  value={settings.integrations.telegramBotToken}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      integrations: {
                        ...settings.integrations,
                        telegramBotToken: e.target.value
                      }
                    })
                  }
                  placeholder='123456789:ABCdefGHIjklMNOpqrsTUVwxyz'
                />
              </div>

              <Separator />

              <div className='space-y-4'>
                <h4 className='text-sm font-medium'>SMTP настройки</h4>

                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='smtpHost'>SMTP хост</Label>
                    <Input
                      id='smtpHost'
                      value={settings.integrations.emailSmtpHost}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          integrations: {
                            ...settings.integrations,
                            emailSmtpHost: e.target.value
                          }
                        })
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='smtpPort'>SMTP порт</Label>
                    <Input
                      id='smtpPort'
                      type='number'
                      value={settings.integrations.emailSmtpPort}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          integrations: {
                            ...settings.integrations,
                            emailSmtpPort: parseInt(e.target.value)
                          }
                        })
                      }
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='smtpUser'>SMTP пользователь</Label>
                  <Input
                    id='smtpUser'
                    value={settings.integrations.emailSmtpUser}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        integrations: {
                          ...settings.integrations,
                          emailSmtpUser: e.target.value
                        }
                      })
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='smtpPassword'>SMTP пароль</Label>
                  <Input
                    id='smtpPassword'
                    type='password'
                    value={settings.integrations.emailSmtpPassword}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        integrations: {
                          ...settings.integrations,
                          emailSmtpPassword: e.target.value
                        }
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Резервные копии */}
        <TabsContent value='backup'>
          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Создать резервную копию</CardTitle>
                <CardDescription>
                  Создать полную резервную копию всех данных системы
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleBackup} className='w-full'>
                  <Download className='mr-2 h-4 w-4' />
                  Создать резервную копию
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Восстановить данные</CardTitle>
                <CardDescription>
                  Восстановить данные из резервной копии
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant='outline'
                  onClick={handleRestore}
                  className='w-full'
                >
                  <Upload className='mr-2 h-4 w-4' />
                  Восстановить данные
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Последние резервные копии</CardTitle>
              <CardDescription>
                Список созданных резервных копий
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='py-8 text-center'>
                <Database className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                <p className='text-muted-foreground'>
                  Резервные копии не найдены
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
