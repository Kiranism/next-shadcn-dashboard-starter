/**
 * @file: src/app/api/projects/[id]/users/[userId]/team/[subjectUserId]/route.ts
 * @description: GET — детальная статистика подопечного `subjectUserId` глазами `userId`. Доступ через `canViewSubject`. Возвращает имя, телефон, регистрацию, число прямых рефералов, оборот, комиссию заработанную userId с этого subject'а.
 * @project: SaaS Bonus System
 * @dependencies: Next.js API Routes, Prisma, ReferralCommissionService
 * @created: 2026-05-24
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';

import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ProjectService } from '@/lib/services/project.service';
import { cachedCanViewSubject } from '@/lib/services/referral-commission.service';

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string; userId: string; subjectUserId: string }>;
  }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId, userId, subjectUserId } = await context.params;

  try {
    await ProjectService.verifyProjectAccess(projectId, admin.sub);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const allowed = await cachedCanViewSubject(
      projectId,
      userId,
      subjectUserId
    );
    if (!allowed) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const subject = await db.user.findFirst({
      where: { id: subjectUserId, projectId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        partnerRole: true,
        registeredAt: true,
        totalPurchases: true,
        currentLevel: true
      }
    });
    if (!subject) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const [directReferralsCount, commissionAgg] = await Promise.all([
      db.user.count({
        where: { projectId, referredBy: subjectUserId }
      }),
      db.transaction.aggregate({
        where: {
          userId,
          type: 'EARN',
          isReferralBonus: true,
          referralUserId: subjectUserId
        },
        _sum: { amount: true },
        _count: { _all: true }
      })
    ]);

    return NextResponse.json({
      subject: {
        id: subject.id,
        firstName: subject.firstName,
        lastName: subject.lastName,
        email: subject.email,
        phone: subject.phone,
        partnerRole: subject.partnerRole,
        currentLevel: subject.currentLevel,
        registeredAt: subject.registeredAt.toISOString(),
        totalPurchases: Number(subject.totalPurchases ?? 0)
      },
      stats: {
        directReferralsCount,
        commissionEarnedFromSubject: Number(commissionAgg._sum.amount ?? 0),
        commissionTransactionsCount: commissionAgg._count._all
      }
    });
  } catch (error) {
    logger.error(
      'GET /api/projects/[id]/users/[userId]/team/[subjectUserId] failed',
      {
        error: error instanceof Error ? error.message : String(error),
        projectId,
        userId,
        subjectUserId,
        component: 'api-team-subject'
      }
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
