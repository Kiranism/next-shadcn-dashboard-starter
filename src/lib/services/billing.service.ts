/**
 * @file: src/lib/services/billing.service.ts
 * @description: Сервис для управления тарифами и проверки лимитов подписки
 * @project: SaaS Bonus System
 * @dependencies: Prisma, db
 * @created: 2025-01-28
 * @updated: 2025-01-30
 * @author: AI Assistant + User
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/** Прибавить N месяцев к дате (immutable). */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    projects: number;
    users: number;
    bots: number;
    notifications: number;
  };
  popular?: boolean;
}

export interface UsageStats {
  projects: { used: number; limit: number };
  users: { used: number; limit: number };
  bots: { used: number; limit: number };
  notifications: { used: number; limit: number };
}

export class BillingService {
  /**
   * Активные статусы — пользователь имеет действующий план.
   * `expired`/`cancelled` исключены: они не должны влиять на проверки лимитов.
   */
  static readonly ACTIVE_STATUSES = ['active', 'trial', 'paused'] as const;

  /**
   * Получить активную подписку админа.
   *
   * После миграции `20260528134634_one_active_subscription_per_admin`
   * в БД действует partial unique index на `admin_account_id WHERE status IN
   * ('active','trial','paused')`. Поэтому одновременно может быть только одна
   * активная подписка — `findFirst` без orderBy достаточно. На всякий случай
   * сортируем по startDate DESC: если каким-то образом оказались две, берём
   * самую свежую.
   */
  static async getActiveSubscription(adminId: string) {
    return db.subscription.findFirst({
      where: {
        adminAccountId: adminId,
        status: { in: BillingService.ACTIVE_STATUSES as unknown as string[] },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }]
      },
      include: {
        plan: true,
        promoCode: true
      },
      orderBy: { startDate: 'desc' }
    });
  }

  /**
   * Единственная точка входа для активации/смены подписки.
   *
   * Гарантирует инвариант "одна активная подписка на админа":
   *  1. В одной транзакции отменяет ВСЕ существующие активные подписки
   *     (status -> 'cancelled', endDate = NOW(), cancelledAt = NOW()).
   *  2. Создаёт новую подписку с указанным планом / опциями.
   *  3. Пишет SubscriptionHistory: 'created' / 'upgraded' / 'downgraded'.
   *
   * Используется во всех сценариях:
   *   - регистрация (auto-Free после verify-email)
   *   - смена тарифа из UI (/api/billing/plan)
   *   - оплата через ЮKassa webhook
   *   - супер-админ создаёт подписку вручную
   *   - супер-админ меняет план (changePlan)
   *
   * Параметры:
   *   - performedBy: id админа / 'system' / 'yookassa' — для аудита.
   *   - reason: опциональная причина смены (для history).
   *   - intervalMonths: длительность периода. По умолчанию — interval плана
   *     (month -> 1, year -> 12). 0 -> без endDate.
   *   - extendFromCurrent: если true и текущий endDate в будущем, новый
   *     endDate = текущий + interval. Используется для продления оплатой
   *     ЮKassa.
   *   - trialDays: для trial-режима (status='trial', trialEndDate = now + N).
   *   - promoCodeId: id применённого промокода (валидация — на стороне caller).
   *   - customLimits: переопределение лимитов плана (Enterprise tailor-made).
   */
  static async upsertActiveSubscription(params: {
    adminId: string;
    planId: string;
    performedBy: string;
    reason?: string;
    intervalMonths?: number;
    extendFromCurrent?: boolean;
    trialDays?: number;
    promoCodeId?: string | null;
    customLimits?: Record<string, unknown> | null;
  }) {
    const {
      adminId,
      planId,
      performedBy,
      reason,
      extendFromCurrent = false,
      trialDays,
      promoCodeId,
      customLimits
    } = params;

    const plan = await db.subscriptionPlan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        interval: true,
        maxProjects: true
      }
    });
    if (!plan) {
      throw new Error(`План ${planId} не найден`);
    }

    const intervalMonths =
      params.intervalMonths !== undefined
        ? params.intervalMonths
        : plan.interval === 'year'
          ? 12
          : 1;

    const now = new Date();

    return db.$transaction(async (tx) => {
      // 1. Найти существующую активную подписку (единственная по инварианту).
      const current = await tx.subscription.findFirst({
        where: {
          adminAccountId: adminId,
          status: {
            in: BillingService.ACTIVE_STATUSES as unknown as string[]
          }
        },
        include: { plan: true },
        orderBy: { startDate: 'desc' }
      });

      // Если оказались дубли (legacy состояние до миграции) — отменяем все.
      const allActive = await tx.subscription.findMany({
        where: {
          adminAccountId: adminId,
          status: {
            in: BillingService.ACTIVE_STATUSES as unknown as string[]
          }
        },
        select: { id: true, endDate: true, cancelledAt: true }
      });

      // 2. Отменяем все активные ДО создания новой.
      //    Идём батчем через updateMany, потом отдельным запросом проставляем
      //    cancelledAt тем у кого его не было.
      if (allActive.length > 0) {
        await tx.subscription.updateMany({
          where: {
            id: { in: allActive.map((s) => s.id) }
          },
          data: {
            status: 'cancelled',
            endDate: now,
            cancelledAt: now
          }
        });
      }

      // 3. Вычисляем endDate для новой подписки.
      //    - intervalMonths = 0 -> бессрочно (endDate=null)
      //    - extendFromCurrent + есть будущий endDate -> продлеваем от него
      //    - иначе -> now + intervalMonths
      let newEndDate: Date | null = null;
      if (intervalMonths > 0) {
        const baseDate =
          extendFromCurrent &&
          current?.endDate &&
          current.endDate.getTime() > now.getTime()
            ? current.endDate
            : now;
        newEndDate = addMonths(baseDate, intervalMonths);
      }

      const trialEndDate =
        trialDays && trialDays > 0
          ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
          : null;

      // 4. Создаём новую подписку.
      const created = await tx.subscription.create({
        data: {
          adminAccountId: adminId,
          planId: plan.id,
          status: trialEndDate ? 'trial' : 'active',
          startDate: now,
          endDate: newEndDate,
          trialEndDate,
          promoCodeId: promoCodeId ?? null,
          customLimits: (customLimits as any) ?? undefined,
          nextPaymentDate:
            Number(plan.price) > 0 && newEndDate ? newEndDate : null
        },
        include: { plan: true }
      });

      // 5. Аудит в SubscriptionHistory.
      const action = !current
        ? 'created'
        : current.planId === plan.id
          ? 'renewed'
          : Number(plan.price) > Number(current.plan.price)
            ? 'upgraded'
            : 'downgraded';

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: created.id,
          action,
          fromPlanId: current?.planId ?? null,
          toPlanId: plan.id,
          reason,
          performedBy
        }
      });

      logger.info('Subscription upserted', {
        adminId,
        subscriptionId: created.id,
        planSlug: plan.slug,
        action,
        cancelledPrevious: allActive.length,
        performedBy
      });

      return created;
    });
  }

  /**
   * Получить лимиты с учетом кастомных настроек
   */
  static async getLimits(adminId: string): Promise<{
    maxProjects: number;
    maxUsersPerProject: number;
    maxBots?: number;
    maxNotifications?: number;
  }> {
    const subscription = await this.getActiveSubscription(adminId);

    if (!subscription) {
      // Дефолтный Free план
      return {
        maxProjects: 1,
        maxUsersPerProject: 10,
        maxBots: undefined,
        maxNotifications: undefined
      };
    }

    const planFeatures =
      (subscription.plan.features as unknown as Record<string, unknown>) || {};
    const planMaxBots =
      typeof planFeatures.maxBots === 'number'
        ? (planFeatures.maxBots as number)
        : undefined;

    // Кастомные лимиты переопределяют план
    if (subscription.customLimits) {
      const custom = subscription.customLimits as any;
      return {
        maxProjects: custom.maxProjects || subscription.plan.maxProjects,
        maxUsersPerProject:
          custom.maxUsersPerProject || subscription.plan.maxUsersPerProject,
        maxBots:
          typeof custom.maxBots === 'number' ? custom.maxBots : planMaxBots,
        maxNotifications:
          typeof custom.maxNotifications === 'number'
            ? custom.maxNotifications
            : subscription.plan.maxNotifications || undefined
      };
    }

    return {
      maxProjects: subscription.plan.maxProjects,
      maxUsersPerProject: subscription.plan.maxUsersPerProject,
      maxBots: planMaxBots,
      maxNotifications: subscription.plan.maxNotifications || undefined
    };
  }

  /**
   * Проверка лимита (расширенная версия)
   */
  static async checkLimit(
    adminId: string,
    type: 'projects' | 'users' | 'bots' | 'notifications'
  ): Promise<{
    allowed: boolean;
    used: number;
    limit: number;
    planId?: string;
  }> {
    const limits = await this.getLimits(adminId);
    const subscription = await this.getActiveSubscription(adminId);

    if (type === 'projects') {
      const projectCount = await db.project.count({
        where: { ownerId: adminId }
      });

      return {
        allowed: projectCount < limits.maxProjects,
        used: projectCount,
        limit: limits.maxProjects,
        planId: subscription?.planId
      };
    }

    if (type === 'users') {
      const userCount = await db.user.count({
        where: {
          project: { ownerId: adminId }
        }
      });

      return {
        allowed: userCount < limits.maxUsersPerProject,
        used: userCount,
        limit: limits.maxUsersPerProject,
        planId: subscription?.planId
      };
    }

    if (type === 'bots') {
      const maxBots =
        typeof limits.maxBots === 'number' ? limits.maxBots : undefined;

      if (!maxBots) {
        return {
          allowed: true,
          used: 0,
          limit: Number.MAX_SAFE_INTEGER,
          planId: subscription?.planId
        };
      }

      const botsCount = await db.botSettings.count({
        where: {
          project: { ownerId: adminId }
        }
      });

      return {
        allowed: botsCount < maxBots,
        used: botsCount,
        limit: maxBots,
        planId: subscription?.planId
      };
    }

    if (type === 'notifications') {
      const maxNotifications =
        typeof limits.maxNotifications === 'number'
          ? limits.maxNotifications
          : undefined;

      if (!maxNotifications) {
        return {
          allowed: true,
          used: 0,
          limit: Number.MAX_SAFE_INTEGER,
          planId: subscription?.planId
        };
      }

      const notificationsCount = await db.notification.count({
        where: {
          project: { ownerId: adminId }
        }
      });

      return {
        allowed: notificationsCount < maxNotifications,
        used: notificationsCount,
        limit: maxNotifications,
        planId: subscription?.planId
      };
    }

    return { allowed: true, used: 0, limit: 0 };
  }

  /**
   * Создать подписку (legacy API → делегирует в upsertActiveSubscription).
   *
   * @deprecated Используйте `upsertActiveSubscription` — он явно отменяет
   * предыдущую подписку и работает в одной транзакции. Этот метод оставлен
   * для совместимости вызовов из verify-email и super-admin UI.
   */
  static async createSubscription(data: {
    adminId: string;
    planId: string;
    promoCode?: string;
    trialDays?: number;
    performedBy?: string;
  }) {
    let promoCodeId: string | null = null;

    if (data.promoCode) {
      const plan = await db.subscriptionPlan.findUnique({
        where: { id: data.planId },
        select: { slug: true }
      });
      const promo = await db.promoCode.findUnique({
        where: { code: data.promoCode }
      });

      if (promo && plan && this.isPromoCodeValid(promo, plan.slug)) {
        promoCodeId = promo.id;
        await db.promoCode.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } }
        });
      }
    }

    return BillingService.upsertActiveSubscription({
      adminId: data.adminId,
      planId: data.planId,
      performedBy: data.performedBy ?? 'system',
      trialDays: data.trialDays,
      promoCodeId
    });
  }

  /**
   * Апгрейд/даунгрейд подписки (super-admin UI).
   *
   * Резолвит `subscriptionId` -> `adminId`, затем вызывает единую точку
   * `upsertActiveSubscription`. Текущая подписка гарантированно отменяется,
   * новая создаётся в одной транзакции.
   */
  static async changePlan(
    subscriptionId: string,
    newPlanId: string,
    performedBy: string
  ) {
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
      select: { adminAccountId: true, planId: true }
    });

    if (!subscription) throw new Error('Подписка не найдена');

    if (subscription.planId === newPlanId) {
      throw new Error('План уже активен');
    }

    return BillingService.upsertActiveSubscription({
      adminId: subscription.adminAccountId,
      planId: newPlanId,
      performedBy,
      reason: 'manual_change_plan'
    });
  }

  /**
   * Отменить подписку
   */
  static async cancelSubscription(
    subscriptionId: string,
    performedBy: string,
    reason?: string
  ) {
    await db.$transaction([
      db.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date()
        }
      }),
      db.subscriptionHistory.create({
        data: {
          subscriptionId,
          action: 'cancelled',
          reason,
          performedBy
        }
      })
    ]);

    logger.info('Subscription cancelled', {
      subscriptionId,
      performedBy,
      reason
    });
  }

  /**
   * Валидация промокода
   */
  private static isPromoCodeValid(promo: any, planSlug: string): boolean {
    if (!promo.isActive) return false;
    if (promo.validFrom > new Date()) return false;
    if (promo.validUntil && promo.validUntil < new Date()) return false;
    if (promo.maxUses && promo.usedCount >= promo.maxUses) return false;
    if (
      promo.applicablePlans.length > 0 &&
      !promo.applicablePlans.includes(planSlug)
    )
      return false;

    return true;
  }

  /**
   * Получить план на основе роли администратора (для обратной совместимости)
   * @deprecated Используйте getActiveSubscription и getLimits
   */
  static getPlanByRole(role: string): BillingPlan {
    switch (role) {
      case 'SUPERADMIN':
      case 'ADMIN':
        return {
          id: 'professional',
          name: 'Профессиональный',
          price: 2990,
          currency: 'RUB',
          interval: 'month',
          features: [
            'До 5 проектов',
            'До 1000 пользователей',
            '5 Telegram ботов',
            'Расширенные уведомления',
            'Приоритетная поддержка',
            'Аналитика и отчеты'
          ],
          limits: {
            projects: 5,
            users: 1000,
            bots: 5,
            notifications: 10000
          },
          popular: true
        };
      case 'MANAGER':
      default:
        return {
          id: 'starter',
          name: 'Стартовый',
          price: 0,
          currency: 'RUB',
          interval: 'month',
          features: [
            'До 1 проекта',
            'До 100 пользователей',
            '1 Telegram бот',
            'Базовые уведомления',
            'Email поддержка'
          ],
          limits: {
            projects: 1,
            users: 100,
            bots: 1,
            notifications: 1000
          }
        };
    }
  }

  /**
   * Получить текущий план администратора (для обратной совместимости)
   * @deprecated Используйте getActiveSubscription
   */
  static async getCurrentPlan(adminId: string): Promise<BillingPlan | null> {
    const subscription = await this.getActiveSubscription(adminId);
    if (subscription) {
      const features = (subscription.plan.features as any) || [];
      return {
        id: subscription.plan.id,
        name: subscription.plan.name,
        price: Number(subscription.plan.price),
        currency: subscription.plan.currency,
        interval: subscription.plan.interval as 'month' | 'year',
        features: Array.isArray(features) ? features : [],
        limits: {
          projects: subscription.plan.maxProjects,
          users: subscription.plan.maxUsersPerProject,
          bots:
            typeof subscription.plan.maxBots === 'number'
              ? subscription.plan.maxBots
              : 5,
          notifications:
            typeof subscription.plan.maxNotifications === 'number'
              ? subscription.plan.maxNotifications
              : 10000
        }
      };
    }

    const admin = await db.adminAccount.findUnique({
      where: { id: adminId },
      select: { role: true }
    });

    if (!admin) return null;

    return this.getPlanByRole(admin.role || 'MANAGER');
  }

  /**
   * Получить статистику использования для администратора
   */
  static async getUsageStats(adminId: string): Promise<{
    plan: BillingPlan | null;
    usage: UsageStats;
  } | null> {
    const plan = await this.getCurrentPlan(adminId);
    if (!plan) return null;

    const projects = await db.project.findMany({
      where: { ownerId: adminId },
      select: { id: true }
    });

    const [projectsCount, usersCount, botsCount, notificationsCount] =
      await Promise.all([
        db.project.count({ where: { ownerId: adminId } }),
        db.user.count({
          where: { projectId: { in: projects.map((p) => p.id) } }
        }),
        db.botSettings.count({
          where: { projectId: { in: projects.map((p) => p.id) } }
        }),
        db.notification.count({
          where: { projectId: { in: projects.map((p) => p.id) } }
        })
      ]);

    const usage: UsageStats = {
      projects: {
        used: projectsCount,
        limit: plan.limits.projects === -1 ? -1 : plan.limits.projects
      },
      users: {
        used: usersCount,
        limit: plan.limits.users === -1 ? -1 : plan.limits.users
      },
      bots: {
        used: botsCount,
        limit: plan.limits.bots === -1 ? -1 : plan.limits.bots
      },
      notifications: {
        used: notificationsCount,
        limit: plan.limits.notifications === -1 ? -1 : plan.limits.notifications
      }
    };

    return { plan, usage };
  }

  /**
   * Проверить, приближается ли пользователь к лимиту
   */
  static async isApproachingLimit(
    adminId: string,
    resourceType: 'projects' | 'users' | 'bots' | 'notifications',
    threshold: number = 0.8
  ): Promise<boolean> {
    if (resourceType === 'projects' || resourceType === 'users') {
      const { used, limit } = await this.checkLimit(adminId, resourceType);
      if (limit === -1) return false; // Безлимитный план
      return used / limit >= threshold;
    }

    // Для bots и notifications используем старую логику
    const usage = await this.getUsageStats(adminId);
    if (!usage) return false;

    const resourceUsage = usage.usage[resourceType];
    if (resourceUsage.limit === -1) return false;
    return resourceUsage.used / resourceUsage.limit >= threshold;
  }
}
