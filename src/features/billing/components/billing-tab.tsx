/**
 * @file: src/features/billing/components/billing-tab.tsx
 * @description: Компонент таба "Биллинг" для объединенной страницы настроек
 * @project: SaaS Bonus System
 * @dependencies: React, UI components
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  TrendingUp,
  Users,
  Bot,
  Calendar,
  Download,
  CheckCircle,
  Crown,
  Zap,
  Star,
  AlertTriangle,
  FileText,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type PlanLimits = {
  projects: number;
  users: number;
  bots: number;
  notifications: number;
};

type PlanPricing = {
  basePrice: number;
  finalPrice: number;
  currency: string;
  hasDiscount: boolean;
  discounts: Array<{ name: string; amountOff: number }>;
};

type BillingPlan = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: PlanLimits;
  popular?: boolean;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  nextPaymentDate?: string | null;
  pricing?: PlanPricing;
};

type UsageMetric = { used: number; limit: number };

type UsageStats = {
  projects: UsageMetric;
  users: UsageMetric;
  bots: UsageMetric;
  notifications: UsageMetric;
};

type PaymentHistoryEntry = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoiceNumber?: string;
  canDownload?: boolean;
};

type SubscriptionInfo = {
  id: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  nextPaymentDate: string | null;
  daysUntilExpiration: number | null;
  expirationWarning: string | null;
  autoRenewEnabled?: boolean;
  hasSavedPaymentMethod?: boolean;
};

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(value);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

const renderLimit = (limit: number) => (limit === -1 ? '∞' : limit);

const getUsagePercentage = (used: number, limit: number) => {
  if (limit === -1 || limit === 0) return 0;
  return Math.min((used / limit) * 100, 100);
};

export function BillingTab() {
  const [currentPlan, setCurrentPlan] = useState<BillingPlan | null>(null);
  const [planCatalog, setPlanCatalog] = useState<BillingPlan[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>(
    []
  );
  const [subscriptionInfo, setSubscriptionInfo] =
    useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPlanId, setChangingPlanId] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(
    null
  );
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<string | null>(null);
  const [promoPricing, setPromoPricing] = useState<Record<string, PlanPricing>>(
    {}
  );
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [enableAutoRenew, setEnableAutoRenew] = useState(true);
  const [savingAutoRenew, setSavingAutoRenew] = useState(false);

  const loadBillingData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/billing');
      if (!response.ok) {
        toast.error('Ошибка загрузки данных биллинга');
        return;
      }
      const data = await response.json();
      setCurrentPlan(data.currentPlan);
      setUsageStats(data.usageStats);
      setSubscriptionInfo(data.subscription);
      if (data.subscription?.autoRenewEnabled !== undefined) {
        setEnableAutoRenew(data.subscription.autoRenewEnabled);
      }
      const payments = data.paymentsWithInvoices || data.paymentHistory || [];
      setPaymentHistory(
        payments.map((p: Record<string, unknown>) => {
          const status = p.status as string;
          return {
            id: p.id as string,
            date: p.date as string,
            amount: p.amount as number,
            currency: p.currency as string,
            description: p.description as string,
            invoiceNumber: p.invoiceNumber as string | undefined,
            canDownload: p.canDownload as boolean | undefined,
            status: (status === 'succeeded'
              ? 'paid'
              : status === 'canceled'
                ? 'failed'
                : status) as 'paid' | 'pending' | 'failed'
          };
        })
      );
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast.error('Ошибка загрузки данных биллинга');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlanCatalog = useCallback(async () => {
    try {
      const response = await fetch(
        '/api/billing/plans?isActive=true&isPublic=true'
      );
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setPlanCatalog(data.plans || []);
    } catch (error) {
      console.error('Error loading plan catalog:', error);
    }
  }, []);

  useEffect(() => {
    loadBillingData();
    loadPlanCatalog();
  }, [loadBillingData, loadPlanCatalog]);

  const handleDownloadInvoice = async (
    paymentId: string,
    invoiceNumber: string
  ) => {
    try {
      setDownloadingInvoice(paymentId);
      const response = await fetch(`/api/billing/invoice/${paymentId}`);

      if (!response.ok) {
        toast.error('Не удалось загрузить счет');
        return;
      }

      const html = await response.text();

      // Открываем в новом окне для печати/сохранения как PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      } else {
        // Fallback: скачиваем как HTML файл
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoiceNumber}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast.success('Счет открыт для печати');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Ошибка загрузки счета');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handleApplyPromo = async () => {
    const code = promoCode.trim();
    if (!code) {
      setPromoApplied(null);
      setPromoPricing({});
      return;
    }

    try {
      setValidatingPromo(true);
      const paidPlans = planCatalog.filter((p) => p.price > 0);
      const results: Record<string, PlanPricing> = {};

      for (const plan of paidPlans) {
        const response = await fetch('/api/billing/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: plan.id, promoCode: code })
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          toast.error(error.error || 'Промокод недействителен');
          setPromoApplied(null);
          setPromoPricing({});
          return;
        }

        const data = await response.json();
        results[plan.id] = {
          basePrice: data.pricing.basePrice,
          finalPrice: data.pricing.finalPrice,
          currency: data.pricing.currency,
          hasDiscount: data.pricing.discounts.length > 0,
          discounts: data.pricing.discounts.map(
            (d: { name: string; amountOff: number }) => ({
              name: d.name,
              amountOff: d.amountOff
            })
          )
        };
      }

      setPromoApplied(code);
      setPromoPricing(results);
      toast.success('Промокод применён');
    } catch {
      toast.error('Ошибка проверки промокода');
    } finally {
      setValidatingPromo(false);
    }
  };

  const getPlanDisplayPrice = (plan: BillingPlan) => {
    const promoPrice = promoPricing[plan.id];
    const catalogPrice = plan.pricing;
    const base = plan.price;
    const final = promoPrice?.finalPrice ?? catalogPrice?.finalPrice ?? base;
    const hasDiscount =
      (promoPrice?.hasDiscount ?? false) ||
      (catalogPrice?.hasDiscount ?? false) ||
      final < base;
    return { base, final, hasDiscount, currency: plan.currency };
  };

  const handleUpdateAutoRenew = async (options: {
    enabled: boolean;
    removePaymentMethod?: boolean;
  }) => {
    try {
      setSavingAutoRenew(true);
      const response = await fetch('/api/billing/auto-renew', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || 'Не удалось обновить автопродление');
        return;
      }

      const data = await response.json();
      setEnableAutoRenew(data.autoRenewEnabled);
      toast.success(
        options.removePaymentMethod
          ? 'Сохранённая карта удалена'
          : options.enabled
            ? 'Автопродление включено'
            : 'Автопродление отключено'
      );
      await loadBillingData();
    } catch {
      toast.error('Ошибка обновления автопродления');
    } finally {
      setSavingAutoRenew(false);
    }
  };

  const handleUpgradePlan = async (plan: BillingPlan) => {
    if (plan.slug === currentPlan?.slug) {
      toast.info('Этот тариф уже активен');
      return;
    }

    try {
      setChangingPlanId(plan.id);
      // Если тариф платный — создаем платеж через ЮKassa
      if (plan.price > 0) {
        const response = await fetch('/api/billing/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.id,
            returnUrl: `${window.location.origin}/dashboard/settings?tab=billing`,
            promoCode: promoApplied || undefined,
            enableAutoRenew
          })
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          toast.error(error.error || 'Не удалось создать платеж');
          return;
        }

        const data = await response.json();
        if (data.confirmationUrl) {
          window.location.href = data.confirmationUrl;
        } else {
          toast.error('Не получена ссылка на оплату');
        }
      } else {
        const response = await fetch('/api/billing/plan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: plan.id })
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          toast.error(error.error || 'Ошибка обновления тарифного плана');
          return;
        }

        const data = await response.json();
        setCurrentPlan(data.plan);
        toast.success(data.message);
        await loadBillingData();
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast.error('Ошибка обновления тарифного плана');
    } finally {
      setChangingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className='flex h-64 w-full items-center justify-center'>
        <div className='text-center'>
          <div className='border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2'></div>
          <p className='text-muted-foreground'>Загрузка данных биллинга...</p>
        </div>
      </div>
    );
  }

  if (!currentPlan || !usageStats) {
    return (
      <div className='flex h-64 w-full items-center justify-center'>
        <div className='text-center'>
          <AlertTriangle className='text-destructive mx-auto mb-4 h-12 w-12' />
          <p className='text-muted-foreground'>
            Не удалось загрузить данные биллинга
          </p>
          <Button variant='outline' className='mt-4' onClick={loadBillingData}>
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  const plansToRender = planCatalog.length ? planCatalog : [currentPlan];

  return (
    <div className='w-full space-y-6'>
      {/* Предупреждение об истечении подписки */}
      {subscriptionInfo?.expirationWarning && (
        <Alert
          variant={
            subscriptionInfo.daysUntilExpiration &&
            subscriptionInfo.daysUntilExpiration <= 0
              ? 'destructive'
              : 'default'
          }
        >
          <AlertTriangle className='h-4 w-4' />
          <AlertTitle>
            {subscriptionInfo.daysUntilExpiration &&
            subscriptionInfo.daysUntilExpiration <= 0
              ? 'Подписка истекла'
              : 'Подписка скоро истекает'}
          </AlertTitle>
          <AlertDescription>
            {subscriptionInfo.expirationWarning}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Crown className='h-5 w-5' />
            Текущий тарифный план
          </CardTitle>
          <CardDescription>
            {currentPlan.startDate
              ? `Активирован: ${formatDate(currentPlan.startDate)}`
              : 'Активная подписка'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div>
              <h3 className='text-2xl font-bold'>{currentPlan.name}</h3>
              <p className='text-muted-foreground'>
                {currentPlan.price === 0
                  ? 'Бесплатно'
                  : `${formatCurrency(currentPlan.price, currentPlan.currency)}/${currentPlan.interval === 'month' ? 'месяц' : 'год'}`}
              </p>
            </div>
            <Badge variant={currentPlan.popular ? 'default' : 'secondary'}>
              {currentPlan.status === 'trial'
                ? 'Пробный период'
                : currentPlan.popular
                  ? 'Популярный'
                  : 'Активный'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {(subscriptionInfo?.hasSavedPaymentMethod ||
        subscriptionInfo?.autoRenewEnabled) && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <CreditCard className='h-5 w-5' />
              Автопродление подписки
            </CardTitle>
            <CardDescription>
              {subscriptionInfo.hasSavedPaymentMethod
                ? 'Карта сохранена в ЮKassa для автоматического продления'
                : 'Автопродление настроено'}
              {subscriptionInfo.nextPaymentDate && (
                <>
                  {' '}
                  · следующее списание{' '}
                  {formatDate(subscriptionInfo.nextPaymentDate)}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Checkbox
                id='manage-auto-renew'
                checked={enableAutoRenew}
                disabled={
                  savingAutoRenew || !subscriptionInfo.hasSavedPaymentMethod
                }
                onCheckedChange={(v) => {
                  const next = v === true;
                  setEnableAutoRenew(next);
                  void handleUpdateAutoRenew({ enabled: next });
                }}
              />
              <Label
                htmlFor='manage-auto-renew'
                className='cursor-pointer font-normal'
              >
                Автоматически продлевать подписку
              </Label>
            </div>
            {subscriptionInfo.hasSavedPaymentMethod && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={savingAutoRenew}
                onClick={() =>
                  handleUpdateAutoRenew({
                    enabled: false,
                    removePaymentMethod: true
                  })
                }
              >
                {savingAutoRenew
                  ? 'Сохранение...'
                  : 'Удалить сохранённую карту'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5' />
            Использование ресурсов
          </CardTitle>
          <CardDescription>
            Текущее потребление лимитов в рамках подписки
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid gap-4 md:grid-cols-2'>
            {[
              {
                label: 'Проекты',
                icon: Users,
                metric: usageStats.projects
              },
              {
                label: 'Пользователи',
                icon: Users,
                metric: usageStats.users
              },
              {
                label: 'Telegram боты',
                icon: Bot,
                metric: usageStats.bots
              },
              {
                label: 'Уведомления',
                icon: Zap,
                metric: usageStats.notifications
              }
            ].map(({ label, icon: Icon, metric }) => (
              <div key={label} className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Icon className='h-4 w-4' />
                    <span className='text-sm font-medium'>{label}</span>
                  </div>
                  <span className='text-muted-foreground text-sm'>
                    {metric.used} / {renderLimit(metric.limit)}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(metric.used, metric.limit)}
                  className='h-2'
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue='plans' className='w-full space-y-4'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='plans' className='flex items-center gap-2'>
            <Star className='h-4 w-4' />
            Тарифные планы
          </TabsTrigger>
          <TabsTrigger value='history' className='flex items-center gap-2'>
            <Calendar className='h-4 w-4' />
            История платежей
          </TabsTrigger>
        </TabsList>

        <TabsContent value='plans'>
          <Card className='mb-6'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>
                Промокод и автопродление
              </CardTitle>
              <CardDescription>
                Скидка применяется при оплате. Автопродление сохраняет карту в
                ЮKassa для продления без повторного ввода.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex flex-col gap-2 sm:flex-row sm:items-end'>
                <div className='flex-1 space-y-2'>
                  <Label htmlFor='promo-code'>Промокод</Label>
                  <Input
                    id='promo-code'
                    placeholder='SUMMER2026'
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  />
                </div>
                <Button
                  type='button'
                  variant='secondary'
                  disabled={validatingPromo || !promoCode.trim()}
                  onClick={handleApplyPromo}
                >
                  {validatingPromo ? 'Проверка...' : 'Применить'}
                </Button>
              </div>
              {promoApplied && (
                <p className='text-muted-foreground text-sm'>
                  Промокод «{promoApplied}» будет учтён при оплате
                </p>
              )}
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='auto-renew'
                  checked={enableAutoRenew}
                  onCheckedChange={(v) => setEnableAutoRenew(v === true)}
                />
                <Label
                  htmlFor='auto-renew'
                  className='cursor-pointer font-normal'
                >
                  Автоматически продлевать подписку
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className='grid gap-6 md:grid-cols-3'>
            {plansToRender.map((plan) => {
              const { base, final, hasDiscount, currency } =
                getPlanDisplayPrice(plan);

              return (
                <Card
                  key={plan.id}
                  className={`relative border-2 ${plan.popular ? 'border-primary' : 'border-border'}`}
                >
                  {plan.popular && (
                    <Badge className='bg-primary text-primary-foreground absolute top-4 right-4 flex items-center gap-1'>
                      <Star className='h-3 w-3' />
                      Популярный
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      <div className='flex flex-wrap items-baseline gap-2'>
                        {plan.price === 0 ? (
                          <span className='text-2xl font-bold'>Бесплатно</span>
                        ) : (
                          <>
                            {hasDiscount && (
                              <span className='text-muted-foreground text-lg line-through'>
                                {formatCurrency(base, currency)}
                              </span>
                            )}
                            <span className='text-2xl font-bold'>
                              {formatCurrency(final, currency)}
                            </span>
                          </>
                        )}
                      </div>
                      {plan.price > 0 && (
                        <p className='text-muted-foreground text-sm'>
                          за {plan.interval === 'month' ? 'месяц' : 'год'}
                        </p>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {plan.description && (
                      <>
                        <p className='text-muted-foreground text-sm'>
                          {plan.description}
                        </p>
                        <Separator />
                      </>
                    )}
                    <ul className='text-muted-foreground space-y-2 text-sm'>
                      {plan.features.map((feature) => (
                        <li key={feature} className='flex items-center gap-2'>
                          <CheckCircle className='h-4 w-4 text-green-500' />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Separator />
                    <ul className='text-muted-foreground space-y-2 text-sm'>
                      <li className='flex items-center justify-between'>
                        <span>Проекты</span>
                        <span>{renderLimit(plan.limits.projects)}</span>
                      </li>
                      <li className='flex items-center justify-between'>
                        <span>Пользователи</span>
                        <span>{renderLimit(plan.limits.users)}</span>
                      </li>
                      <li className='flex items-center justify-between'>
                        <span>Telegram боты</span>
                        <span>{renderLimit(plan.limits.bots)}</span>
                      </li>
                      <li className='flex items-center justify-between'>
                        <span>Уведомления</span>
                        <span>{renderLimit(plan.limits.notifications)}</span>
                      </li>
                    </ul>
                    <Button
                      className='mt-2 w-full'
                      variant={
                        plan.slug === currentPlan.slug ? 'outline' : 'default'
                      }
                      disabled={
                        plan.slug === currentPlan.slug ||
                        changingPlanId === plan.id
                      }
                      onClick={() => handleUpgradePlan(plan)}
                    >
                      {changingPlanId === plan.id
                        ? 'Обновление...'
                        : plan.slug === currentPlan.slug
                          ? 'Текущий план'
                          : 'Выбрать план'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value='history'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='h-5 w-5' />
                История платежей
              </CardTitle>
              <CardDescription>Последние операции по подписке</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentHistory.length === 0 ? (
                <div className='py-8 text-center'>
                  <CreditCard className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                  <p className='text-muted-foreground'>
                    История платежей пока пуста
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {paymentHistory.map((payment) => (
                    <div
                      key={payment.id}
                      className='flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between'
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
                        <div className='text-muted-foreground flex items-center gap-4 text-sm'>
                          <span className='flex items-center gap-1'>
                            <Calendar className='h-3 w-3' />
                            {formatDate(payment.date)}
                          </span>
                          {payment.invoiceNumber && (
                            <span className='flex items-center gap-1'>
                              <FileText className='h-3 w-3' />
                              {payment.invoiceNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className='flex items-center gap-4'>
                        <div className='text-right font-semibold'>
                          {formatCurrency(payment.amount, payment.currency)}
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          disabled={
                            !payment.canDownload ||
                            downloadingInvoice === payment.id
                          }
                          onClick={() =>
                            payment.invoiceNumber &&
                            handleDownloadInvoice(
                              payment.id,
                              payment.invoiceNumber
                            )
                          }
                        >
                          {downloadingInvoice === payment.id ? (
                            <Loader2 className='mr-2 h-3 w-3 animate-spin' />
                          ) : (
                            <Download className='mr-2 h-3 w-3' />
                          )}
                          {payment.canDownload
                            ? 'Скачать счет'
                            : 'Счет недоступен'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
