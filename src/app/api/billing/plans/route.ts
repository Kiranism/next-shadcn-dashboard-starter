/**
 * @file: src/app/api/billing/plans/route.ts
 * @description: Публичный список тарифных планов с актуальными скидками
 * @project: SaaS Bonus System
 * @created: 2025-11-16
 * @updated: 2026-06-06
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { formatPlan } from '@/lib/services/billing-plan.utils';
import { calculatePlanPricing } from '@/lib/services/billing-pricing.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const isPublic = searchParams.get('isPublic');

    const where: Record<string, unknown> = {};

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (isPublic !== null) {
      where.isPublic = isPublic === 'true';
    }

    const plans = await db.subscriptionPlan.findMany({
      where,
      orderBy: { sortOrder: 'asc' }
    });

    const planIds = plans.map((p) => p.id);
    const allDiscounts = planIds.length
      ? await db.planDiscount.findMany({
          where: { planId: { in: planIds }, isActive: true },
          orderBy: { sortOrder: 'asc' }
        })
      : [];

    return NextResponse.json({
      plans: plans.map((plan) => {
        const formatted = formatPlan(plan);
        const planDiscounts = allDiscounts.filter((d) => d.planId === plan.id);
        const pricing = calculatePlanPricing({
          plan,
          planDiscounts,
          promo: null
        });

        return {
          ...formatted,
          pricing: {
            basePrice: pricing.basePrice,
            finalPrice: pricing.finalPrice,
            currency: pricing.currency,
            hasDiscount: pricing.discounts.length > 0,
            discounts: pricing.discounts
          }
        };
      })
    });
  } catch (error) {
    logger.error('Error fetching billing plans', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to load plans' },
      { status: 500 }
    );
  }
}
