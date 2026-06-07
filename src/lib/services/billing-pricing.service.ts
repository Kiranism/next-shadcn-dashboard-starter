/**
 * @file: src/lib/services/billing-pricing.service.ts
 * @description: Расчёт цены подписки со скидками (PlanDiscount + PromoCode)
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import { PlanDiscount, PromoCode, SubscriptionPlan } from '@prisma/client';
import { db } from '@/lib/db';
import { toNumber } from '@/lib/services/billing-plan.utils';

export type DiscountLine = {
  type: 'promo' | 'plan_discount';
  id: string;
  name: string;
  discountType: 'percent' | 'fixed_amount';
  discountValue: number;
  amountOff: number;
};

export type PricingResult = {
  basePrice: number;
  finalPrice: number;
  currency: string;
  intervalMonths: number;
  discounts: DiscountLine[];
  promoCodeId: string | null;
  planDiscountId: string | null;
};

export function applyDiscountAmount(
  price: number,
  discountType: string,
  discountValue: number
): { price: number; amountOff: number } {
  const value = Number(discountValue);
  if (value <= 0) {
    return { price, amountOff: 0 };
  }

  if (discountType === 'percent') {
    const amountOff = Math.round(((price * value) / 100) * 100) / 100;
    return { price: Math.max(0, price - amountOff), amountOff };
  }

  const amountOff = Math.min(price, value);
  return { price: Math.max(0, price - amountOff), amountOff };
}

export function isPromoCodeValid(
  promo: Pick<
    PromoCode,
    | 'isActive'
    | 'validFrom'
    | 'validUntil'
    | 'maxUses'
    | 'usedCount'
    | 'applicablePlans'
  >,
  planSlug: string,
  now: Date = new Date()
): boolean {
  if (!promo.isActive) return false;
  if (promo.validFrom > now) return false;
  if (promo.validUntil && promo.validUntil < now) return false;
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return false;
  if (
    promo.applicablePlans.length > 0 &&
    !promo.applicablePlans.includes(planSlug)
  ) {
    return false;
  }
  return true;
}

export function isPlanDiscountValid(
  discount: Pick<
    PlanDiscount,
    'isActive' | 'validFrom' | 'validUntil' | 'minMonths'
  >,
  intervalMonths: number,
  now: Date = new Date()
): boolean {
  if (!discount.isActive) return false;
  if (discount.validFrom > now) return false;
  if (discount.validUntil && discount.validUntil < now) return false;
  if (discount.minMonths !== null && intervalMonths < discount.minMonths) {
    return false;
  }
  return true;
}

export function pickBestPlanDiscount(
  discounts: PlanDiscount[],
  basePrice: number,
  intervalMonths: number,
  now: Date = new Date()
): { discount: PlanDiscount; amountOff: number } | null {
  let best: { discount: PlanDiscount; amountOff: number } | null = null;

  for (const discount of discounts) {
    if (!isPlanDiscountValid(discount, intervalMonths, now)) continue;

    const { amountOff } = applyDiscountAmount(
      basePrice,
      discount.discountType,
      toNumber(discount.discountValue)
    );

    if (!best || amountOff > best.amountOff) {
      best = { discount, amountOff };
    }
  }

  return best;
}

export function calculatePlanPricing(params: {
  plan: Pick<SubscriptionPlan, 'price' | 'currency' | 'interval' | 'slug'>;
  planDiscounts?: PlanDiscount[];
  promo?: PromoCode | null;
  intervalMonths?: number;
}): PricingResult {
  const intervalMonths =
    params.intervalMonths ?? (params.plan.interval === 'year' ? 12 : 1);

  const basePrice = toNumber(params.plan.price);
  const discounts: DiscountLine[] = [];
  let price = basePrice;
  let planDiscountId: string | null = null;
  let promoCodeId: string | null = null;

  const bestPlanDiscount = pickBestPlanDiscount(
    params.planDiscounts ?? [],
    basePrice,
    intervalMonths
  );

  if (bestPlanDiscount) {
    const applied = applyDiscountAmount(
      price,
      bestPlanDiscount.discount.discountType,
      toNumber(bestPlanDiscount.discount.discountValue)
    );
    discounts.push({
      type: 'plan_discount',
      id: bestPlanDiscount.discount.id,
      name: bestPlanDiscount.discount.name,
      discountType: bestPlanDiscount.discount.discountType as
        | 'percent'
        | 'fixed_amount',
      discountValue: toNumber(bestPlanDiscount.discount.discountValue),
      amountOff: applied.amountOff
    });
    price = applied.price;
    planDiscountId = bestPlanDiscount.discount.id;
  }

  if (params.promo && isPromoCodeValid(params.promo, params.plan.slug)) {
    const applied = applyDiscountAmount(
      price,
      params.promo.discountType,
      toNumber(params.promo.discountValue)
    );
    discounts.push({
      type: 'promo',
      id: params.promo.id,
      name: params.promo.code,
      discountType: params.promo.discountType as 'percent' | 'fixed_amount',
      discountValue: toNumber(params.promo.discountValue),
      amountOff: applied.amountOff
    });
    price = applied.price;
    promoCodeId = params.promo.id;
  }

  return {
    basePrice,
    finalPrice: Math.round(price * 100) / 100,
    currency: params.plan.currency,
    intervalMonths,
    discounts,
    promoCodeId,
    planDiscountId
  };
}

export class BillingPricingService {
  static async resolvePricing(params: {
    planId: string;
    promoCode?: string | null;
    intervalMonths?: number;
  }): Promise<
    | { ok: true; pricing: PricingResult; plan: SubscriptionPlan }
    | { ok: false; error: string; status: number }
  > {
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: params.planId }
    });

    if (!plan || !plan.isActive) {
      return { ok: false, error: 'Plan not found or inactive', status: 404 };
    }

    if (toNumber(plan.price) <= 0) {
      return { ok: false, error: 'Plan is free', status: 400 };
    }

    const planDiscounts = await db.planDiscount.findMany({
      where: { planId: plan.id, isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    let promo: PromoCode | null = null;
    if (params.promoCode?.trim()) {
      promo = await db.promoCode.findFirst({
        where: {
          code: { equals: params.promoCode.trim(), mode: 'insensitive' }
        }
      });

      if (!promo) {
        return { ok: false, error: 'Промокод не найден', status: 404 };
      }

      if (!isPromoCodeValid(promo, plan.slug)) {
        return {
          ok: false,
          error: 'Промокод недействителен или истёк',
          status: 400
        };
      }
    }

    const pricing = calculatePlanPricing({
      plan,
      planDiscounts,
      promo,
      intervalMonths: params.intervalMonths
    });

    return { ok: true, pricing, plan };
  }

  static async incrementPromoUsage(promoCodeId: string): Promise<void> {
    await db.promoCode.update({
      where: { id: promoCodeId },
      data: { usedCount: { increment: 1 } }
    });
  }
}
