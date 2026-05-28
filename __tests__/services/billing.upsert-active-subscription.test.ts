/**
 * @file: __tests__/services/billing.upsert-active-subscription.test.ts
 * @description: Тесты ключевого инварианта: одна активная подписка на админа.
 *               Покрывает BillingService.upsertActiveSubscription для всех
 *               кейсов: первая подписка / апгрейд / даунгрейд / renew того же
 *               плана / extendFromCurrent для оплаты ЮKassa / trial.
 *               Property-style: после любого вызова в БД ровно одна активная
 *               подписка для адмиа.
 * @project: SaaS Bonus System
 * @created: 2026-05-28
 */

import { BillingService } from '@/lib/services/billing.service';
import { db } from '@/lib/db';

jest.mock('@/lib/db');
jest.mock('@/lib/logger');

type SubRow = {
  id: string;
  adminAccountId: string;
  planId: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  cancelledAt: Date | null;
  trialEndDate: Date | null;
  promoCodeId: string | null;
  customLimits: any;
  nextPaymentDate: Date | null;
  plan?: PlanRow;
};

type PlanRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  interval: 'month' | 'year';
  maxProjects: number;
};

const ACTIVE_STATUSES = ['active', 'trial', 'paused'];

class InMemoryBillingDb {
  subs: SubRow[] = [];
  plans: PlanRow[] = [];
  history: Array<{
    subscriptionId: string;
    action: string;
    fromPlanId: string | null;
    toPlanId: string | null;
    reason?: string;
    performedBy?: string;
  }> = [];

  reset() {
    this.subs = [];
    this.history = [];
  }

  registerPlans() {
    this.plans = [
      {
        id: 'plan-free',
        name: 'Free',
        slug: 'free',
        price: 0,
        interval: 'month',
        maxProjects: 1
      },
      {
        id: 'plan-pro',
        name: 'Pro',
        slug: 'pro',
        price: 1990,
        interval: 'month',
        maxProjects: 5
      },
      {
        id: 'plan-enterprise',
        name: 'Enterprise',
        slug: 'enterprise',
        price: 9990,
        interval: 'month',
        maxProjects: 10
      }
    ];
  }

  countActive(adminId: string) {
    return this.subs.filter(
      (s) =>
        s.adminAccountId === adminId &&
        ACTIVE_STATUSES.includes(s.status) &&
        (s.endDate === null || s.endDate.getTime() >= Date.now())
    ).length;
  }
}

