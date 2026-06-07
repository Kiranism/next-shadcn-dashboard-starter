/**
 * @file: src/app/api/billing/route.ts
 * @description: API endpoint для получения данных биллинга
 * @project: SaaS Bonus System
 * @dependencies: Prisma, JWT auth
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJwt } from '@/lib/jwt';
import { logger } from '@/lib/logger';
import { BillingService } from '@/lib/services/billing.service';
import { formatPlan, toNumber } from '@/lib/services/billing-plan.utils';
import { InvoiceService } from '@/lib/services/invoice.service';
import { Prisma } from '@prisma/client';

const buildPaymentHistory = async (
  subscription:
    | (Awaited<ReturnType<typeof db.subscription.findFirst>> & {
        history: Awaited<ReturnType<typeof db.subscriptionHistory.findMany>>;
        plan: Awaited<ReturnType<typeof db.subscriptionPlan.findFirst>> | null;
      })
    | null,
  fallbackPlan: ReturnType<typeof formatPlan>
) => {
  if (!subscription) {
    return [];
  }

  const planIdSet = new Set<string>();
  subscription.history.forEach((event) => {
    if (event.fromPlanId) planIdSet.add(event.fromPlanId);
    if (event.toPlanId) planIdSet.add(event.toPlanId);
  });

  if (fallbackPlan.id) {
    planIdSet.add(fallbackPlan.id);
  }

  const relatedPlans = planIdSet.size
    ? await db.subscriptionPlan.findMany({
        where: { id: { in: Array.from(planIdSet) } },
        select: { id: true, name: true }
      })
    : [];

  const nameMap = new Map<string, string>();
  relatedPlans.forEach((plan) => nameMap.set(plan.id, plan.name));

  const describeAction = (action: string) => {
    switch (action) {
      case 'created':
        return 'Подписка активирована';
      case 'upgraded':
        return 'Апгрейд подписки';
      case 'downgraded':
        return 'Даунгрейд подписки';
      case 'renewed':
        return 'Подписка продлена';
      case 'cancelled':
        return 'Подписка отменена';
      case 'auto_renew_changed':
        return 'Изменение автопродления';
      default:
        return 'Изменение подписки';
    }
  };

  const currentPlanPrice = subscription.plan
    ? toNumber(subscription.plan.price)
    : fallbackPlan.price;
  const currentPlanCurrency =
    subscription.plan?.currency ?? fallbackPlan.currency;

  const entries = subscription.history.map((event) => {
    const fromPlan = event.fromPlanId ? nameMap.get(event.fromPlanId) : null;
    const toPlan = event.toPlanId
      ? (nameMap.get(event.toPlanId) ?? fallbackPlan.name)
      : fallbackPlan.name;
    const planNameChange =
      fromPlan && toPlan ? `${fromPlan} → ${toPlan}` : toPlan;

    return {
      id: event.id,
      date: event.createdAt.toISOString(),
      amount: currentPlanPrice,
      currency: currentPlanCurrency,
      status:
        event.action === 'cancelled' ? ('failed' as const) : ('paid' as const),
      description: `${describeAction(event.action)}${planNameChange ? ` (${planNameChange})` : ''}`
    };
  });

  if (!entries.length && subscription.startDate) {
    entries.push({
      id: `${subscription.id}-start`,
      date: subscription.startDate.toISOString(),
      amount: currentPlanPrice,
      currency: currentPlanCurrency,
      status: 'paid' as const,
      description: `${fallbackPlan.name} — подписка активирована`
    });
  }

  return entries;
};

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('sb_auth')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const admin = await db.adminAccount.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const activeSubscription = await BillingService.getActiveSubscription(
      admin.id
    );

    const subscription = activeSubscription
      ? {
          ...activeSubscription,
          history: await db.subscriptionHistory.findMany({
            where: { subscriptionId: activeSubscription.id },
            orderBy: { createdAt: 'desc' },
            take: 10
          })
        }
      : null;

    let planRecord = subscription?.plan;

    if (!planRecord) {
      planRecord =
        (await db.subscriptionPlan.findFirst({
          where: { slug: 'free' }
        })) ||
        (await db.subscriptionPlan.findFirst({
          orderBy: { sortOrder: 'asc' }
        }));
    }

    if (!planRecord) {
      // Fallback if DB is empty
      planRecord = {
        id: 'fallback-free',
        slug: 'free',
        name: 'Free (Fallback)',
        description: 'Базовый тариф',
        price: new Prisma.Decimal(0),
        currency: 'RUB',
        interval: 'month',
        features: JSON.stringify(['Базовый доступ']),
        maxProjects: 1,
        maxUsersPerProject: 10,
        maxBots: 1,
        maxNotifications: 100,
        isActive: true,
        isPublic: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;
    }

    const currentPlan = formatPlan(planRecord, {
      status: subscription?.status ?? null,
      startDate: subscription?.startDate ?? null,
      endDate: subscription?.endDate ?? null,
      nextPaymentDate: subscription?.nextPaymentDate ?? null
    });

    const [projectsCount, usersCount, botsCount, notificationsCount] =
      await Promise.all([
        db.project.count({ where: { ownerId: admin.id } }),
        db.user.count({ where: { project: { ownerId: admin.id } } }),
        db.botSettings.count({ where: { project: { ownerId: admin.id } } }),
        db.notification.count({ where: { project: { ownerId: admin.id } } })
      ]);

    const usageStats = {
      projects: { used: projectsCount, limit: currentPlan.limits.projects },
      users: { used: usersCount, limit: currentPlan.limits.users },
      bots: { used: botsCount, limit: currentPlan.limits.bots },
      notifications: {
        used: notificationsCount,
        limit: currentPlan.limits.notifications
      }
    };

    const paymentHistory = await buildPaymentHistory(subscription, currentPlan);

    // Получаем платежи с инвойсами
    const paymentsWithInvoices = await InvoiceService.getPaymentsWithInvoices(
      admin.id
    );

    // Вычисляем дни до истечения подписки
    let daysUntilExpiration: number | null = null;
    let expirationWarning: string | null = null;

    if (subscription?.endDate) {
      const now = new Date();
      const endDate = new Date(subscription.endDate);
      const diffTime = endDate.getTime() - now.getTime();
      daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysUntilExpiration <= 0) {
        expirationWarning =
          'Ваша подписка истекла. Продлите её для доступа к платным функциям.';
      } else if (daysUntilExpiration <= 7) {
        expirationWarning = `Ваша подписка истекает через ${daysUntilExpiration} ${getDaysWord(daysUntilExpiration)}. Не забудьте продлить!`;
      }
    }

    return NextResponse.json({
      currentPlan,
      usageStats,
      paymentHistory,
      paymentsWithInvoices,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            startDate: subscription.startDate?.toISOString() ?? null,
            endDate: subscription.endDate?.toISOString() ?? null,
            nextPaymentDate:
              subscription.nextPaymentDate?.toISOString() ?? null,
            daysUntilExpiration,
            expirationWarning,
            autoRenewEnabled: subscription.autoRenewEnabled,
            hasSavedPaymentMethod: Boolean(subscription.paymentMethod)
          }
        : null
    });
  } catch (error) {
    logger.error('Error fetching billing data:', { error: String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Склонение слова "день"
 */
function getDaysWord(days: number): string {
  if (days === 1) return 'день';
  if (days >= 2 && days <= 4) return 'дня';
  return 'дней';
}
