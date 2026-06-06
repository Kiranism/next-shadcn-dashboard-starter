/**
 * @file: partner-team.service.ts
 * @description: Управление командой партнёра — просмотр, добавление, удаление, заявки на вступление
 * @project: SaaS Bonus System
 * @created: 2026-06-07
 */

import type { PartnerRole } from '@prisma/client';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { PartnerOrganizationService } from './partner-organization.service';
import { PartnerNotificationService } from './partner-notification.service';
import { ReferralCommissionService } from './referral-commission.service';

export type TeamListFilter = 'direct' | 'clients' | 'partners' | 'all';

const ROLE_RANK: Record<PartnerRole, number> = {
  CLIENT: 0,
  TRAINER: 1,
  MANAGER: 2,
  DIRECTOR: 3
};

export type TeamMemberRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  partnerRole: string;
  registeredAt: string;
  isDirect: boolean;
  totalPurchases: number;
  commissionEarned: number;
};

export type OrgHierarchyWarning = {
  code: string;
  message: string;
  userId?: string;
  userName?: string;
};

function displayName(u: {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  id: string;
}): string {
  const full = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  return full || u.email || u.phone || u.id.slice(0, 8);
}

export class PartnerTeamService {
  static async getProjectPartnerFlags(projectId: string) {
    return db.project.findUnique({
      where: { id: projectId },
      select: {
        enablePartnerRoles: true,
        enablePartnerTeamManagement: true,
        referralJoinRequiresApproval: true
      }
    });
  }

  static async canManageSubject(
    projectId: string,
    viewerUserId: string,
    subjectUserId: string
  ): Promise<boolean> {
    if (!projectId || !viewerUserId || !subjectUserId) return false;
    if (viewerUserId === subjectUserId) return false;

    const project = await this.getProjectPartnerFlags(projectId);
    if (!project?.enablePartnerRoles || !project.enablePartnerTeamManagement) {
      return false;
    }

    const [viewer, subject] = await Promise.all([
      db.user.findFirst({
        where: { id: viewerUserId, projectId },
        select: { partnerRole: true, organizationId: true }
      }),
      db.user.findFirst({
        where: { id: subjectUserId, projectId },
        select: { partnerRole: true, organizationId: true }
      })
    ]);

    if (!viewer || !subject) return false;
    if (viewer.partnerRole === 'CLIENT') return false;
    if (ROLE_RANK[viewer.partnerRole] <= ROLE_RANK[subject.partnerRole]) {
      return false;
    }

    if (
      viewer.organizationId &&
      subject.organizationId &&
      viewer.organizationId !== subject.organizationId
    ) {
      return false;
    }

    return ReferralCommissionService.canViewSubject(
      projectId,
      viewerUserId,
      subjectUserId
    );
  }

  static async canInviteUser(
    projectId: string,
    viewerUserId: string,
    targetUserId: string,
    targetRole: PartnerRole = 'TRAINER'
  ): Promise<boolean> {
    if (viewerUserId === targetUserId) return false;

    const project = await this.getProjectPartnerFlags(projectId);
    if (!project?.enablePartnerRoles || !project.enablePartnerTeamManagement) {
      return false;
    }

    const [viewer, target] = await Promise.all([
      db.user.findFirst({
        where: { id: viewerUserId, projectId },
        select: { partnerRole: true, organizationId: true }
      }),
      db.user.findFirst({
        where: { id: targetUserId, projectId },
        select: { partnerRole: true, organizationId: true, referredBy: true }
      })
    ]);

    if (!viewer || !target) return false;
    if (!['MANAGER', 'DIRECTOR'].includes(viewer.partnerRole)) return false;
    if (target.referredBy) return false;

    if (viewer.partnerRole === 'MANAGER' && targetRole !== 'TRAINER') {
      return false;
    }

    if (
      viewer.organizationId &&
      target.organizationId &&
      target.organizationId !== viewer.organizationId
    ) {
      return false;
    }

    return true;
  }

  static async canReviewJoinRequest(
    projectId: string,
    reviewerUserId: string,
    referrerId: string,
    organizationId: string | null
  ): Promise<boolean> {
    if (reviewerUserId === referrerId) return true;

    const reviewer = await db.user.findFirst({
      where: { id: reviewerUserId, projectId },
      select: { partnerRole: true, organizationId: true }
    });
    if (!reviewer || reviewer.partnerRole === 'CLIENT') return false;

    if (
      reviewer.partnerRole === 'DIRECTOR' &&
      organizationId &&
      reviewer.organizationId === organizationId
    ) {
      return true;
    }

    if (reviewer.partnerRole === 'MANAGER') {
      const referrer = await db.user.findFirst({
        where: { id: referrerId, projectId },
        select: { referredBy: true }
      });
      if (referrer?.referredBy === reviewerUserId) return true;
    }

    return false;
  }

