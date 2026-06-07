/**
 * @file: src/lib/services/billing-plan.utils.ts
 * @description: Утилиты для нормализации тарифных планов и расчетов лимитов
 * @project: SaaS Bonus System
 * @created: 2025-11-16
 */

import { Prisma } from '@prisma/client';

export type PlanLimits = {
  projects: number;
  users: number;
  bots: number;
  notifications: number;
};

export const POPULAR_PLAN_SLUGS = new Set(['pro', 'professional']);

export const toNumber = (value: Prisma.Decimal | number | null | undefined) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value);
};

export const parseFeatures = (features: Prisma.JsonValue | null): string[] => {
  if (!features) return [];
  if (Array.isArray(features)) {
    return features.map((item) => String(item));
  }

  if (typeof features === 'object') {
    const description = (features as Record<string, unknown>).description;
    if (Array.isArray(description)) {
      return description.map((item) => String(item));
    }
  }

  return [];
};

const isSet = (value: number | null | undefined) =>
  typeof value === 'number' && value !== 0;

/** Дефолтные лимиты Free-плана (нет активной подписки). */
export const FREE_PLAN_DEFAULTS = {
  slug: 'free',
  maxProjects: 1,
  maxUsersPerProject: 10,
  maxBots: 1,
  maxNotifications: 1000
} as const;

export const derivePlanLimits = (plan: {
  slug?: string;
  maxProjects: number;
  maxUsersPerProject: number;
  maxBots?: number | null;
  maxNotifications?: number | null;
}): PlanLimits => {
  // Явные значения в модели имеют приоритет; -1 означает безлимит.
  const projectsLimit = isSet(plan.maxProjects) ? plan.maxProjects : -1;

  const botsLimit = isSet(plan.maxBots)
    ? (plan.maxBots as number)
    : projectsLimit; // если не задано — следуем лимиту проектов

  const notificationsLimit = isSet(plan.maxNotifications)
    ? (plan.maxNotifications as number)
    : -1;

  let usersLimit: number;
  if (isSet(plan.maxUsersPerProject) && projectsLimit > 0) {
    usersLimit = plan.maxUsersPerProject * projectsLimit;
  } else if (isSet(plan.maxUsersPerProject)) {
    usersLimit = plan.maxUsersPerProject;
  } else {
    usersLimit = -1;
  }

  return {
    projects: projectsLimit ?? -1,
    users: usersLimit ?? -1,
    bots: botsLimit ?? -1,
    notifications: notificationsLimit
  };
};

/** Лимиты плана с учётом customLimits подписки (Enterprise tailor-made). */
export const resolveEffectiveLimits = (
  plan: {
    slug?: string;
    maxProjects: number;
    maxUsersPerProject: number;
    maxBots?: number | null;
    maxNotifications?: number | null;
  },
  customLimits?: Record<string, unknown> | null
): PlanLimits => {
  if (!customLimits) {
    return derivePlanLimits(plan);
  }

  const merged = {
    slug: plan.slug,
    maxProjects:
      typeof customLimits.maxProjects === 'number'
        ? customLimits.maxProjects
        : plan.maxProjects,
    maxUsersPerProject:
      typeof customLimits.maxUsersPerProject === 'number'
        ? customLimits.maxUsersPerProject
        : plan.maxUsersPerProject,
    maxBots:
      typeof customLimits.maxBots === 'number'
        ? customLimits.maxBots
        : plan.maxBots,
    maxNotifications:
      typeof customLimits.maxNotifications === 'number'
        ? customLimits.maxNotifications
        : plan.maxNotifications
  };

  return derivePlanLimits(merged);
};

export const formatPlan = (
  plan: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    price: Prisma.Decimal;
    currency: string;
    interval: string;
    features: Prisma.JsonValue | null;
    maxProjects: number;
    maxUsersPerProject: number;
    maxBots?: number | null;
    maxNotifications?: number | null;
    isActive: boolean;
    isPublic: boolean;
    sortOrder: number;
  },
  options: {
    status?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    nextPaymentDate?: Date | null;
  } = {}
) => {
  const limits = derivePlanLimits(plan);

  return {
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    price: toNumber(plan.price),
    currency: plan.currency,
    interval: (plan.interval as 'month' | 'year') || 'month',
    features: parseFeatures(plan.features),
    limits,
    popular: POPULAR_PLAN_SLUGS.has(plan.slug),
    isActive: plan.isActive,
    isPublic: plan.isPublic,
    sortOrder: plan.sortOrder,
    maxBots: plan.maxBots ?? null,
    maxNotifications: plan.maxNotifications ?? null,
    status: options.status ?? null,
    startDate: options.startDate?.toISOString() ?? null,
    endDate: options.endDate?.toISOString() ?? null,
    nextPaymentDate: options.nextPaymentDate?.toISOString() ?? null
  };
};
