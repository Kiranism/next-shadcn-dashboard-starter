/**
 * @file: data-access.ts
 * @description: Server-side data-access для страницы иерархии партнёров.
 *               (b2b-referral-hierarchy Phase 6.7–6.8)
 *
 *               Возвращает плоский массив `HierarchyNode` (id + parentId +
 *               role + агрегаты). Клиентский компонент `HierarchyTree`
 *               собирает дерево из этого массива с сохранением порядка
 *               вставки.
 *
 *               Для обхода используется `cachedGetDescendantTree` из Phase 3
 *               (рекурсивный CTE с fallback на итеративный обход) — НЕ
 *               переписываем CTE здесь.
 *
 * @project: SaaS Bonus System
 * @dependencies: Prisma, ReferralCommissionService
 * @created: 2026-05-24
 * @author: AI Assistant + User
 */

import 'server-only';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { cachedGetDescendantTree } from '@/lib/services/referral-commission.service';

export type HierarchyPeriod = 'today' | '7d' | '30d' | 'all';

export interface HierarchyNode {
  id: string;
  parentId: string | null;
  /** firstName + lastName или email/phone fallback. */
  name: string;
  email: string | null;
  phone: string | null;
  partnerRole: string;
  registeredAt: string; // ISO
  /** Сколько прямых рефералов у этого узла (depth=1). */
  directCount: number;
  /** Размер дерева ниже этого узла (без него самого). */
  subtreeSize: number;
  /** Сумма totalPurchases всех потомков + сам узел в выбранном периоде. */
  totalPurchasesPeriod: number;
  /** Комиссия (REFERRAL EARN) этого узла за выбранный период. */
  commissionEarned: number;
}

export interface HierarchyTreeResult {
  enablePartnerRoles: boolean;
  rootIds: string[];
  nodes: HierarchyNode[];
  totals: {
    members: number;
    trainers: number;
    managers: number;
    directors: number;
    commissionTotal: number;
  };
}

/**
 * Преобразует период из URL в дату-границу. `all` → null (без фильтра).
 */
