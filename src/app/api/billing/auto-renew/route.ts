/**
 * @file: src/app/api/billing/auto-renew/route.ts
 * @description: Самостоятельное управление автопродлением подписки админом
 * @project: SaaS Bonus System
 * @created: 2026-06-07
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAdmin } from '@/lib/auth';
import { BillingService } from '@/lib/services/billing.service';
import { logger } from '@/lib/logger';

const bodySchema = z.object({
  enabled: z.boolean(),
  removePaymentMethod: z.boolean().optional()
});

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = bodySchema.parse(await request.json());
    const subscription = await BillingService.getActiveSubscription(admin.sub);

    if (!subscription) {
      return NextResponse.json(
        { error: 'Активная подписка не найдена' },
        { status: 404 }
      );
    }

    await BillingService.setAutoRenewSettings({
      subscriptionId: subscription.id,
      enabled: body.enabled,
      removePaymentMethod: body.removePaymentMethod,
      performedBy: admin.sub,
      reason: body.removePaymentMethod
        ? 'user_removed_payment_method'
        : body.enabled
          ? 'user_enabled_auto_renew'
          : 'user_disabled_auto_renew'
    });

    const updated = await BillingService.getActiveSubscription(admin.sub);

    return NextResponse.json({
      success: true,
      autoRenewEnabled: updated?.autoRenewEnabled ?? false,
      hasSavedPaymentMethod: Boolean(updated?.paymentMethod)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    logger.error('Error updating user auto-renew', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
