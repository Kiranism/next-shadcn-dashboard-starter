/**
 * @file: src/lib/services/referral-commission.service.ts
 * @description: Планы реферальных процентов по уровням, атрибуция при регистрации, гранты на просмотр статистики
 * @project: SaaS Bonus System
 * @dependencies: Prisma, db
 * @created: 2026-05-12
 * @author: AI Assistant + User
 */

import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

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
  }): Promise<void> {
    const { invitedUserId, projectId, referrerId } = params;

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
      project.defaultReferralCommissionPlanId
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
    projectDefaultPlanId: string | null
  ): Promise<string | null> {
    const referrer = await db.user.findFirst({
      where: { id: referrerId, projectId },
      select: { outboundReferralPlanId: true }
    });

    const preferred = referrer?.outboundReferralPlanId;
    if (preferred) {
      const ok = await db.referralCommissionPlan.findFirst({
        where: { id: preferred, projectId },
        select: { id: true }
      });
      if (ok) return ok.id;
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
      where: { id: userId, projectId }
    });
    if (!user) throw new Error('Пользователь не найден');

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
