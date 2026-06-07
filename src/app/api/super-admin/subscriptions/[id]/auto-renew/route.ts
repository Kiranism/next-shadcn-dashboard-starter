/**
 * @file: src/app/api/super-admin/subscriptions/[id]/auto-renew/route.ts
 * @description: Управление автопродлением подписки (super-admin)
 * @project: SaaS Bonus System
 * @created: 2026-06-07
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSuperAdmin } from '@/lib/auth';
import { BillingService } from '@/lib/services/billing.service';
import { logger } from '@/lib/logger';

const bodySchema = z.object({
  enabled: z.boolean(),
  removePaymentMethod: z.boolean().optional()
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const { id } = await context.params;
    const body = bodySchema.parse(await request.json());

    await BillingService.setAutoRenewSettings({
      subscriptionId: id,
      enabled: body.enabled,
      removePaymentMethod: body.removePaymentMethod,
      performedBy: admin.sub || admin.email || 'superadmin',
      reason: body.removePaymentMethod
        ? 'super_admin_removed_payment_method'
        : body.enabled
          ? 'super_admin_enabled_auto_renew'
          : 'super_admin_disabled_auto_renew'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    logger.error('Error updating subscription auto-renew', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Ошибка при обновлении автопродления'
      },
      { status: 500 }
    );
  }
}
