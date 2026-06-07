/**
 * @file: src/lib/services/subscription-renewal.service.ts
 * @description: Автопродление подписок через сохранённый способ оплаты ЮKassa
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import { randomUUID } from 'crypto';
import { Prisma, SubscriptionPlan } from '@prisma/client';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { calculatePlanPricing } from '@/lib/services/billing-pricing.service';
import { toNumber } from '@/lib/services/billing-plan.utils';
import { createYooKassaPayment } from '@/lib/yookassa/client';

export class SubscriptionRenewalService {
  /**
   * Находит подписки с включённым автопродлением и наступившей датой оплаты.
   */
  static async processDueRenewals(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    skipped: number;
    errors: string[];
  }> {
    const now = new Date();
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + 1);

    const dueSubscriptions = await db.subscription.findMany({
      where: {
        status: 'active',
        autoRenewEnabled: true,
        paymentMethod: { not: null },
        nextPaymentDate: { lte: horizon },
        OR: [{ endDate: null }, { endDate: { lte: horizon } }]
      },
      include: {
        plan: true,
        adminAccount: { select: { id: true, email: true } }
      }
    });

    const result = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const subscription of dueSubscriptions) {
      result.processed++;

      if (toNumber(subscription.plan.price) <= 0) {
        result.skipped++;
        continue;
      }

      if (!subscription.paymentMethod) {
        result.skipped++;
        continue;
      }

      try {
        const outcome = await this.chargeRenewal(subscription);
        if (outcome === 'succeeded') result.succeeded++;
        else if (outcome === 'failed') result.failed++;
        else result.skipped++;
      } catch (error) {
        result.failed++;
        const message = error instanceof Error ? error.message : String(error);
        result.errors.push(`${subscription.id}: ${message}`);
        logger.error('Subscription renewal failed', {
          subscriptionId: subscription.id,
          error: message
        });
      }
    }

    return result;
  }

  private static async chargeRenewal(subscription: {
    id: string;
    adminAccountId: string;
    planId: string;
    paymentMethod: string | null;
    plan: SubscriptionPlan;
    adminAccount: { id: string; email: string | null };
  }): Promise<'succeeded' | 'failed' | 'pending'> {
    const planDiscounts = await db.planDiscount.findMany({
      where: { planId: subscription.planId, isActive: true }
    });

    const pricing = calculatePlanPricing({
      plan: subscription.plan,
      planDiscounts,
      promo: null,
      intervalMonths: subscription.plan.interval === 'year' ? 12 : 1
    });

    const idempotenceKey = randomUUID();
    const description = `Автопродление тарифа ${subscription.plan.name}`;

    const paymentRecord = await db.payment.create({
      data: {
        adminAccountId: subscription.adminAccountId,
        subscriptionId: subscription.id,
        planId: subscription.planId,
        amount: pricing.finalPrice,
        currency: subscription.plan.currency,
        status: 'created',
        provider: 'yookassa',
        providerPaymentId: `temp-${idempotenceKey}`,
        description,
        metadata: {
          type: 'auto_renew',
          subscriptionId: subscription.id,
          pricing,
          enableAutoRenew: true
        } as Prisma.InputJsonValue
      }
    });

    const ykResult = await createYooKassaPayment(
      {
        amount: {
          value: pricing.finalPrice.toFixed(2),
          currency: subscription.plan.currency || 'RUB'
        },
        capture: true,
        description,
        payment_method_id: subscription.paymentMethod!,
        metadata: {
          adminId: subscription.adminAccountId,
          planId: subscription.planId,
          paymentRecordId: paymentRecord.id,
          type: 'auto_renew',
          enableAutoRenew: 'true'
        }
      },
      idempotenceKey
    );

    if (ykResult.ok === false) {
      await db.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: 'failed',
          metadata: { error: ykResult.body } as Prisma.InputJsonValue
        }
      });
      return 'failed';
    }

    const data = ykResult.data;
    const providerPaymentId = String(data.id);
    const status = String(data.status || 'pending');

    await db.payment.update({
      where: { id: paymentRecord.id },
      data: {
        providerPaymentId,
        status,
        metadata: data as Prisma.InputJsonValue
      }
    });

    if (status === 'succeeded') {
      await this.activateRenewedSubscription(
        subscription.adminAccountId,
        subscription.planId,
        paymentRecord.id,
        subscription.id
      );
      return 'succeeded';
    }

    if (status === 'canceled') {
      return 'failed';
    }

    return 'pending';
  }

  /** Вызывается из webhook и при синхронном succeeded автоплатежа. */
  static async activateRenewedSubscription(
    adminId: string,
    planId: string,
    paymentId: string,
    previousSubscriptionId?: string
  ) {
    const { BillingService } = await import('@/lib/services/billing.service');
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: planId }
    });
    if (!plan) return;

    const intervalMonths = plan.interval === 'year' ? 12 : 1;

    const subscription = await BillingService.upsertActiveSubscription({
      adminId,
      planId,
      performedBy: 'yookassa',
      reason: `yookassa_auto_renew:${paymentId}`,
      intervalMonths,
      extendFromCurrent: true
    });

    const previous = previousSubscriptionId
      ? await db.subscription.findUnique({
          where: { id: previousSubscriptionId },
          select: { paymentMethod: true, autoRenewEnabled: true }
        })
      : null;

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        lastPaymentDate: new Date(),
        nextPaymentDate: subscription.endDate,
        paymentMethod: previous?.paymentMethod ?? undefined,
        autoRenewEnabled: previous?.autoRenewEnabled ?? true
      }
    });

    await db.payment.update({
      where: { id: paymentId },
      data: { subscriptionId: subscription.id }
    });
  }
}