  static async listTeam(params: {
    projectId: string;
    viewerUserId: string;
    filter?: TeamListFilter;
    page?: number;
    pageSize?: number;
  }) {
    const {
      projectId,
      viewerUserId,
      filter = 'direct',
      page = 1,
      pageSize = 10
    } = params;

    const directRows = await db.user.findMany({
      where: { projectId, referredBy: viewerUserId },
      select: { id: true, partnerRole: true }
    });
    const directIds = directRows.map((u) => u.id);

    const allDescendantIds = await ReferralCommissionService.getDescendantTree(
      viewerUserId,
      projectId
    );

    let targetIds: string[];
    switch (filter) {
      case 'clients':
        targetIds = directRows
          .filter((p) => p.partnerRole === 'CLIENT')
          .map((p) => p.id);
        break;
      case 'partners': {
        const profiles = await db.user.findMany({
          where: {
            projectId,
            id: { in: allDescendantIds },
            partnerRole: { in: ['TRAINER', 'MANAGER'] }
          },
          select: { id: true }
        });
        targetIds = profiles.map((p) => p.id);
        break;
      }
      case 'all':
        targetIds = allDescendantIds;
        break;
      case 'direct':
      default:
        targetIds = directIds;
        break;
    }

    const total = targetIds.length;
    const start = (page - 1) * pageSize;
    const pageIds = targetIds.slice(start, start + pageSize);
    const directSet = new Set(directIds);

    if (pageIds.length === 0) {
      return { items: [] as TeamMemberRow[], total, page, pageSize };
    }

    const profiles = await db.user.findMany({
      where: { projectId, id: { in: pageIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        partnerRole: true,
        registeredAt: true,
        totalPurchases: true
      }
    });

    const commissionAgg = await db.transaction.groupBy({
      by: ['referralUserId'],
      where: {
        userId: viewerUserId,
        type: 'EARN',
        isReferralBonus: true,
        referralUserId: { in: pageIds }
      },
      _sum: { amount: true }
    });
    const commissionByReferral = new Map<string, number>();
    for (const row of commissionAgg) {
      if (row.referralUserId) {
        commissionByReferral.set(
          row.referralUserId,
          Number(row._sum.amount ?? 0)
        );
      }
    }

    const profileById = new Map(profiles.map((p) => [p.id, p]));
    const items: TeamMemberRow[] = [];
    for (const id of pageIds) {
      const p = profileById.get(id);
      if (!p) continue;
      items.push({
        id: p.id,
        name: displayName(p),
        email: p.email,
        phone: p.phone,
        partnerRole: p.partnerRole,
        registeredAt: p.registeredAt.toISOString(),
        isDirect: directSet.has(p.id),
        totalPurchases: Number(p.totalPurchases ?? 0),
        commissionEarned: commissionByReferral.get(p.id) ?? 0
      });
    }

    return { items, total, page, pageSize };
  }

  static async addToTeam(params: {
    projectId: string;
    managerUserId: string;
    targetUserId: string;
    partnerRole?: PartnerRole;
  }) {
    const partnerRole = params.partnerRole ?? 'TRAINER';
    const allowed = await this.canInviteUser(
      params.projectId,
      params.managerUserId,
      params.targetUserId,
      partnerRole
    );
    if (!allowed) {
      throw new Error('Нет прав добавить этого пользователя в команду');
    }

    const manager = await db.user.findFirst({
      where: { id: params.managerUserId, projectId: params.projectId },
      select: { organizationId: true }
    });

    const updated = await db.user.update({
      where: { id: params.targetUserId },
      data: {
        referredBy: params.managerUserId,
        partnerRole,
        ...(manager?.organizationId
          ? { organizationId: manager.organizationId }
          : {})
      }
    });

    try {
      await ReferralCommissionService.syncAttributionForInvitedUser({
        invitedUserId: params.targetUserId,
        projectId: params.projectId,
        referrerId: params.managerUserId,
        organizationId: manager?.organizationId ?? null
      });
    } catch (err) {
      logger.warn('addToTeam: attribution sync failed', { err });
    }

    void PartnerNotificationService.notifyAncestorsAboutNewMember(
      params.targetUserId,
      params.projectId
    );

    return updated;
  }

  static async removeFromTeam(params: {
    projectId: string;
    managerUserId: string;
    subjectUserId: string;
  }) {
    const allowed = await this.canManageSubject(
      params.projectId,
      params.managerUserId,
      params.subjectUserId
    );
    if (!allowed) {
      throw new Error('Нет прав убрать этого участника из команды');
    }

    return db.user.update({
      where: { id: params.subjectUserId },
      data: { referredBy: null }
    });
  }

  static async createJoinRequest(params: {
    projectId: string;
    userId: string;
    referrerId: string;
    organizationId?: string | null;
  }) {
    const existing = await db.partnerJoinRequest.findUnique({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId: params.userId
        }
      }
    });

