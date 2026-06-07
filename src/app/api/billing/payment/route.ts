/**
 * @file: src/app/api/billing/payment/route.ts
 * @description: Создание платежа через ЮKassa (разовый платеж за период)
 * @project: SaaS Bonus System
 * @created: 2025-12-10
 * @updated: 2026-06-06 — скидки, автопродление
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { BillingPricingService } from '@/lib/services/billing-pricing.service';
import { randomUUID } from 'crypto';
import { createYooKassaPayment } from '@/lib/yookassa/client';

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const planId: string | undefined = body.planId;
    const promoCode: string | undefined = body.promoCode;
    const enableAutoRenew: boolean = body.enableAutoRenew === true;

    if (!planId) {
      return NextResponse.json(
        { error: 'planId is required' },
        { status: 400 }
      );
    }

    const resolved = await BillingPricingService.resolvePricing({
      planId,
      promoCode
    });

    if (resolved.ok === false) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status }
      );
    }

    const { pricing, plan } = resolved;

    if (pricing.finalPrice <= 0) {
      return NextResponse.json(
        {
          error:
            'После скидки оплата не требуется. Активируйте тариф через смену плана.'
        },
        { status: 400 }
      );
    }

    const returnUrl =
      body.returnUrl ||
      process.env.YOOKASSA_RETURN_URL ||
      `${request.nextUrl.origin}/dashboard/settings?tab=billing`;

    const idempotenceKey = randomUUID();
    const description =
      pricing.discounts.length > 0
        ? `Оплата тарифа ${plan.name} (скидка)`
        : `Оплата тарифа ${plan.name}`;

    const paymentRecord = await db.payment.create({
      data: {
        adminAccountId: admin.sub,
        planId: plan.id,
        amount: pricing.finalPrice,
        currency: plan.currency || 'RUB',
        status: 'created',
        provider: 'yookassa',
        providerPaymentId: `temp-${idempotenceKey}`,
        description,
        metadata: {
          pricing,
          promoCodeId: pricing.promoCodeId,
          planDiscountId: pricing.planDiscountId,
          enableAutoRenew
        } as Prisma.InputJsonValue
      }
    });

    const ykResult = await createYooKassaPayment(
      {
        amount: {
          value: pricing.finalPrice.toFixed(2),
          currency: plan.currency || 'RUB'
        },
        capture: true,
        description,
        confirmation: {
          type: 'redirect',
          return_url: returnUrl
        },
        save_payment_method: enableAutoRenew,
        metadata: {
          adminId: admin.sub,
          planId: plan.id,
          paymentRecordId: paymentRecord.id,
          promoCodeId: pricing.promoCodeId ?? '',
          planDiscountId: pricing.planDiscountId ?? '',
          enableAutoRenew: enableAutoRenew ? 'true' : 'false',
          type: 'subscription'
        }
      },
      idempotenceKey
    );

    if (ykResult.ok === false) {
      logger.error('YooKassa create payment failed', {
        status: ykResult.status,
        body: ykResult.body
      });
      await db.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: 'failed',
          metadata: { error: ykResult.body, pricing } as Prisma.InputJsonValue
        }
      });
      return NextResponse.json(
        { error: 'Failed to create payment' },
        { status: 502 }
      );
    }

    const paymentResponse = ykResult.data;
    const providerPaymentId = String(paymentResponse.id);
    const confirmationUrl =
      (
        paymentResponse.confirmation as
          | { confirmation_url?: string }
          | undefined
      )?.confirmation_url ?? null;
    const status = String(paymentResponse.status || 'pending');

    await db.payment.update({
      where: { id: paymentRecord.id },
      data: {
        providerPaymentId,
        confirmationUrl,
        status,
        metadata: {
          pricing,
          promoCodeId: pricing.promoCodeId,
          planDiscountId: pricing.planDiscountId,
          enableAutoRenew,
          yookassa: paymentResponse
        } as Prisma.InputJsonValue
      }
    });

    return NextResponse.json({
      paymentId: paymentRecord.id,
      providerPaymentId,
      status,
      confirmationUrl,
      pricing
    });
  } catch (error) {
    logger.error('Error creating payment', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
