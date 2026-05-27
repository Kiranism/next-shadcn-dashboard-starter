/**
 * @file: src/app/api/projects/[id]/users/[userId]/team/route.ts
 * @description: GET — список рефералов пользователя (direct + indirect) с агрегатами totalPurchases и commissionEarned. Поддерживает фильтр type=direct|indirect|all и пагинацию.
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
import { cachedGetDescendantTree } from '@/lib/services/referral-commission.service';

type TeamItem = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  partnerRole: string;
  registeredAt: string;
  isDirect: boolean;
  totalPurchases: number;
  commissionEarned: number;
};

const ALLOWED_TYPES = new Set(['direct', 'indirect', 'all']);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId, userId } = await context.params;

  try {
    await ProjectService.verifyProjectAccess(projectId, admin.sub);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const url = request.nextUrl;
    const typeParam = (url.searchParams.get('type') || 'all').toLowerCase();
    const type = ALLOWED_TYPES.has(typeParam) ? typeParam : 'all';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10))
    );

    // Проверяем что user существует в проекте.
    const user = await db.user.findFirst({
      where: { id: userId, projectId },
      select: { id: true }
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Прямые рефералы — те, у кого referredBy = userId.
    const directIds = (
      await db.user.findMany({
        where: { projectId, referredBy: userId },
        select: { id: true }
      })
    ).map((u) => u.id);
    const directSet = new Set<string>(directIds);

    // Все потомки (включая прямых) до глубины проекта.
    const allDescendantIds = await cachedGetDescendantTree(userId, projectId);
    const indirectIds = allDescendantIds.filter((id) => !directSet.has(id));

    let targetIds: string[];
    if (type === 'direct') {
      targetIds = directIds;
    } else if (type === 'indirect') {
      targetIds = indirectIds;
    } else {
      // direct сначала, потом indirect — стабильный порядок для UI.
      targetIds = [...directIds, ...indirectIds];
    }

    const total = targetIds.length;
    const start = (page - 1) * pageSize;
    const pageIds = targetIds.slice(start, start + pageSize);

    if (pageIds.length === 0) {
      return NextResponse.json({
        items: [] as TeamItem[],
        total,
        page,
        pageSize,
        totals: {
          direct: directIds.length,
          indirect: indirectIds.length,
          all: total
        }
      });
    }

    // Загружаем профили постранично.
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

    // Сумма комиссий, начисленных userId со ссылок на каждого subject'а.
    const commissionAgg = await db.transaction.groupBy({
      by: ['referralUserId'],
      where: {
        userId,
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
    const items: TeamItem[] = [];
    for (const id of pageIds) {
      const p = profileById.get(id);
      if (!p) continue;
      items.push({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        partnerRole: p.partnerRole,
        registeredAt: p.registeredAt.toISOString(),
        isDirect: directSet.has(p.id),
        totalPurchases: Number(p.totalPurchases ?? 0),
        commissionEarned: commissionByReferral.get(p.id) ?? 0
      });
    }

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totals: {
        direct: directIds.length,
        indirect: indirectIds.length,
        all: directIds.length + indirectIds.length
      }
    });
  } catch (error) {
    logger.error('GET /api/projects/[id]/users/[userId]/team failed', {
      error: error instanceof Error ? error.message : String(error),
      projectId,
      userId,
      component: 'api-team'
    });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