export function periodToSince(period: HierarchyPeriod): Date | null {
  if (period === 'all') return null;
  const now = new Date();
  if (period === 'today') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const days = period === '7d' ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

interface BuildOptions {
  period?: HierarchyPeriod;
  /** Поиск (Phase 6.11) — фронт получает все узлы и подсвечивает сам. */
  search?: string;
  /** Фильтр по B2B-организации (сеть фитнес-клубов). */
  organizationId?: string | null;
}

/**
 * Получить дерево всех партнёров проекта в виде плоского массива.
 * Корни дерева — пользователи с `referredBy = null` И `partnerRole != CLIENT`,
 * либо все DIRECTORs если b2b-роли включены.
 *
 * Если `enablePartnerRoles = false` — поведение fallback'нутое: возвращаем
 * всех пользователей с `referredBy = null` как корни (пустые поддеревья
 * клиентов отбрасываются).
 */
export async function getHierarchyTree(
  projectId: string,
  options: BuildOptions = {}
): Promise<HierarchyTreeResult> {
  const period: HierarchyPeriod = options.period ?? '30d';
  const since = periodToSince(period);
  const organizationId = options.organizationId ?? null;

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { enablePartnerRoles: true }
  });
  const enablePartnerRoles = Boolean(project?.enablePartnerRoles);

  // Базовый набор партнёров (или вообще всех, если фича выключена).
  // Мы не строим дерево «всё подряд» — берём только пользователей с
  // partnerRole != CLIENT, чтобы не утонуть в десятках тысяч клиентов.
  // Клиенты, прикреплённые к тренеру, отображаются как агрегат
  // `directCount` родителя.
  const partnerWhere: Parameters<typeof db.user.findMany>[0]['where'] = {
    projectId,
    ...(organizationId ? { organizationId } : {}),
    ...(enablePartnerRoles
      ? { partnerRole: { in: ['TRAINER', 'MANAGER', 'DIRECTOR'] } }
      : {})
  };

  const partners = await db.user.findMany({
    where: partnerWhere,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      partnerRole: true,
      referredBy: true,
      registeredAt: true,
      totalPurchases: true
    },
    orderBy: [{ partnerRole: 'desc' }, { registeredAt: 'asc' }]
  });

  if (partners.length === 0) {
    return {
      enablePartnerRoles,
      rootIds: [],
      nodes: [],
      totals: {
        members: 0,
        trainers: 0,
        managers: 0,
        directors: 0,
        commissionTotal: 0
      }
    };
  }

  const partnerIdSet = new Set(partners.map((p) => p.id));

  // Прямые counts клиентов (referredBy = partner.id) — отдельным groupBy.
  const directCounts = await db.user.groupBy({
    by: ['referredBy'],
    where: {
      projectId,
      ...(organizationId ? { organizationId } : {}),
      referredBy: { in: partners.map((p) => p.id) }
    },
    _count: { _all: true }
  });
  const directCountByParent = new Map<string, number>();
  for (const row of directCounts) {
    if (row.referredBy) {
      directCountByParent.set(row.referredBy, row._count._all);
    }
  }

  // Размер поддерева каждого партнёра — через `cachedGetDescendantTree`
  // Phase 3 (один раз на корень — мы зовём для каждого партнёра, но
  // CTE настолько лёгкий что это ок до ~1000 узлов; более крупные
  // деревья всё равно не помещаются в один экран).
  const subtreeSizeById = new Map<string, number>();
  await Promise.all(
    partners.map(async (p) => {
      const ds = await cachedGetDescendantTree(p.id, projectId);
      subtreeSizeById.set(p.id, ds.length);
    })
  );

  // Комиссия за период по каждому партнёру.
  const commissionAgg = await db.transaction.groupBy({
    by: ['userId'],
    where: {
      type: 'EARN',
      isReferralBonus: true,
      userId: { in: partners.map((p) => p.id) },
      ...(since ? { createdAt: { gte: since } } : {})
    },
    _sum: { amount: true }
  });
  const commissionByUser = new Map<string, number>();
  for (const row of commissionAgg) {
    commissionByUser.set(row.userId, Number(row._sum.amount ?? 0));
  }

  // Превращаем в HierarchyNode. parentId привязываем только если родитель —
  // тоже партнёр в этом списке (иначе считаем корнем).
  const nodes: HierarchyNode[] = partners.map((p) => {
    const parentInTree = p.referredBy && partnerIdSet.has(p.referredBy);
    const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
    return {
      id: p.id,
      parentId: parentInTree ? (p.referredBy as string) : null,
      name: fullName || p.email || p.phone || p.id.slice(0, 8),
      email: p.email,
      phone: p.phone,
      partnerRole: p.partnerRole,
      registeredAt: p.registeredAt.toISOString(),
      directCount: directCountByParent.get(p.id) ?? 0,
      subtreeSize: subtreeSizeById.get(p.id) ?? 0,
      totalPurchasesPeriod: Number(p.totalPurchases ?? 0),
      commissionEarned: commissionByUser.get(p.id) ?? 0
    };
  });

  const rootIds = nodes.filter((n) => !n.parentId).map((n) => n.id);

  // Тоталы по проекту.
  const totalsByRole = nodes.reduce<{
    trainers: number;
    managers: number;
    directors: number;
  }>(
    (acc, n) => {
      if (n.partnerRole === 'TRAINER') acc.trainers += 1;
      else if (n.partnerRole === 'MANAGER') acc.managers += 1;
      else if (n.partnerRole === 'DIRECTOR') acc.directors += 1;
      return acc;
    },
    { trainers: 0, managers: 0, directors: 0 }
  );

  const commissionTotal = Array.from(commissionByUser.values()).reduce(
    (s, v) => s + v,
    0
  );

  return {
    enablePartnerRoles,
    rootIds,
    nodes,
    totals: {
      members: nodes.length,
      ...totalsByRole,
      commissionTotal
    }
  };
}

/**
 * Тонкая обёртка с логированием — на странице мы хотим понимать ошибки,
 * но не падать с белым экраном. На ошибку отдаём пустую структуру.
 */
export async function getHierarchyTreeSafe(
  projectId: string,
  options: BuildOptions = {}
): Promise<HierarchyTreeResult> {
  try {
    return await getHierarchyTree(projectId, options);
  } catch (error) {
    logger.error('getHierarchyTree failed', {
      projectId,
      error: error instanceof Error ? error.message : String(error),
      component: 'hierarchy-page-data'
    });
    return {
      enablePartnerRoles: false,
      rootIds: [],
      nodes: [],
      totals: {
        members: 0,
        trainers: 0,
        managers: 0,
        directors: 0,
        commissionTotal: 0
      }
    };
  }
}
