/**
 * @file: referral.service.test.ts
 * @description: Тесты расчёта реферальной статистики
 */

import { ReferralService } from '@/lib/services/referral.service';
import { db } from '@/lib/db';

jest.mock('@/lib/db');
jest.mock('@/lib/logger');

describe('ReferralService.getReferralStats', () => {
  const mockDb = db as jest.Mocked<typeof db>;
  const projectId = 'project-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('computes totals, period metrics and UTM sources', async () => {
    mockDb.user.count = jest
      .fn()
      .mockResolvedValueOnce(10) // totalReferrals
      .mockResolvedValueOnce(5); // activeReferrals

    mockDb.transaction.aggregate = jest
      .fn()
      .mockResolvedValueOnce({ _sum: { amount: 123.45 } }) // totalReferralBonuses
      .mockResolvedValueOnce({ _sum: { amount: 23.45 } }); // periodBonus

    mockDb.transaction.findMany = jest.fn().mockResolvedValue([
      { amount: 100 },
      { amount: 50 }
    ] as any);

    mockDb.user.findMany = jest.fn().mockResolvedValue([] as any);

    mockDb.user.groupBy = jest.fn().mockResolvedValue([
      { utmSource: 'ads', utmMedium: 'cpc', utmCampaign: 'spring', _count: { _all: 3 } }
    ] as any);

    const stats = await ReferralService.getReferralStats(projectId);

    expect(stats.totalReferrals).toBe(10);
    expect(stats.activeReferrers).toBe(5);
    expect(stats.totalBonusPaid).toBeCloseTo(123.45);
    expect(stats.periodBonusPaid).toBeCloseTo(23.45);
    expect(stats.averageOrderValue).toBeGreaterThan(0);
    expect(stats.utmSources[0].utm_source).toBe('ads');
  });
});

