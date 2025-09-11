/**
 * @file: src/app/dashboard/billing/page.tsx
 * @description: Страница управления подпиской и биллингом
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  TrendingUp,
  Users,
  Bot,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle,
  Crown,
  Zap,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface BillingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    projects: number;
    users: number;
    bots: number;
    notifications: number;
  };
  popular?: boolean;
}

interface UsageStats {
  projects: {
    used: number;
    limit: number;
  };
  users: {
    used: number;
    limit: number;
  };
  bots: {
    used: number;
    limit: number;
  };
  notifications: {
    used: number;
    limit: number;
  };
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoiceUrl?: string;
}

const PLANS: BillingPlan[] = [
  {
    id: 'starter',
    name: 'Стартовый',
    price: 0,
    currency: 'RUB',
    interval: 'month',
    features: [
      'До 1 проекта',
      'До 100 пользователей',
      '1 Telegram бот',
      'Базовые уведомления',
      'Email поддержка'
    ],
    limits: {
      projects: 1,
      users: 100,
      bots: 1,
      notifications: 1000
    }
  },
  {
    id: 'professional',
    name: 'Профессиональный',
    price: 2990,
    currency: 'RUB',
    interval: 'month',
    features: [
      'До 5 проектов',
      'До 1000 пользователей',
      '5 Telegram ботов',
      'Расширенные уведомления',
      'Приоритетная поддержка',
      'Аналитика и отчеты'
    ],
    limits: {
      projects: 5,
      users: 1000,
      bots: 5,
      notifications: 10000
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Корпоративный',
    price: 9990,
    currency: 'RUB',
    interval: 'month',
    features: [
      'Неограниченные проекты',
      'Неограниченные пользователи',
      'Неограниченные боты',
      'Все уведомления',
      'Персональный менеджер',
      'API доступ',
      'Кастомные интеграции'
    ],
    limits: {
      projects: -1,
      users: -1,
      bots: -1,
      notifications: -1
    }
  }
];

export default function BillingPage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<BillingPlan>(PLANS[1]); // Professional
  const [usageStats, setUsageStats] = useState<UsageStats>({
    projects: { used: 2, limit: 5 },
    users: { used: 156, limit: 1000 },
    bots: { used: 3, limit: 5 },
    notifications: { used: 2340, limit: 10000 }
  });
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([
    {
      id: '1',
      date: '2025-01-01',
      amount: 2990,
      currency: 'RUB',
      status: 'paid',
      description: 'Профессиональный план - Январь 2025',
      invoiceUrl: '#'
    },
    {
      id: '2',
      date: '2024-12-01',
      amount: 2990,
      currency: 'RUB',
      status: 'paid',
      description: 'Профессиональный план - Декабрь 2024',
      invoiceUrl: '#'
    },
    {
      id: '3',
      date: '2024-11-01',
      amount: 2990,
      currency: 'RUB',
      status: 'paid',
      description: 'Профессиональный план - Ноябрь 2024',
      invoiceUrl: '#'
    }
  ]);

  const [loading, setLoading] = useState(false);

  const loadBillingData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/billing');
      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data.currentPlan);
        setUsageStats(data.usageStats);
        setPaymentHistory(data.paymentHistory);
      } else {
        toast.error('Ошибка загрузки данных биллинга');
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast.error('Ошибка загрузки данных биллинга');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  const handleUpgradePlan = async (planId: string) => {
    try {
      toast.info('Обновление тарифного плана...');
      // В реальном приложении здесь был бы запрос к API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const plan = PLANS.find((p) => p.id === planId);
      if (plan) {
        setCurrentPlan(plan);
        toast.success(`Тарифный план обновлен на "${plan.name}"`);
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast.error('Ошибка обновления тарифного плана');
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.info('Скачивание счета...');
    // В реальном приложении здесь был бы запрос к API
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='text-center'>
          <div className='border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2'></div>
          <p className='text-muted-foreground'>Загрузка данных биллинга...</p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <div className='space-y-6'>
        {/* Заголовок */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Биллинг</h1>
            <p className='text-muted-foreground'>
              Управление подпиской и тарифными планами
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard')}>
            Вернуться в дашборд
          </Button>
        </div>

        {/* Текущий план */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Crown className='h-5 w-5' />
              Текущий тарифный план
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-2xl font-bold'>{currentPlan.name}</h3>
                <p className='text-muted-foreground'>
                  {currentPlan.price === 0
                    ? 'Бесплатно'
                    : `${formatCurrency(currentPlan.price, currentPlan.currency)}/${currentPlan.interval === 'month' ? 'месяц' : 'год'}`}
                </p>
              </div>
              <Badge variant={currentPlan.popular ? 'default' : 'secondary'}>
                {currentPlan.popular ? 'Популярный' : 'Активный'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Использование ресурсов */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              Использование ресурсов
            </CardTitle>
            <CardDescription>
              Текущее использование ресурсов в рамках вашего тарифного плана
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Users className='h-4 w-4' />
                    <span className='text-sm font-medium'>Проекты</span>
                  </div>
                  <span className='text-muted-foreground text-sm'>
                    {usageStats.projects.used} /{' '}
                    {usageStats.projects.limit === -1
                      ? '∞'
                      : usageStats.projects.limit}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(
                    usageStats.projects.used,
                    usageStats.projects.limit
                  )}
                  className='h-2'
                />
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Users className='h-4 w-4' />
                    <span className='text-sm font-medium'>Пользователи</span>
                  </div>
                  <span className='text-muted-foreground text-sm'>
                    {usageStats.users.used} /{' '}
                    {usageStats.users.limit === -1
                      ? '∞'
                      : usageStats.users.limit}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(
                    usageStats.users.used,
                    usageStats.users.limit
                  )}
                  className='h-2'
                />
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Bot className='h-4 w-4' />
                    <span className='text-sm font-medium'>Telegram боты</span>
                  </div>
                  <span className='text-muted-foreground text-sm'>
                    {usageStats.bots.used} /{' '}
                    {usageStats.bots.limit === -1 ? '∞' : usageStats.bots.limit}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(
                    usageStats.bots.used,
                    usageStats.bots.limit
                  )}
                  className='h-2'
                />
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Zap className='h-4 w-4' />
                    <span className='text-sm font-medium'>Уведомления</span>
                  </div>
                  <span className='text-muted-foreground text-sm'>
                    {usageStats.notifications.used} /{' '}
                    {usageStats.notifications.limit === -1
                      ? '∞'
                      : usageStats.notifications.limit}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(
                    usageStats.notifications.used,
                    usageStats.notifications.limit
                  )}
                  className='h-2'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Основной контент */}
        <Tabs defaultValue='plans' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='plans'>
              <Star className='mr-2 h-4 w-4' />
              Тарифные планы
            </TabsTrigger>
            <TabsTrigger value='history'>
              <Calendar className='mr-2 h-4 w-4' />
              История платежей
            </TabsTrigger>
          </TabsList>

          {/* Тарифные планы */}
          <TabsContent value='plans'>
            <div className='grid gap-4 md:grid-cols-3'>
              {PLANS.map((plan) => (
                <Card
                  key={plan.id}
                  className={plan.popular ? 'ring-primary ring-2' : ''}
                >
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-lg'>{plan.name}</CardTitle>
                      {plan.popular && (
                        <Badge className='bg-primary'>Популярный</Badge>
                      )}
                    </div>
                    <CardDescription>
                      <div className='text-2xl font-bold'>
                        {plan.price === 0
                          ? 'Бесплатно'
                          : formatCurrency(plan.price, plan.currency)}
                      </div>
                      {plan.price > 0 && (
                        <div className='text-muted-foreground text-sm'>
                          за {plan.interval === 'month' ? 'месяц' : 'год'}
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <ul className='space-y-2'>
                      {plan.features.map((feature, index) => (
                        <li
                          key={index}
                          className='flex items-center gap-2 text-sm'
                        >
                          <CheckCircle className='h-4 w-4 text-green-500' />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className='w-full'
                      variant={
                        plan.id === currentPlan.id ? 'outline' : 'default'
                      }
                      disabled={plan.id === currentPlan.id}
                      onClick={() => handleUpgradePlan(plan.id)}
                    >
                      {plan.id === currentPlan.id
                        ? 'Текущий план'
                        : 'Выбрать план'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* История платежей */}
          <TabsContent value='history'>
            <Card>
              <CardHeader>
                <CardTitle>История платежей</CardTitle>
                <CardDescription>Все ваши платежи и счета</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {paymentHistory.length === 0 ? (
                    <div className='py-8 text-center'>
                      <CreditCard className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                      <p className='text-muted-foreground'>
                        Платежи не найдены
                      </p>
                    </div>
                  ) : (
                    paymentHistory.map((payment) => (
                      <div
                        key={payment.id}
                        className='flex items-center justify-between rounded-lg border p-4'
                      >
                        <div className='space-y-1'>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium'>
                              {payment.description}
                            </span>
                            <Badge
                              variant={
                                payment.status === 'paid'
                                  ? 'default'
                                  : payment.status === 'pending'
                                    ? 'secondary'
                                    : 'destructive'
                              }
                            >
                              {payment.status === 'paid'
                                ? 'Оплачено'
                                : payment.status === 'pending'
                                  ? 'В ожидании'
                                  : 'Ошибка'}
                            </Badge>
                          </div>
                          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                            <Calendar className='h-3 w-3' />
                            {formatDate(payment.date)}
                          </div>
                        </div>

                        <div className='flex items-center gap-4'>
                          <div className='text-right'>
                            <div className='font-medium'>
                              {formatCurrency(payment.amount, payment.currency)}
                            </div>
                          </div>

                          {payment.invoiceUrl && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleDownloadInvoice(payment.id)}
                            >
                              <Download className='h-4 w-4' />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
