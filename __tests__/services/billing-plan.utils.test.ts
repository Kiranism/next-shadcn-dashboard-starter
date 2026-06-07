/**
 * @file: __tests__/services/billing-plan.utils.test.ts
 * @description: Тесты расчёта лимитов тарифов (единая формула UI + API)
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import {
  derivePlanLimits,
  resolveEffectiveLimits
} from '@/lib/services/billing-plan.utils';

describe('billing-plan.utils', () => {
  it('Pro: users = maxUsersPerProject × maxProjects', () => {
    const limits = derivePlanLimits({
      slug: 'pro',
      maxProjects: 5,
      maxUsersPerProject: 1000,
      maxBots: 5,
      maxNotifications: 10000
    });

    expect(limits.projects).toBe(5);
    expect(limits.users).toBe(5000);
    expect(limits.bots).toBe(5);
    expect(limits.notifications).toBe(10000);
  });

  it('Free: дефолтные лимиты ботов и уведомлений', () => {
    const limits = derivePlanLimits({
      slug: 'free',
      maxProjects: 1,
      maxUsersPerProject: 10,
      maxBots: 1,
      maxNotifications: 1000
    });

    expect(limits.users).toBe(10);
    expect(limits.bots).toBe(1);
    expect(limits.notifications).toBe(1000);
  });

  it('Enterprise: maxNotifications=0 → безлимит (-1)', () => {
    const limits = derivePlanLimits({
      slug: 'enterprise',
      maxProjects: 10,
      maxUsersPerProject: 999999,
      maxBots: 10,
      maxNotifications: 0
    });

    expect(limits.notifications).toBe(-1);
  });

  it('resolveEffectiveLimits применяет customLimits', () => {
    const limits = resolveEffectiveLimits(
      {
        slug: 'pro',
        maxProjects: 5,
        maxUsersPerProject: 1000,
        maxBots: 5,
        maxNotifications: 10000
      },
      { maxProjects: 20 }
    );

    expect(limits.projects).toBe(20);
    expect(limits.users).toBe(20_000);
  });
});
