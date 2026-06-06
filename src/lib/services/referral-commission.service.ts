/**
 * @file: src/lib/services/referral-commission.service.ts
 * @description: Планы реферальных процентов по уровням, атрибуция при регистрации, гранты на просмотр статистики, эффективные права доступа в b2b-иерархии
 * @project: SaaS Bonus System
 * @dependencies: Prisma, db, react (cache)
 * @created: 2026-05-12
 * @author: AI Assistant + User
 */

import { cache } from 'react';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/** Безопасная глубина обхода реферальных цепочек (защита от циклов / runaway-запросов). */
const MAX_TREE_DEPTH = 10;
const DEFAULT_TREE_DEPTH = 3;

function clampDepth(depth: number): number {
  if (!Number.isFinite(depth)) return DEFAULT_TREE_DEPTH;
  return Math.min(Math.max(Math.trunc(depth), 1), MAX_TREE_DEPTH);
}

export type PlanLevelInput = {
  level: number;
  percent: number;
  isActive?: boolean;
};

export class ReferralCommissionService {
  /**
   * После регистрации приглашённого: зафиксировать план выплат (если включено на проекте).
   */
  static async syncAttributionForInvitedUser(params: {
    invitedUserId: string;
    projectId: string;
    referrerId: string;
    organizationId?: string | null;
  }): Promise<void> {
    const { invitedUserId, projectId, referrerId, organizationId } = params;

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        referralPlansEnabled: true,
        defaultReferralCommissionPlanId: true
      }
    });

    if (!project?.referralPlansEnabled) {
      return;
    }

    const existing = await db.referralAttribution.findUnique({
      where: { userId: invitedUserId }
    });
    if (existing) {
      return;
    }

    const planId = await this.resolvePlanIdForNewReferral(
      projectId,
      referrerId,
      project.defaultReferralCommissionPlanId,
      organizationId ?? undefined
    );

    if (!planId) {
      logger.warn('referral_plans_enabled but no commission plan resolved', {
        projectId,
        invitedUserId,
        referrerId,
        component: 'referral-commission-service'
      });
      return;
    }

    await db.referralAttribution.create({
      data: {
        userId: invitedUserId,
        projectId,
        referrerId,
        commissionPlanId: planId,
        organizationId: organizationId ?? null,
        locked: true
      }
    });

    logger.info('Referral attribution created', {
      invitedUserId,
      projectId,
      referrerId,
      commissionPlanId: planId,
      component: 'referral-commission-service'
    });
  }

  static async resolvePlanIdForNewReferral(
    projectId: string,
    referrerId: string,
    projectDefaultPlanId: string | null,
    organizationId?: string | null
  ): Promise<string | null> {
    const referrer = await db.user.findFirst({
      where: { id: referrerId, projectId },
      select: { outboundReferralPlanId: true, organizationId: true }
    });

    const preferred = referrer?.outboundReferralPlanId;
    if (preferred) {
      const ok = await db.referralCommissionPlan.findFirst({
        where: { id: preferred, projectId },
        select: { id: true }
      });
      if (ok) return ok.id;
    }

    const orgId = organizationId ?? referrer?.organizationId;
    if (orgId) {
      const org = await db.partnerOrganization.findFirst({
        where: { id: orgId, projectId },
        select: { defaultReferralCommissionPlanId: true }
      });
      if (org?.defaultReferralCommissionPlanId) {
        const ok = await db.referralCommissionPlan.findFirst({
          where: { id: org.defaultReferralCommissionPlanId, projectId },
          select: { id: true }
        });
        if (ok) return ok.id;
      }
    }

    if (projectDefaultPlanId) {
      const ok = await db.referralCommissionPlan.findFirst({
        where: { id: projectDefaultPlanId, projectId },
        select: { id: true }
      });
      if (ok) return ok.id;
    }

    return null;
  }

  /**
   * Создать план и уровни (1–3).
   */
  static async createPlan(
    projectId: string,
    name: string,
    levels: PlanLevelInput[],
    maxPayoutDepth = 3
  ) {
    const prepared = this.normalizeLevels(levels);
    const depth = Math.min(Math.max(1, maxPayoutDepth), 10);

    return db.$transaction(async (tx) => {
      const plan = await tx.referralCommissionPlan.create({
        data: {
          projectId,
          name: name.trim() || 'План',
          maxPayoutDepth: depth
        }
      });

      if (prepared.length) {
        await tx.referralCommissionPlanLevel.createMany({
          data: prepared.map((l) => ({
            planId: plan.id,
            level: l.level,
            percent: new Prisma.Decimal(l.percent),
            isActive: l.isActive ?? l.percent > 0
          }))
        });
      }

      return tx.referralCommissionPlan.findUniqueOrThrow({
        where: { id: plan.id },
        include: { levels: { orderBy: { level: 'asc' } } }
      });
    });
  }

  static async listPlans(projectId: string) {
    return db.referralCommissionPlan.findMany({
      where: { projectId },
      include: { levels: { orderBy: { level: 'asc' } } },
      orderBy: { createdAt: 'asc' }
    });
  }

  static async updatePlan(
    projectId: string,
    planId: string,
    data: { name?: string; maxPayoutDepth?: number; levels?: PlanLevelInput[] }
  ) {
    const plan = await db.referralCommissionPlan.findFirst({
      where: { id: planId, projectId }
    });
    if (!plan) throw new Error('План не найден');

    return db.$transaction(async (tx) => {
      await tx.referralCommissionPlan.update({
        where: { id: planId },
        data: {
          ...(data.name !== undefined && { name: data.name.trim() }),
          ...(data.maxPayoutDepth !== undefined && {
            maxPayoutDepth: Math.min(Math.max(1, data.maxPayoutDepth), 10)
          })
        }
      });

      if (data.levels) {
        const prepared = this.normalizeLevels(data.levels);
        await tx.referralCommissionPlanLevel.deleteMany({ where: { planId } });
        if (prepared.length) {
          await tx.referralCommissionPlanLevel.createMany({
            data: prepared.map((l) => ({
              planId,
              level: l.level,
              percent: new Prisma.Decimal(l.percent),
              isActive: l.isActive ?? l.percent > 0
            }))
          });
        }
      }

      return tx.referralCommissionPlan.findUniqueOrThrow({
        where: { id: planId },
        include: { levels: { orderBy: { level: 'asc' } } }
      });
    });
  }

  static async deletePlan(projectId: string, planId: string): Promise<void> {
    const project = await db.project.findFirst({
      where: { id: projectId, defaultReferralCommissionPlanId: planId }
    });
    if (project) {
      throw new Error('Нельзя удалить план, назначенный планом по умолчанию');
    }

    const inUse = await db.user.count({
      where: { outboundReferralPlanId: planId }
    });
    if (inUse > 0) {
      throw new Error('План назначен пользователям (outbound)');
    }

    await db.referralCommissionPlan.deleteMany({
      where: { id: planId, projectId }
    });
  }

  static async setProjectSettings(
    projectId: string,
    settings: {
      referralPlansEnabled?: boolean;
      defaultReferralCommissionPlanId?: string | null;
    }
  ) {
    if (settings.defaultReferralCommissionPlanId) {
      const ok = await db.referralCommissionPlan.findFirst({
        where: {
          id: settings.defaultReferralCommissionPlanId,
          projectId
        }
      });
      if (!ok) throw new Error('План по умолчанию не принадлежит проекту');
    }

    return db.project.update({
      where: { id: projectId },
      data: {
        ...(settings.referralPlansEnabled !== undefined && {
          referralPlansEnabled: settings.referralPlansEnabled
        }),
        ...(settings.defaultReferralCommissionPlanId !== undefined && {
          defaultReferralCommissionPlanId:
            settings.defaultReferralCommissionPlanId
        })
      },
      select: {
        id: true,
        referralPlansEnabled: true,
        defaultReferralCommissionPlanId: true
      }
    });
  }

  /**
   * Копирует текущие ReferralLevel проекта в новый план и назначает дефолтным (идемпотентно: если планы уже есть — только создаёт копию).
   */
  static async seedDefaultPlanFromLegacyReferralProgram(
    projectId: string,
    planName = 'Базовый (из настроек программы)'
  ) {
    const proj = await db.project.findUnique({
      where: { id: projectId },
      select: { defaultReferralCommissionPlanId: true }
    });
    if (proj?.defaultReferralCommissionPlanId) {
      return db.referralCommissionPlan.findUniqueOrThrow({
        where: { id: proj.defaultReferralCommissionPlanId },
        include: { levels: { orderBy: { level: 'asc' } } }
      });
    }

    const program = await db.referralProgram.findUnique({
      where: { projectId },
      include: { levels: { orderBy: { level: 'asc' } } }
    });

    const levels: PlanLevelInput[] = program?.levels?.length
      ? program.levels.map((l) => ({
          level: l.level,
          percent: Number(l.percent),
          isActive: l.isActive
        }))
      : [
          {
            level: 1,
            percent: Number(program?.referrerBonus ?? 0),
            isActive: Number(program?.referrerBonus ?? 0) > 0
          },
          { level: 2, percent: 0, isActive: false },
          { level: 3, percent: 0, isActive: false }
        ];

    const plan = await this.createPlan(projectId, planName, levels, 3);

    await db.project.update({
      where: { id: projectId },
      data: { defaultReferralCommissionPlanId: plan.id }
    });

    return plan;
  }

  /**
   * Назначить пользователю исходящий (outbound) план комиссий.
   *
   * Когда у проекта включён `enablePartnerRoles`, назначить outbound-план
   * можно только партнёру (`TRAINER` / `MANAGER` / `DIRECTOR`). Попытка назначить
   * план пользователю с ролью `CLIENT` приводит к ошибке.
   *
   * Если `enablePartnerRoles = false` (по умолчанию), поведение прежнее —
   * проверка роли пропускается.
   *
   * @see Requirements 2.3 — "Outbound план можно назначить только партнёру"
   */
  static async setUserOutboundPlan(
    projectId: string,
    userId: string,
    planId: string | null
  ) {
    if (planId) {
      const ok = await db.referralCommissionPlan.findFirst({
        where: { id: planId, projectId }
      });
      if (!ok) throw new Error('План не найден в проекте');
    }

    const user = await db.user.findFirst({
      where: { id: userId, projectId },
      select: {
        id: true,
        partnerRole: true,
        project: {
          select: { enablePartnerRoles: true }
        }
      }
    });
    if (!user) throw new Error('Пользователь не найден');

    if (user.project.enablePartnerRoles && user.partnerRole === 'CLIENT') {
      throw new Error('Outbound план можно назначить только партнёру');
    }

    return db.user.update({
      where: { id: userId },
      data: { outboundReferralPlanId: planId },
      select: {
        id: true,
        outboundReferralPlanId: true,
        email: true,
        phone: true
      }
    });
  }

  static async createStatsGrant(
    projectId: string,
    subjectUserId: string,
    viewerUserId: string
  ) {
    const [sub, viewer] = await Promise.all([
      db.user.findFirst({ where: { id: subjectUserId, projectId } }),
      db.user.findFirst({ where: { id: viewerUserId, projectId } })
    ]);
    if (!sub || !viewer) {
      throw new Error('subject или viewer не в проекте');
    }

    return db.referralStatsGrant.upsert({
      where: {
        projectId_subjectUserId_viewerUserId: {
          projectId,
          subjectUserId,
          viewerUserId
        }
      },
      create: { projectId, subjectUserId, viewerUserId },
      update: {}
    });
  }

  static async removeStatsGrant(
    projectId: string,
    subjectUserId: string,
    viewerUserId: string
  ) {
    await db.referralStatsGrant.deleteMany({
      where: { projectId, subjectUserId, viewerUserId }
    });
  }

  static async listStatsGrants(projectId: string, subjectUserId: string) {
    return db.referralStatsGrant.findMany({
      where: { projectId, subjectUserId },
      orderBy: { createdAt: 'asc' }
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Effective Grants (Phase 3) — рекурсивные обходы по `referredBy`
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Получить цепочку предков пользователя по полю `referred_by` (вверх).
   * Использует рекурсивный CTE для одного запроса; при ошибке падает на
   * итеративный обход через Prisma и логирует предупреждение.
   *
   * Возвращает идентификаторы предков, упорядоченные по возрастанию глубины
   * (ближайший предок первый). Сам пользователь не включается.
   *
   * @see Requirement 5.1 — `canViewSubject` / `Referral_Chain`
   */
  static async getAncestorChain(
    userId: string,
    projectId: string,
    depth: number = DEFAULT_TREE_DEPTH
  ): Promise<string[]> {
    const safeDepth = clampDepth(depth);
    try {
      const result = await db.$queryRaw<Array<{ id: string; depth: number }>>(
        Prisma.sql`
          WITH RECURSIVE ancestors AS (
            SELECT
              id,
              referred_by,
              1 AS depth
            FROM users
            WHERE id = ${userId} AND project_id = ${projectId}

            UNION ALL

            SELECT
              u.id,
              u.referred_by,
              a.depth + 1 AS depth
            FROM users u
            INNER JOIN ancestors a ON u.id = a.referred_by
            WHERE a.depth < ${safeDepth} AND u.project_id = ${projectId}
          )
          SELECT id, depth FROM ancestors WHERE id <> ${userId} ORDER BY depth ASC;
        `
      );
      return result.map((r) => r.id);
    } catch (err) {
      logger.warn('CTE ancestor chain failed, falling back to iterative walk', {
        err: err instanceof Error ? err.message : String(err),
        userId,
        projectId,
        component: 'referral-commission-service'
      });
      return this.iterativeAncestorChain(userId, projectId, safeDepth);
    }
  }

  /**
   * Получить дерево потомков пользователя по полю `referred_by` (вниз).
   * Использует рекурсивный CTE; на ошибку — итеративный fallback через
   * Prisma findMany.
   *
   * Возвращает идентификаторы потомков (без самого пользователя),
   * упорядоченные по возрастанию глубины.
   *
   * @see Requirement 5.2 — `getViewableSubjects`
   */
  static async getDescendantTree(
    userId: string,
    projectId: string,
    depth: number = DEFAULT_TREE_DEPTH
  ): Promise<string[]> {
    const safeDepth = clampDepth(depth);
    try {
      const result = await db.$queryRaw<Array<{ id: string; depth: number }>>(
        Prisma.sql`
          WITH RECURSIVE descendants AS (
            SELECT
              id,
              referred_by,
              0 AS depth
            FROM users
            WHERE id = ${userId} AND project_id = ${projectId}

            UNION ALL

            SELECT
              u.id,
              u.referred_by,
              d.depth + 1 AS depth
            FROM users u
            INNER JOIN descendants d ON u.referred_by = d.id
            WHERE d.depth < ${safeDepth} AND u.project_id = ${projectId}
          )
          SELECT id, depth FROM descendants WHERE id <> ${userId} ORDER BY depth ASC;
        `
      );
      return result.map((r) => r.id);
    } catch (err) {
      logger.warn(
        'CTE descendant tree failed, falling back to iterative walk',
        {
          err: err instanceof Error ? err.message : String(err),
          userId,
          projectId,
          component: 'referral-commission-service'
        }
      );
      return this.iterativeDescendantTree(userId, projectId, safeDepth);
    }
  }

  /**
   * Может ли `viewerUserId` смотреть статистику `subjectUserId`.
   *
   * Доступ разрешён, если выполняется хотя бы одно условие:
   *  1. Это тот же самый пользователь (просмотр своей статистики);
   *  2. Существует ручной грант `ReferralStatsGrant`;
   *  3. Viewer находится в цепочке предков subject'а до `maxPayoutDepth`.
   *
   * @see Requirement 5.1
   */
  static async canViewSubject(
    projectId: string,
    viewerUserId: string,
    subjectUserId: string
  ): Promise<boolean> {
    if (!projectId || !viewerUserId || !subjectUserId) return false;
    if (viewerUserId === subjectUserId) return true;

    const grant = await db.referralStatsGrant.findUnique({
      where: {
        projectId_subjectUserId_viewerUserId: {
          projectId,
          subjectUserId,
          viewerUserId
        }
      }
    });
    if (grant) return true;

    const maxDepth = await this.resolveMaxPayoutDepth(projectId);
    const ancestors = await this.getAncestorChain(
      subjectUserId,
      projectId,
      maxDepth
    );
    return ancestors.includes(viewerUserId);
  }

  /**
   * Идентификаторы пользователей, чью статистику может смотреть `viewerUserId`:
   * сам viewer + все его потомки (до `maxPayoutDepth`) + явные ручные гранты.
   *
   * @see Requirement 5.2
   */
  static async getViewableSubjects(
    projectId: string,
    viewerUserId: string
  ): Promise<string[]> {
    if (!projectId || !viewerUserId) return [];

    const maxDepth = await this.resolveMaxPayoutDepth(projectId);

    const [descendants, grants] = await Promise.all([
      this.getDescendantTree(viewerUserId, projectId, maxDepth),
      db.referralStatsGrant.findMany({
        where: { projectId, viewerUserId },
        select: { subjectUserId: true }
      })
    ]);

    const set = new Set<string>([viewerUserId]);
    for (const id of descendants) set.add(id);
    for (const g of grants) set.add(g.subjectUserId);

    return Array.from(set);
  }

  /**
   * Резолвит максимальную глубину выплат для проекта; берёт
   * `defaultReferralCommissionPlan.maxPayoutDepth`, если назначен,
   * иначе fallback на 3.
   */
  private static async resolveMaxPayoutDepth(
    projectId: string
  ): Promise<number> {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        defaultReferralCommissionPlan: { select: { maxPayoutDepth: true } }
      }
    });
    const raw =
      project?.defaultReferralCommissionPlan?.maxPayoutDepth ??
      DEFAULT_TREE_DEPTH;
    return clampDepth(raw);
  }

  /**
   * Итеративный fallback: обход вверх по `referredBy` через Prisma findFirst.
   * Защищён от циклов через множество посещённых id и ограничение глубины.
   */
  private static async iterativeAncestorChain(
    userId: string,
    projectId: string,
    depth: number
  ): Promise<string[]> {
    const safeDepth = clampDepth(depth);
    const visited = new Set<string>([userId]);
    const ancestors: string[] = [];

    let cursor: string | null = userId;
    for (let i = 0; i < safeDepth; i += 1) {
      const node: { referredBy: string | null } | null =
        await db.user.findFirst({
          where: { id: cursor as string, projectId },
          select: { referredBy: true }
        });
      const next = node?.referredBy ?? null;
      if (!next) break;
      if (visited.has(next)) {
        logger.warn('Detected cycle while walking ancestor chain', {
          userId,
          projectId,
          cycleAt: next,
          component: 'referral-commission-service'
        });
        break;
      }
      visited.add(next);
      ancestors.push(next);
      cursor = next;
    }
    return ancestors;
  }

  /**
   * Итеративный fallback: BFS вниз по `referredBy` через Prisma findMany.
   * Защищён от циклов через множество посещённых id.
   */
  private static async iterativeDescendantTree(
    userId: string,
    projectId: string,
    depth: number
  ): Promise<string[]> {
    const safeDepth = clampDepth(depth);
    const visited = new Set<string>([userId]);
    const result: string[] = [];

    let frontier: string[] = [userId];
    for (let level = 0; level < safeDepth && frontier.length > 0; level += 1) {
      const children: Array<{ id: string }> = await db.user.findMany({
        where: {
          projectId,
          referredBy: { in: frontier }
        },
        select: { id: true }
      });
      const nextFrontier: string[] = [];
      for (const c of children) {
        if (visited.has(c.id)) continue;
        visited.add(c.id);
        result.push(c.id);
        nextFrontier.push(c.id);
      }
      frontier = nextFrontier;
    }
    return result;
  }

  private static normalizeLevels(levels: PlanLevelInput[]): PlanLevelInput[] {
    const by = new Map<number, PlanLevelInput>();
    for (const l of levels) {
      const level = Math.min(Math.max(Math.trunc(l.level), 1), 3);
      by.set(level, {
        level,
        percent: Math.max(0, Math.min(100, Number(l.percent))),
        isActive: l.isActive
      });
    }
    return Array.from(by.values()).sort((a, b) => a.level - b.level);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Per-request memoization (Phase 3.6) — React `cache` оборачивает дорогие
// проверки доступа в рамках одного серверного запроса. Несколько вызовов
// внутри одного запроса (например, /team + /payouts отдают один и тот же
// результат) не повторяют CTE.
// ──────────────────────────────────────────────────────────────────────────────

export const cachedCanViewSubject = cache(
  (projectId: string, viewerUserId: string, subjectUserId: string) =>
    ReferralCommissionService.canViewSubject(
      projectId,
      viewerUserId,
      subjectUserId
    )
);

export const cachedGetViewableSubjects = cache(
  (projectId: string, viewerUserId: string) =>
    ReferralCommissionService.getViewableSubjects(projectId, viewerUserId)
);

export const cachedGetAncestorChain = cache(
  (userId: string, projectId: string, depth?: number) =>
    ReferralCommissionService.getAncestorChain(userId, projectId, depth)
);

export const cachedGetDescendantTree = cache(
  (userId: string, projectId: string, depth?: number) =>
    ReferralCommissionService.getDescendantTree(userId, projectId, depth)
);
