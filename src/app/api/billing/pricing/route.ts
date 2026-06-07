/**
 * @file: src/app/api/billing/pricing/route.ts
 * @description: Расчёт цены тарифа со скидками и валидация промокода
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { BillingPricingService } from '@/lib/services/billing-pricing.service';

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const planId = body.planId as string | undefined;
    const promoCode = body.promoCode as string | undefined;

    if (!planId) {
      return NextResponse.json(
        { error: 'planId is required' },
        { status: 400 }
      );
    }

    const resolved = await BillingPricingService.resolvePricing({
      planId,
      promoCode: promoCode?.trim() || undefined
    });

    if (resolved.ok === false) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status }
      );
    }

    return NextResponse.json({
      planId: resolved.plan.id,
      planName: resolved.plan.name,
      pricing: resolved.pricing
    });
  } catch (error) {
    logger.error('Error calculating billing pricing', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
