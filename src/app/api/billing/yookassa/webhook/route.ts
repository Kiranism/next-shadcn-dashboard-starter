/**
 * @file: src/app/api/billing/yookassa/webhook/route.ts
 * @description: Webhook обработчик статусов платежей ЮKassa
 * @project: SaaS Bonus System
 * @created: 2025-12-10
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
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

    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: status || payment.status,
        metadata: paymentObject
      }
    });

    // Обрабатываем успешный платеж
    if (status === 'succeeded') {
      const plan = payment.plan;
      if (!plan) {
        logger.error('Payment has no plan linked', { paymentId: payment.id });
        return NextResponse.json({ ok: true });
      }

      const intervalMonths = plan.interval === 'year' ? 12 : 1;

      // Используем единую точку входа: BillingService.upsertActiveSubscription
      //   - Отменит существующую активную подписку (если была) в той же
      //     транзакции, что создаст новую.
      //   - Гарантирует partial unique index из миграции
      //     20260528134634_one_active_subscription_per_admin.
      //   - extendFromCurrent=true — для продления оплатой ЮKassa с
      //     текущей даты окончания (а не от now).
      //   - Запишет в SubscriptionHistory (action: created/upgraded/renewed/
      //     downgraded — определяется автоматически).
      const { BillingService } = await import('@/lib/services/billing.service');
      const subscription = await BillingService.upsertActiveSubscription({
        adminId: payment.adminAccountId,
        planId: plan.id,
        performedBy: 'yookassa',
        reason: `yookassa_payment:${payment.id}`,
        intervalMonths,
        extendFromCurrent: true
      });

      // Дополнительно проставим lastPaymentDate / nextPaymentDate
      // (upsertActiveSubscription их не трогает — это специфично для
      // платёжного флоу).
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          lastPaymentDate: new Date(),
          nextPaymentDate: subscription.endDate
        }
      });
    }

    if (status === 'canceled' || status === 'waiting_for_capture') {
      // Ничего не делаем кроме логирования
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
