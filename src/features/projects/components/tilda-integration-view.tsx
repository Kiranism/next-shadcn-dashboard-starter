/**
 * @file: tilda-integration-view.tsx
 * @description: Компонент для настройки интеграции с Tilda
 * @project: SaaS Bonus System
 * @dependencies: React, shadcn/ui
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Copy, CheckCircle2, AlertCircle, Code, Webhook, Settings } from 'lucide-react';
import { Project } from '@/types';
import { PageContainer } from '@/components/page-container';

export function ProjectIntegrationView({ params }: { params: Promise<{ id: string }> }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [widgetUrl, setWidgetUrl] = useState('');
  const resolvedParams = useParams();
  const projectId = resolvedParams?.id as string;

  useEffect(() => {
    if (!projectId) return;
    
    // Формируем URL для виджета
    const currentUrl = window.location.origin;
    setWidgetUrl(`${currentUrl}/tilda-bonus-widget.js`);
    
    // Загружаем данные проекта
    loadProject();
  }, [projectId]);

  async function loadProject() {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to load project');
      
      const data = await response.json();
      setProject(data);
    } catch (error) {
      toast.error('Ошибка загрузки проекта');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, type: string) {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Скопировано в буфер обмена');
    
    setTimeout(() => setCopied(null), 3000);
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </PageContainer>
    );
  }

  if (!project) {
    return (
      <PageContainer>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>Проект не найден</AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  const webhookUrl = `${window.location.origin}/api/webhook/${project.webhookSecret}`;
  
  const widgetCode = `<!-- Бонусная система для Tilda -->
<script src="${widgetUrl}"></script>
<script>
  // Инициализация виджета бонусной системы
  TildaBonusWidget.init({
    projectId: '${projectId}',
    apiUrl: '${window.location.origin}',
    bonusToRuble: 1, // 1 бонус = 1 рубль
    minOrderAmount: 100, // Минимальная сумма заказа
    debug: false // Включить отладку в консоли
  });
</script>`;

  const testWebhookData = JSON.stringify({
    action: "purchase",
    payload: {
      userEmail: "test@example.com",
      purchaseAmount: 1000,
      orderId: "TEST-" + Date.now(),
      description: "Тестовый заказ"
    }
  }, null, 2);

  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        {/* Заголовок */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Интеграция с Tilda</h1>
          <p className="text-muted-foreground mt-2">
            Настройте интеграцию бонусной системы с вашим сайтом на Tilda
          </p>
        </div>

        {/* Статус интеграции */}
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Готово к интеграции</AlertTitle>
          <AlertDescription>
            Следуйте инструкциям ниже для подключения бонусной системы к вашему сайту
          </AlertDescription>
        </Alert>

        {/* Табы с инструкциями */}
        <Tabs defaultValue="widget" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="widget">
              <Code className="mr-2 h-4 w-4" />
              Виджет
            </TabsTrigger>
            <TabsTrigger value="webhook">
              <Webhook className="mr-2 h-4 w-4" />
              Webhook
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Настройки
            </TabsTrigger>
          </TabsList>

          {/* Виджет */}
          <TabsContent value="widget" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Шаг 1: Установка виджета</CardTitle>
                <CardDescription>
                  Вставьте этот код в настройки вашего сайта на Tilda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Где вставить код:</Label>
                  <p className="text-sm text-muted-foreground">
                    Настройки сайта → Дополнительно → Вставить код → В футер (перед &lt;/body&gt;)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Код для вставки:</Label>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{widgetCode}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(widgetCode, 'widget')}
                    >
                      {copied === 'widget' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Что делает виджет:</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Показывает баланс бонусов в корзине</li>
                      <li>Позволяет применить бонусы к заказу</li>
                      <li>Автоматически определяет пользователя по email/телефону</li>
                      <li>Работает со всеми типами корзин Tilda</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhook */}
          <TabsContent value="webhook" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Шаг 2: Настройка Webhook</CardTitle>
                <CardDescription>
                  Настройте автоматическую отправку данных о заказах
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook URL:</Label>
                  <div className="flex space-x-2">
                    <Input 
                      value={webhookUrl} 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                    >
                      {copied === 'webhook' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Где настроить в Tilda:</Label>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                    <li>Перейдите в настройки сайта</li>
                    <li>Найдите раздел "Уведомления и интеграции"</li>
                    <li>Добавьте новый webhook</li>
                    <li>Вставьте URL и выберите тип "Заказы"</li>
                    <li>Сохраните настройки</li>
                  </ol>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Тестовые данные для проверки:</Label>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{testWebhookData}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(testWebhookData, 'test')}
                    >
                      {copied === 'test' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Используйте эти данные для тестирования webhook через Postman или curl
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Настройки */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Настройки интеграции</CardTitle>
                <CardDescription>
                  Дополнительные параметры для тонкой настройки
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bonus-rate">Курс бонусов</Label>
                    <Input 
                      id="bonus-rate" 
                      type="number" 
                      defaultValue="1" 
                      min="0.1" 
                      step="0.1"
                    />
                    <p className="text-sm text-muted-foreground">
                      Сколько рублей равен 1 бонус
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min-order">Минимальная сумма заказа</Label>
                    <Input 
                      id="min-order" 
                      type="number" 
                      defaultValue="100" 
                      min="0"
                    />
                    <p className="text-sm text-muted-foreground">
                      Минимальная сумма для применения бонусов
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-percent">Максимальный процент оплаты бонусами</Label>
                    <Input 
                      id="max-percent" 
                      type="number" 
                      defaultValue="50" 
                      min="1" 
                      max="100"
                    />
                    <p className="text-sm text-muted-foreground">
                      Какую часть заказа можно оплатить бонусами (в %)
                    </p>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Примечание</AlertTitle>
                  <AlertDescription>
                    Эти настройки применяются только к новым заказам. 
                    Изменения вступят в силу после обновления кода виджета на сайте.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end">
                  <Button>Сохранить настройки</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Дополнительная информация */}
        <Card>
          <CardHeader>
            <CardTitle>Нужна помощь?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">📚 Документация</h4>
                <p className="text-sm text-muted-foreground">
                  Подробное руководство по интеграции с примерами кода
                </p>
                <Button variant="link" className="px-0 mt-2">
                  Читать документацию →
                </Button>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">💬 Техподдержка</h4>
                <p className="text-sm text-muted-foreground">
                  Свяжитесь с нами, если возникли вопросы
                </p>
                <Button variant="link" className="px-0 mt-2">
                  Написать в поддержку →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}