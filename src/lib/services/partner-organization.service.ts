/**
 * @file: partner-organization.service.ts
 * @description: CRUD и статистика B2B-организаций (сети фитнес-клубов)
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface CreateOrganizationInput {
  projectId: string;
  name: string;
  slug?: string;
  description?: string;
  defaultReferralCommissionPlanId?: string | null;
  directorUserId?: string | null;
}

export interface OrganizationStats {
  members: number;
  trainers: number;
  managers: number;
  directors: number;
  clients: number;
  totalPurchases: number;
  commissionEarned: number;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0400-\u04FF]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'org'
  );
}

export class PartnerOrganizationService {
  static async list(projectId: string) {
    return db.partnerOrganization.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
      include: {
        defaultReferralCommissionPlan: { select: { id: true, name: true } },
        _count: { select: { members: true } }
      }
    });
  }

  static async getById(projectId: string, organizationId: string) {
    return db.partnerOrganization.findFirst({
      where: { id: organizationId, projectId },
      include: {
        defaultReferralCommissionPlan: { select: { id: true, name: true } },
        _count: { select: { members: true } }
      }
    });
  }

  static async resolveBySlug(
    projectId: string,
    slug: string | null | undefined
  ) {
    if (!slug?.trim()) return null;
    return db.partnerOrganization.findFirst({
      where: {
        projectId,
        slug: slug.trim().toLowerCase(),
        isActive: true
      }
    });
  }

  static async create(input: CreateOrganizationInput) {
    const slug = (input.slug?.trim() || slugify(input.name)).toLowerCase();
    const existing = await db.partnerOrganization.findFirst({
      where: { projectId: input.projectId, slug }
    });
    if (existing) {
      throw new Error(`Организация со slug «${slug}» уже существует`);
    }

    const org = await db.partnerOrganization.create({
      data: {
        projectId: input.projectId,
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        defaultReferralCommissionPlanId:
          input.defaultReferralCommissionPlanId || null,
        directorUserId: input.directorUserId || null
      }
    });

    if (input.directorUserId) {
      await db.user.updateMany({
        where: { id: input.directorUserId, projectId: input.projectId },
        data: {
          organizationId: org.id,
          partnerRole: 'DIRECTOR'
        }
      });
    }

    return org;
  }

  static async update(
    projectId: string,
    organizationId: string,
    data: Partial<CreateOrganizationInput> & { isActive?: boolean }
  ) {
    const org = await this.getById(projectId, organizationId);
    if (!org) throw new Error('Организация не найдена');

    let slug = data.slug?.trim().toLowerCase();
    if (slug && slug !== org.slug) {
      const clash = await db.partnerOrganization.findFirst({
        where: { projectId, slug, NOT: { id: organizationId } }
      });
      if (clash) throw new Error(`Slug «${slug}» уже занят`);
    }

    const updated = await db.partnerOrganization.update({
      where: { id: organizationId },
      data: {
        name: data.name?.trim() ?? undefined,
        slug: slug ?? undefined,
        description:
          data.description !== undefined
            ? data.description?.trim() || null
            : undefined,
        isActive: data.isActive,
        defaultReferralCommissionPlanId:
          data.defaultReferralCommissionPlanId !== undefined
            ? data.defaultReferralCommissionPlanId
            : undefined,
        directorUserId:
          data.directorUserId !== undefined ? data.directorUserId : undefined
      }
    });

    if (data.directorUserId) {
      await db.user.updateMany({
        where: { id: data.directorUserId, projectId },
        data: { organizationId, partnerRole: 'DIRECTOR' }
      });
    }

    return updated;
  }

  static async delete(projectId: string, organizationId: string) {
    const org = await this.getById(projectId, organizationId);
    if (!org) throw new Error('Организация не найдена');

    await db.user.updateMany({
      where: { organizationId, projectId },
      data: { organizationId: null }
    });

    await db.partnerOrganization.delete({ where: { id: organizationId } });
    return { success: true };
  }

  static async assignUserToOrganization(
    projectId: string,
    userId: string,
    organizationId: string | null
  ) {
    if (organizationId) {
      const org = await this.getById(projectId, organizationId);
      if (!org) throw new Error('Организация не найдена');
    }

    return db.user.update({
      where: { id: userId },
      data: { organizationId }
    });
  }

  static async getStats(
    projectId: string,
    organizationId: string,
    since?: Date | null
  ): Promise<OrganizationStats> {
    const members = await db.user.findMany({
      where: { projectId, organizationId },
      select: {
        partnerRole: true,
        totalPurchases: true,
        id: true
      }
    });

    const roleCount = (role: string) =>
      members.filter((m) => m.partnerRole === role).length;

    const userIds = members.map((m) => m.id);
    let commissionEarned = 0;

    if (userIds.length > 0) {
      const agg = await db.transaction.aggregate({
        where: {
          userId: { in: userIds },
          type: 'EARN',
          isReferralBonus: true,
          ...(since ? { createdAt: { gte: since } } : {})
        },
        _sum: { amount: true }
      });
      commissionEarned = Number(agg._sum.amount ?? 0);
    }

    return {
      members: members.length,
      trainers: roleCount('TRAINER'),
      managers: roleCount('MANAGER'),
      directors: roleCount('DIRECTOR'),
      clients: roleCount('CLIENT'),
      totalPurchases: members.reduce(
        (sum, m) => sum + Number(m.totalPurchases ?? 0),
        0
      ),
      commissionEarned
    };
  }

  static async resolveOrganizationIdForRegistration(params: {
    projectId: string;
    utmOrgSlug?: string | null;
    referrerId?: string | null;
  }): Promise<string | null> {
    const { projectId, utmOrgSlug, referrerId } = params;

    if (utmOrgSlug) {
      const bySlug = await this.resolveBySlug(projectId, utmOrgSlug);
      if (bySlug) return bySlug.id;
      logger.warn('utm_org slug not found', { projectId, utmOrgSlug });
    }

    if (referrerId) {
      const referrer = await db.user.findFirst({
        where: { id: referrerId, projectId },
        select: { organizationId: true }
      });
      if (referrer?.organizationId) return referrer.organizationId;
    }

    return null;
  }
}
