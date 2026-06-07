/**
 * @file: __tests__/services/billing-pricing.service.test.ts
 * @description: Тесты расчёта цены со скидками
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import {
  applyDiscountAmount,
  calculatePlanPricing,
  isPlanDiscountValid,
  isPromoCodeValid,
  pickBestPlanDiscount
} from '@/lib/services/billing-pricing.service';

describe('billing-pricing.service', () => {
  const basePlan = {
    price: 2990,
    currency: 'RUB',
    interval: 'month',
    slug: 'pro'
  };

  it('applyDiscountAmount percent', () => {
    const result = applyDiscountAmount(2990, 'percent', 10);
    expect(result.price).toBe(2691);
    expect(result.amountOff).toBe(299);
  });

  it('applyDiscountAmount fixed', () => {
    const result = applyDiscountAmount(2990, 'fixed_amount', 500);
    expect(result.price).toBe(2490);
    expect(result.amountOff).toBe(500);
  });

  it('stack plan discount then promo', () => {
    const pricing = calculatePlanPricing({
      plan: basePlan,
      planDiscounts: [
        {
          id: 'd1',
          planId: 'p1',
          name: 'Launch',
          description: null,
          discountType: 'percent',
          discountValue: 10,
          minMonths: null,
          validFrom: new Date('2020-01-01'),
          validUntil: null,
          isActive: true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      promo: {
        id: 'promo1',
        code: 'EXTRA500',
        description: null,
        discountType: 'fixed_amount',
        discountValue: 500,
        applicablePlans: [],
        maxUses: null,
        usedCount: 0,
        validFrom: new Date('2020-01-01'),
        validUntil: null,
        isActive: true,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    expect(pricing.basePrice).toBe(2990);
    expect(pricing.finalPrice).toBe(2191);
    expect(pricing.discounts).toHaveLength(2);
    expect(pricing.promoCodeId).toBe('promo1');
    expect(pricing.planDiscountId).toBe('d1');
  });

  it('isPromoCodeValid rejects expired', () => {
    expect(
      isPromoCodeValid(
        {
          isActive: true,
          validFrom: new Date('2020-01-01'),
          validUntil: new Date('2020-12-31'),
          maxUses: null,
          usedCount: 0,
          applicablePlans: ['pro']
        },
        'pro',
        new Date('2026-01-01')
      )
    ).toBe(false);
  });

  it('pickBestPlanDiscount chooses max savings', () => {
    const best = pickBestPlanDiscount(
      [
        {
          id: 'small',
          planId: 'p1',
          name: '5%',
          description: null,
          discountType: 'percent',
          discountValue: 5,
          minMonths: null,
          validFrom: new Date('2020-01-01'),
          validUntil: null,
          isActive: true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'big',
          planId: 'p1',
          name: '1000 off',
          description: null,
          discountType: 'fixed_amount',
          discountValue: 1000,
          minMonths: null,
          validFrom: new Date('2020-01-01'),
          validUntil: null,
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      2990,
      1
    );

    expect(best?.discount.id).toBe('big');
  });

  it('isPlanDiscountValid respects minMonths', () => {
    expect(
      isPlanDiscountValid(
        {
          isActive: true,
          validFrom: new Date('2020-01-01'),
          validUntil: null,
          minMonths: 12
        },
        1
      )
    ).toBe(false);
  });
});
