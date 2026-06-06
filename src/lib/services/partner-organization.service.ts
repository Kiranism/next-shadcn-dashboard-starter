/**
 * @file: partner-organization.service.ts
 * @description: CRUD и статистика B2B-организаций (сети фитнес-клубов)
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { PartnerTeamService } from './partner-team.service';

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
    const org = await db.partnerOrganization.findFirst({
      where: { id: organizationId, projectId },
      include: {
        defaultReferralCommissionPlan: { select: { id: true, name: true } },
        _count: { select: { members: true } }
      }
    });
    if (!org) return null;

    let director: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      phone: string | null;
    } | null = null;

    if (org.directorUserId) {
      director = await db.user.findFirst({
        where: { id: org.directorUserId, projectId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          partnerRole: true
        }
      });
    }

    return { ...org, director };
  }

  static async listMembers(projectId: string, organizationId: string) {
    const org = await this.getById(projectId, organizationId);
    if (!org) throw new Error('Организация не найдена');

    const members = await db.user.findMany({
      where: { projectId, organizationId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        partnerRole: true,
        referredBy: true,
        outboundReferralPlanId: true,
        registeredAt: true,
        totalPurchases: true,
        isActive: true
      },
      orderBy: [{ partnerRole: 'desc' }, { registeredAt: 'asc' }]
    });

    const referrerIds = [
      ...new Set(members.map((m) => m.referredBy).filter(Boolean))
    ] as string[];

    const referrers =
      referrerIds.length > 0
        ? await db.user.findMany({
            where: { id: { in: referrerIds }, projectId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          })
        : [];

    const referrerMap = new Map(referrers.map((r) => [r.id, r]));

    const planIds = [
      ...new Set(members.map((m) => m.outboundReferralPlanId).filter(Boolean))
    ] as string[];

    const plans =
      planIds.length > 0
        ? await db.referralCommissionPlan.findMany({
            where: { id: { in: planIds }, projectId },
            select: { id: true, name: true }
          })
        : [];

    const planMap = new Map(plans.map((p) => [p.id, p.name]));

    return members.map((m) => {
      const ref = m.referredBy ? referrerMap.get(m.referredBy) : null;
      const refName = ref
        ? [ref.firstName, ref.lastName].filter(Boolean).join(' ').trim() ||
          ref.email ||
          ref.id.slice(0, 8)
        : null;
      return {
        id: m.id,
        name:
          [m.firstName, m.lastName].filter(Boolean).join(' ').trim() ||
          m.email ||
          m.phone ||
          m.id.slice(0, 8),
        email: m.email,
        phone: m.phone,
        partnerRole: m.partnerRole,
        referredBy: m.referredBy,
        referrerName: refName,
        outboundReferralPlanId: m.outboundReferralPlanId,
        outboundPlanName: m.outboundReferralPlanId
          ? (planMap.get(m.outboundReferralPlanId) ?? null)
          : null,
        registeredAt: m.registeredAt.toISOString(),
        totalPurchases: Number(m.totalPurchases ?? 0),
        isActive: m.isActive
      };
    });
  }

  static async addMember(
    projectId: string,
    organizationId: string,
    input: {
      userId: string;
      partnerRole?: 'CLIENT' | 'TRAINER' | 'MANAGER' | 'DIRECTOR';
      referredBy?: string | null;
      outboundReferralPlanId?: string | null;
    }
  ) {
    const org = await this.getById(projectId, organizationId);
    if (!org) throw new Error('Организация не найдена');

    const user = await db.user.findFirst({
      where: { id: input.userId, projectId }
    });
    if (!user) throw new Error('Пользователь не найден');

    if (input.referredBy) {
      if (input.referredBy === input.userId) {
        throw new Error('Пользователь не может быть реферером сам себе');
      }
      const referrer = await db.user.findFirst({
        where: { id: input.referredBy, projectId }
      });
      if (!referrer) throw new Error('Реферер не найден');
    }

    let referredBy = input.referredBy;
    if (referredBy === undefined) {
      const members = await this.listMembers(projectId, organizationId);
      referredBy = PartnerTeamService.resolveDefaultReferrerForOrgMember({
        partnerRole: input.partnerRole ?? 'CLIENT',
        members: members.map((m) => ({
          id: m.id,
          partnerRole: m.partnerRole
        })),
        directorUserId: org.directorUserId
      });
    }

    const updated = await db.user.update({
      where: { id: input.userId },
      data: {
        organizationId,
        ...(input.partnerRole ? { partnerRole: input.partnerRole } : {}),
        ...(referredBy !== undefined ? { referredBy } : {}),
        ...(input.outboundReferralPlanId !== undefined
          ? { outboundReferralPlanId: input.outboundReferralPlanId }
          : {})
      }
    });

    if (
      input.partnerRole === 'DIRECTOR' ||
      (org.directorUserId === input.userId && input.partnerRole !== 'CLIENT')
    ) {
      await db.partnerOrganization.update({
        where: { id: organizationId },
        data: { directorUserId: input.userId }
      });
    }

    return updated;
  }

  static async removeMember(
    projectId: string,
    organizationId: string,
    userId: string
  ) {
    const user = await db.user.findFirst({
      where: { id: userId, projectId, organizationId }
    });
    if (!user) throw new Error('Участник не найден в этой организации');

    const org = await this.getById(projectId, organizationId);
    if (org?.directorUserId === userId) {
      await db.partnerOrganization.update({
        where: { id: organizationId },
        data: { directorUserId: null }
      });
    }

    return db.user.update({
      where: { id: userId },
      data: { organizationId: null }
    });
  }

  static async updateMember(
    projectId: string,
    organizationId: string,
    userId: string,
    input: {
      partnerRole?: 'CLIENT' | 'TRAINER' | 'MANAGER' | 'DIRECTOR';
      referredBy?: string | null;
      outboundReferralPlanId?: string | null;
    }
  ) {
    const user = await db.user.findFirst({
      where: { id: userId, projectId, organizationId }
    });
    if (!user) throw new Error('Участник не найден в этой организации');

    if (input.referredBy) {
      if (input.referredBy === userId) {
        throw new Error('Пользователь не может быть реферером сам себе');
      }
      const referrer = await db.user.findFirst({
        where: { id: input.referredBy, projectId }
      });
      if (!referrer) throw new Error('Реферер не найден');
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        ...(input.partnerRole !== undefined
          ? { partnerRole: input.partnerRole }
          : {}),
        ...(input.referredBy !== undefined
          ? { referredBy: input.referredBy }
          : {}),
        ...(input.outboundReferralPlanId !== undefined
          ? { outboundReferralPlanId: input.outboundReferralPlanId }
          : {})
      }
    });

    if (input.partnerRole === 'DIRECTOR') {
      await db.partnerOrganization.update({
        where: { id: organizationId },
        data: { directorUserId: userId }
      });
    } else if (
      (await this.getById(projectId, organizationId))?.directorUserId === userId
    ) {
      await db.partnerOrganization.update({
        where: { id: organizationId },
        data: { directorUserId: null }
      });
    }

    return updated;
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
