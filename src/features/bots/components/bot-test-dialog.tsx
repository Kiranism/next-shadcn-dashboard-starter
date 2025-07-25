/**
 * @file: src/features/bots/components/bot-test-dialog.tsx
 * @description: Диалог для тестирования Telegram бота
 * @project: SaaS Bonus System
 * @dependencies: React, Dialog components
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

'use client';

import { useState } from 'react';
import { MessageSquare, Send, Copy, ExternalLink, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { BotSettings, Project } from '@/types/bonus';

interface BotTestDialogProps {
  project: Project;
  botSettings: BotSettings;
  trigger?: React.ReactNode;
}

export function BotTestDialog({ project, botSettings, trigger }: BotTestDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const runBotTest = async () => {
    try {
      setTesting(true);
      
      // Определяем dev режим по URL (в клиентском коде process.env.NODE_ENV может быть недоступен)
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isDev) {
        // Тестируем через dev API
        const testResponse = await fetch('/api/dev/bot-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: project.id,
            message: '/start'
          }),
        });
        
        const testResult = await testResponse.json();
        
        // Получаем информацию о боте
        const infoResponse = await fetch(`/api/dev/bot-test?projectId=${project.id}`);
        const infoResult = await infoResponse.json();
        
        setTestResults({ ...testResult, ...infoResult });
        
        if (testResult.success) {
          toast({
            title: 'Тест пройден (Dev режим)',
            description: 'Бот обработал тестовое сообщение',
          });
        } else {
          toast({
            title: 'Проблема с ботом',
            description: testResult.error || 'Бот не отвечает',
            variant: 'destructive',
          });
        }
      } else {
        // Обычная проверка webhook в production
        const response = await fetch(`/api/telegram/webhook/${project.id}`);
        const result = await response.json();
        
        setTestResults(result);
        
        if (result.isRunning) {
          toast({
            title: 'Тест пройден',
            description: 'Бот работает корректно',
          });
        } else {
          toast({
            title: 'Проблема с ботом',
            description: result.error || 'Бот не отвечает',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Ошибка тестирования',
        description: 'Не удалось проверить состояние бота',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Скопировано',
      description: 'Текст скопирован в буфер обмена',
    });
  };

  const openTelegram = () => {
    if (botSettings.botUsername) {
      window.open(`https://t.me/${botSettings.botUsername.replace('@', '')}`, '_blank');
    }
  };

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/telegram/webhook/${project.id}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <TestTube className="h-4 w-4 mr-2" />
            Тест бота
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Тестирование бота: {project.name}
          </DialogTitle>
          <DialogDescription>
            Проверка работы Telegram бота и просмотр доступных команд
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Bot info and test */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Информация о боте</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Статус</Label>
                  <div className="mt-1">
                    {botSettings.isActive ? (
                      <Badge variant="default" className="bg-green-600">Активен</Badge>
                    ) : (
                      <Badge variant="destructive">Неактивен</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Имя пользователя</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      value={botSettings.botUsername || 'Не указано'}
                      readOnly
                      className="text-sm"
                    />
                    {botSettings.botUsername && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(botSettings.botUsername!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Webhook URL</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      value={webhookUrl}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(webhookUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Приветственное сообщение</Label>
                  <Textarea
                    value={botSettings.welcomeMessage || 'Не задано'}
                    readOnly
                    rows={3}
                    className="mt-1 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Тестирование</CardTitle>
                <CardDescription>
                  {(typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
                    ? 'Development режим: polling + тестирование через API'
                    : 'Проверьте работоспособность бота'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    onClick={runBotTest}
                    disabled={testing || !botSettings.isActive}
                    className="flex-1"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testing ? 'Тестирование...' : 'Проверить бота'}
                  </Button>
                  {botSettings.botUsername && (
                    <Button
                      variant="outline"
                      onClick={openTelegram}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Открыть в Telegram
                    </Button>
                  )}
                </div>

                {(typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Label className="text-sm font-medium text-green-800">✅ Development режим:</Label>
                    <p className="text-xs mt-1 text-green-700">
                      Бот использует polling - реальные пользователи могут писать ему в Telegram!
                      Также доступно тестирование через API в этом интерфейсе.
                    </p>
                  </div>
                )}

                {testResults && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium">Результат теста:</Label>
                    <pre className="text-xs mt-1 overflow-x-auto">
                      {JSON.stringify(testResults, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right side - Commands preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Доступные команды</CardTitle>
                <CardDescription>
                  Команды, которые понимает ваш бот
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono">/start</code>
                      <Badge variant="outline">Главная</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Начальное приветствие и привязка аккаунта
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono">/balance</code>
                      <Badge variant="outline">Баланс</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Проверка баланса бонусов пользователя
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono">/history</code>
                      <Badge variant="outline">История</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      История начислений и списаний бонусов
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono">/help</code>
                      <Badge variant="outline">Помощь</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Справка по использованию бота
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Интеграция</CardTitle>
                <CardDescription>
                  Как интегрировать бота с вашим сайтом
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <Label className="font-medium">1. Webhook для регистрации:</Label>
                  <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
                    POST /api/webhook/{project.webhookSecret}
                  </code>
                </div>
                <div>
                  <Label className="font-medium">2. Уведомления автоматические:</Label>
                  <p className="text-muted-foreground mt-1">
                    Бот автоматически отправляет уведомления о начислении и списании бонусов
                  </p>
                </div>
                <div>
                  <Label className="font-medium">3. Привязка аккаунтов:</Label>
                  <p className="text-muted-foreground mt-1">
                    Пользователи могут привязать Telegram через номер телефона или email
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 