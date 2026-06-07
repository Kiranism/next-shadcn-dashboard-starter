/**
 * @file: src/app/api/billing/yookassa/webhook/route.ts
 * @description: Webhook обработчик статусов платежей ЮKassa
 * @project: SaaS Bonus System
 * @created: 2025-12-10
 * @updated: 2026-06-06 — IP-проверка, промокод, автопродление
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { BillingPricingService } from '@/lib/services/billing-pricing.service';
import { SubscriptionRenewalService } from '@/lib/services/subscription-renewal.service';
import { assertYooKassaWebhookIp } from '@/lib/yookassa/ip-validator';

type PaymentMeta = {
  pricing?: unknown;
  promoCodeId?: string | null;
  planDiscountId?: string | null;
  enableAutoRenew?: boolean;
  type?: string;
  subscriptionId?: string;
};

function readPaymentMeta(metadata: unknown): PaymentMeta {
  if (!metadata || typeof metadata !== 'object') return {};
  return metadata as PaymentMeta;
}

export async function POST(request: NextRequest) {
  try {
    const ipCheck = assertYooKassaWebhookIp(request);
    if (ipCheck.ok === false) {
      logger.warn('YooKassa webhook rejected: unauthorized IP', {
        ip: ipCheck.ip
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const event = await request.json();
    const paymentObject = event.object || {};
    const providerPaymentId: string | undefined = paymentObject.id;
    const status: string | undefined = paymentObject.status;

    if (!providerPaymentId) {
      return NextResponse.json(
        { error: 'payment id missing' },
        { status: 400 }
      );
    }

    const payment = await db.payment.findUnique({
      where: { providerPaymentId },
      include: { plan: true, subscription: true, adminAccount: true }
    });

    if (!payment) {
      logger.warn('Payment not found for webhook', {
        providerPaymentId,
        status
      });
      return NextResponse.json({ ok: true });
    }

    if (status === 'succeeded' && payment.status === 'succeeded') {
      logger.info('YooKassa duplicate succeeded webhook ignored', {
        paymentId: payment.id,
        providerPaymentId
      });
      return NextResponse.json({ ok: true });
    }

    const storedMeta = readPaymentMeta(payment.metadata);
    const ykMeta = (paymentObject.metadata ?? {}) as Record<string, string>;
    const enableAutoRenew =
      storedMeta.enableAutoRenew === true || ykMeta.enableAutoRenew === 'true';
    const promoCodeId =
      storedMeta.promoCodeId ||
      (ykMeta.promoCodeId ? ykMeta.promoCodeId : null) ||
      null;
    const isAutoRenew =
      storedMeta.type === 'auto_renew' || ykMeta.type === 'auto_renew';

    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: status || payment.status,
        metadata: {
          ...storedMeta,
          yookassa: paymentObject
        } as Prisma.InputJsonValue
      }
    });

    if (status === 'succeeded') {
      const plan = payment.plan;
      if (!plan) {
        logger.error('Payment has no plan linked', { paymentId: payment.id });
        return NextResponse.json({ ok: true });
      }

      const paymentMethodId =
        paymentObject.payment_method?.id &&
        typeof paymentObject.payment_method.id === 'string'
          ? paymentObject.payment_method.id
          : null;

      if (isAutoRenew) {
        await SubscriptionRenewalService.activateRenewedSubscription(
          payment.adminAccountId,
          plan.id,
          payment.id,
          storedMeta.subscriptionId ?? payment.subscriptionId ?? undefined
        );
      } else {
        const intervalMonths = plan.interval === 'year' ? 12 : 1;
        const { BillingService } = await import(
          '@/lib/services/billing.service'
        );
        const subscription = await BillingService.upsertActiveSubscription({
          adminId: payment.adminAccountId,
          planId: plan.id,
          performedBy: 'yookassa',
          reason: `yookassa_payment:${payment.id}`,
          intervalMonths,
          extendFromCurrent: true,
          promoCodeId: promoCodeId || null
        });

        await db.subscription.update({
          where: { id: subscription.id },
          data: {
            lastPaymentDate: new Date(),
            nextPaymentDate: subscription.endDate,
            autoRenewEnabled: enableAutoRenew,
            ...(paymentMethodId ? { paymentMethod: paymentMethodId } : {})
          }
        });

        await db.payment.update({
          where: { id: payment.id },
          data: { subscriptionId: subscription.id }
        });

        if (promoCodeId) {
          await BillingPricingService.incrementPromoUsage(promoCodeId);
        }
      }
    }

    if (status === 'canceled' || status === 'waiting_for_capture') {
      logger.info('YooKassa payment status update', {
        paymentId: payment.id,
        status
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('YooKassa webhook error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