describe('BillingService.upsertActiveSubscription — инвариант одной активной подписки', () => {
  const mockDb = db as jest.Mocked<typeof db>;
  const memory = new InMemoryBillingDb();
  const adminId = 'admin-1';

  beforeEach(() => {
    memory.reset();
    memory.registerPlans();

    // SubscriptionPlan.findUnique
    (mockDb as any).subscriptionPlan = {
      findUnique: jest.fn(async ({ where }: any) => {
        return memory.plans.find((p) => p.id === where.id) ?? null;
      })
    };

    // Subscription mock — все методы работают с in-memory массивом.
    (mockDb as any).subscription = {
      findFirst: jest.fn(async ({ where, orderBy }: any) => {
        const filtered = memory.subs
          .filter((s) => s.adminAccountId === where.adminAccountId)
          .filter((s) => {
            if (where.status?.in) return where.status.in.includes(s.status);
            if (where.status) return s.status === where.status;
            return true;
          })
          .filter((s) => {
            if (!where.OR) return true;
            return s.endDate === null || s.endDate.getTime() >= Date.now();
          });

        // orderBy: { startDate: 'desc' } по умолчанию.
        const sorted = filtered.sort((a, b) => {
          if (orderBy?.startDate === 'desc') {
            return b.startDate.getTime() - a.startDate.getTime();
          }
          return 0;
        });
        return sorted[0]
          ? {
              ...sorted[0],
              plan: memory.plans.find((p) => p.id === sorted[0].planId)
            }
          : null;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return memory.subs
          .filter((s) => s.adminAccountId === where.adminAccountId)
          .filter((s) => {
            if (where.status?.in) return where.status.in.includes(s.status);
            return true;
          });
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        const ids: string[] = where?.id?.in ?? [];
        let count = 0;
        for (const sub of memory.subs) {
          if (ids.includes(sub.id)) {
            Object.assign(sub, data);
            count += 1;
          }
        }
        return { count };
      }),
      create: jest.fn(async ({ data }: any) => {
        const newSub: SubRow = {
          id: `sub-${memory.subs.length + 1}-${Date.now()}`,
          adminAccountId: data.adminAccountId,
          planId: data.planId,
          status: data.status,
          startDate: data.startDate,
          endDate: data.endDate ?? null,
          cancelledAt: null,
          trialEndDate: data.trialEndDate ?? null,
          promoCodeId: data.promoCodeId ?? null,
          customLimits: data.customLimits ?? null,
          nextPaymentDate: data.nextPaymentDate ?? null
        };
        memory.subs.push(newSub);
        const plan = memory.plans.find((p) => p.id === newSub.planId);
        return { ...newSub, plan };
      })
    };

    // SubscriptionHistory.create
    (mockDb as any).subscriptionHistory = {
      create: jest.fn(async ({ data }: any) => {
        memory.history.push(data);
        return { id: `hist-${memory.history.length}` };
      })
    };

    // Транзакция — у нас sync execution, просто callback.
    (mockDb as any).$transaction = jest.fn(async (cb: any) => {
      if (typeof cb === 'function') return cb(mockDb);
      return Promise.all(cb);
    });
  });

  it('первая подписка: создаёт active, история = "created"', async () => {
    await BillingService.upsertActiveSubscription({
      adminId,
      planId: 'plan-free',
      performedBy: 'system'
    });

    expect(memory.countActive(adminId)).toBe(1);
    expect(memory.history.length).toBe(1);
    expect(memory.history[0].action).toBe('created');
    expect(memory.history[0].fromPlanId).toBeNull();
    expect(memory.history[0].toPlanId).toBe('plan-free');
  });

  it('апгрейд Free → Pro: старая Free отменяется, остаётся одна активная Pro', async () => {
    // 1. Free
    await BillingService.upsertActiveSubscription({
      adminId,
      planId: 'plan-free',
      performedBy: 'system'
    });
    expect(memory.countActive(adminId)).toBe(1);

    // 2. Pro
    await BillingService.upsertActiveSubscription({
      adminId,
      planId: 'plan-pro',
      performedBy: adminId,
      reason: 'self_service'
    });

    // ИНВАРИАНТ: одна активная.
    expect(memory.countActive(adminId)).toBe(1);

    // Старая помечена cancelled.
    const cancelled = memory.subs.filter((s) => s.status === 'cancelled');
    expect(cancelled.length).toBe(1);
    expect(cancelled[0].planId).toBe('plan-free');

    // История содержит upgrade.
    const lastAction = memory.history[memory.history.length - 1];
    expect(lastAction.action).toBe('upgraded');
    expect(lastAction.fromPlanId).toBe('plan-free');
    expect(lastAction.toPlanId).toBe('plan-pro');
  });

  it('даунгрейд Enterprise → Free: история = "downgraded"', async () => {
    await BillingService.upsertActiveSubscription({
      adminId,
      planId: 'plan-enterprise',
      performedBy: 'system'
    });
    await BillingService.upsertActiveSubscription({
      adminId,
      planId: 'plan-free',
      performedBy: adminId
    });

    expect(memory.countActive(adminId)).toBe(1);
    const last = memory.history[memory.history.length - 1];
    expect(last.action).toBe('downgraded');
  });

  it('renew того же плана: action = "renewed", всё ещё одна активная', async () => {
    await BillingService.upsertActiveSubscription({
      adminId,
      planId: 'plan-pro',
      performedBy: 'yookassa'
    });
    await BillingService.upsertActiveSubscription({
      adminId,
      planId: 'plan-pro',
      performedBy: 'yookassa',
      extendFromCurrent: true
    });

    expect(memory.countActive(adminId)).toBe(1);
    expect(memory.history[memory.history.length - 1].action).toBe('renewed');
  });

  it('cleanup legacy-дублей: если в БД уже несколько активных, отменяет ВСЕ перед созданием новой', async () => {
    // Имитируем legacy-состояние (как у rapper@internet.ru): две активные.
    memory.subs.push(
      {
        id: 'legacy-free',
        adminAccountId: adminId,
        planId: 'plan-free',
        status: 'active',
        startDate: new Date(Date.now() - 30 * 24 * 3600e3),
        endDate: null,
        cancelledAt: null,
        trialEndDate: null,
        promoCodeId: null,
        customLimits: null,
        nextPaymentDate: null
      },
      {
        id: 'legacy-trial-enterprise',
        adminAccountId: adminId,
        planId: 'plan-enterprise',
        status: 'trial',
        startDate: new Date(),
        endDate: null,
        cancelledAt: null,
        trialEndDate: new Date(Date.now() + 14 * 24 * 3600e3),
        promoCodeId: null,
        customLimits: null,
        nextPaymentDate: null
      }
    );
    expect(memory.countActive(adminId)).toBe(2); // pre-condition

    await BillingService.upsertActiveSubscription({
      adminId,
      planId: 'plan-pro',
      performedBy: adminId,
      reason: 'cleanup_during_change'
    });

    // ИНВАРИАНТ восстановлен.
    expect(memory.countActive(adminId)).toBe(1);

    // Обе legacy подписки cancelled.
    const cancelled = memory.subs.filter(
      (s) => s.status === 'cancelled' && s.adminAccountId === adminId
    );
    expect(cancelled.length).toBe(2);
  });

  it('trial-режим: подписка создаётся со status=trial и trialEndDate', async () => {
    await BillingService.upsertActiveSubscription({
      adminId,
      planId: 'plan-pro',
      performedBy: 'system',
      trialDays: 14
    });

    const active = memory.subs.find((s) => s.adminAccountId === adminId)!;
    expect(active.status).toBe('trial');
    expect(active.trialEndDate).not.toBeNull();
    expect(memory.countActive(adminId)).toBe(1);
  });

  it('intervalMonths=0: бессрочная подписка (endDate=null)', async () => {
    await BillingService.upsertActiveSubscription({
      adminId,
      planId: 'plan-pro',
      performedBy: 'manual',
      intervalMonths: 0
    });

    const active = memory.subs.find((s) => s.adminAccountId === adminId)!;
    expect(active.endDate).toBeNull();
    expect(active.status).toBe('active');
  });

  it('100 хаотичных переключений: всё ещё ровно одна активная', async () => {
    const planSlots = ['plan-free', 'plan-pro', 'plan-enterprise'];
    for (let i = 0; i < 100; i += 1) {
      const planId = planSlots[i % planSlots.length];
      await BillingService.upsertActiveSubscription({
        adminId,
        planId,
        performedBy: i % 2 === 0 ? 'system' : adminId
      });
    }

    expect(memory.countActive(adminId)).toBe(1);
    expect(memory.history.length).toBe(100);
  });
});