    if (existing?.status === 'PENDING') return existing;

    const request = existing
      ? await db.partnerJoinRequest.update({
          where: { id: existing.id },
          data: {
            referrerId: params.referrerId,
            organizationId: params.organizationId ?? null,
            status: 'PENDING',
            reviewedBy: null,
            reviewedAt: null,
            rejectReason: null
          }
        })
      : await db.partnerJoinRequest.create({
          data: {
            projectId: params.projectId,
            userId: params.userId,
            referrerId: params.referrerId,
            organizationId: params.organizationId ?? null,
            status: 'PENDING'
          }
        });

    void PartnerNotificationService.notifyJoinRequestPending(
      request.id,
      params.projectId
    );

    return request;
  }

  static async listPendingRequestsForReviewer(
    projectId: string,
    reviewerUserId: string
  ) {
    const pending = await db.partnerJoinRequest.findMany({
      where: { projectId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const filtered = [];
    for (const req of pending) {
      const ok = await this.canReviewJoinRequest(
        projectId,
        reviewerUserId,
        req.referrerId,
        req.organizationId
      );
      if (ok) filtered.push(req);
    }

    if (filtered.length === 0) return [];

    const userIds = [
      ...new Set(filtered.flatMap((r) => [r.userId, r.referrerId]))
    ];
    const users = await db.user.findMany({
      where: { id: { in: userIds }, projectId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true
      }
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    return filtered.map((r) => ({
      ...r,
      user: userById.get(r.userId),
      referrer: userById.get(r.referrerId)
    }));
  }

  static async approveJoinRequest(params: {
    projectId: string;
    requestId: string;
    reviewerUserId: string;
  }) {
    const request = await db.partnerJoinRequest.findFirst({
      where: { id: params.requestId, projectId: params.projectId }
    });
    if (!request || request.status !== 'PENDING') {
      throw new Error('Заявка не найдена или уже обработана');
    }

    const canReview = await this.canReviewJoinRequest(
      params.projectId,
      params.reviewerUserId,
      request.referrerId,
      request.organizationId
    );
    if (!canReview) throw new Error('Нет прав одобрить эту заявку');

    await db.user.update({
      where: { id: request.userId },
      data: {
        referredBy: request.referrerId,
        ...(request.organizationId
          ? { organizationId: request.organizationId }
          : {})
      }
    });

    try {
      await ReferralCommissionService.syncAttributionForInvitedUser({
        invitedUserId: request.userId,
        projectId: params.projectId,
        referrerId: request.referrerId,
        organizationId: request.organizationId
      });
    } catch (err) {
      logger.warn('approveJoinRequest: attribution failed', { err });
    }

    await db.partnerJoinRequest.update({
      where: { id: request.id },
      data: {
        status: 'APPROVED',
        reviewedBy: params.reviewerUserId,
        reviewedAt: new Date()
      }
    });

    void PartnerNotificationService.notifyAncestorsAboutNewMember(
      request.userId,
      params.projectId
    );

    return request;
  }

  static async rejectJoinRequest(params: {
    projectId: string;
    requestId: string;
    reviewerUserId: string;
    reason?: string;
  }) {
    const request = await db.partnerJoinRequest.findFirst({
      where: { id: params.requestId, projectId: params.projectId }
    });
    if (!request || request.status !== 'PENDING') {
      throw new Error('Заявка не найдена или уже обработана');
    }

    const canReview = await this.canReviewJoinRequest(
      params.projectId,
      params.reviewerUserId,
      request.referrerId,
      request.organizationId
    );
    if (!canReview) throw new Error('Нет прав отклонить эту заявку');

    return db.partnerJoinRequest.update({
      where: { id: request.id },
      data: {
        status: 'REJECTED',
        reviewedBy: params.reviewerUserId,
        reviewedAt: new Date(),
        rejectReason: params.reason ?? null
      }
    });
  }

  static resolveDefaultReferrerForOrgMember(params: {
    partnerRole: PartnerRole;
    members: Array<{ id: string; partnerRole: string }>;
    directorUserId: string | null;
  }): string | null {
    const { partnerRole, members, directorUserId } = params;

    if (partnerRole === 'DIRECTOR') return null;
    if (partnerRole === 'MANAGER' && directorUserId) return directorUserId;

    if (partnerRole === 'TRAINER') {
      const manager = members.find((m) => m.partnerRole === 'MANAGER');
      if (manager) return manager.id;
      if (directorUserId) return directorUserId;
    }

    return null;
  }

  static async validateOrganizationHierarchy(
    projectId: string,
    organizationId: string
  ): Promise<OrgHierarchyWarning[]> {
    const org = await PartnerOrganizationService.getById(
      projectId,
      organizationId
    );
    if (!org) return [];

    const members = await PartnerOrganizationService.listMembers(
      projectId,
      organizationId
    );
    const warnings: OrgHierarchyWarning[] = [];

    if (!org.directorUserId) {
      warnings.push({
        code: 'NO_DIRECTOR',
        message: 'Не назначен директор сети — L3 может не начисляться'
      });
    }

    for (const m of members) {
      if (m.partnerRole === 'MANAGER' && !m.referredBy) {
        warnings.push({
          code: 'MANAGER_NO_REFERRER',
          message: `Менеджер «${m.name}» без реферера`,
          userId: m.id,
          userName: m.name
        });
      }
      if (m.partnerRole === 'TRAINER' && !m.referredBy) {
        warnings.push({
          code: 'TRAINER_NO_REFERRER',
          message: `Тренер «${m.name}» без реферера`,
          userId: m.id,
          userName: m.name
        });
      }
    }

    return warnings;
  }

  static async resolvePayoutChain(
    startReferrerId: string | null,
    projectId: string,
    depth: number
  ) {
    const chain: Array<{
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      phone: string | null;
      referredBy: string | null;
    }> = [];

    if (!startReferrerId) return chain;

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { enablePartnerRoles: true }
    });

    let currentId: string | null = startReferrerId;
    const visited = new Set<string>();

    for (let level = 0; level < depth && currentId; level++) {
      if (visited.has(currentId)) break;
      visited.add(currentId);

      const node = await db.user.findFirst({
        where: { id: currentId, projectId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          referredBy: true,
          partnerRole: true,
          organizationId: true
        }
      });
      if (!node) break;

      chain.push(node);

      if (node.referredBy && !visited.has(node.referredBy)) {
        currentId = node.referredBy;
        continue;
      }

      if (!project?.enablePartnerRoles || !node.organizationId) break;

      const org = await db.partnerOrganization.findFirst({
        where: { id: node.organizationId, projectId },
        select: { directorUserId: true }
      });

      if (level === 0 && node.partnerRole === 'TRAINER') {
        const manager = await db.user.findFirst({
          where: {
            projectId,
            organizationId: node.organizationId,
            partnerRole: 'MANAGER',
            ...(org?.directorUserId ? { referredBy: org.directorUserId } : {})
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            referredBy: true
          },
          orderBy: { registeredAt: 'asc' }
        });
        if (manager && !visited.has(manager.id)) {
          currentId = manager.id;
          continue;
        }
      }

      if (
        org?.directorUserId &&
        !visited.has(org.directorUserId) &&
        level >= 1
      ) {
        currentId = org.directorUserId;
        continue;
      }

      break;
    }

    return chain.slice(0, depth);
  }

  static async linkReferralWithPolicy(params: {
    userId: string;
    projectId: string;
    referrerId: string;
    organizationId?: string | null;
  }): Promise<{ linked: boolean; pending: boolean; referrerId?: string }> {
    const flags = await this.getProjectPartnerFlags(params.projectId);

    if (
      flags?.referralJoinRequiresApproval &&
      flags.enablePartnerTeamManagement
    ) {
      await this.createJoinRequest({
        projectId: params.projectId,
        userId: params.userId,
        referrerId: params.referrerId,
        organizationId: params.organizationId
      });
      return { linked: false, pending: true, referrerId: params.referrerId };
    }

    await db.user.update({
      where: { id: params.userId },
      data: {
        referredBy: params.referrerId,
        ...(params.organizationId
          ? { organizationId: params.organizationId }
          : {})
      }
    });

    await ReferralCommissionService.syncAttributionForInvitedUser({
      invitedUserId: params.userId,
      projectId: params.projectId,
      referrerId: params.referrerId,
      organizationId: params.organizationId ?? null
    });

    void PartnerNotificationService.notifyAncestorsAboutNewMember(
      params.userId,
      params.projectId
    );

    return { linked: true, pending: false, referrerId: params.referrerId };
  }
}
