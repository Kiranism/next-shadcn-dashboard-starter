/**
 * @file: src/app/api/projects/[id]/users/[userId]/payouts/route.ts
 * @description: GET — история реферальных EARN-транзакций пользователя (выплаты комиссии в b2b-иерархии). С пагинацией; обогащает каждую транзакцию именем клиента-источника.
 * @project: SaaS Bonus System
 * @dependencies: Next.js API Routes, Prisma
 * @created: 2026-05-24
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';

import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ProjectService } from '@/lib/services/project.service';

type PayoutItem = {
  id: string;
  amount: number;
  description: string | null;
  createdAt: string;
  level: number | null;
  referralUserId: string | null;
  referralUserName: string | null;
};

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
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10))
    );

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

    const where = {
      userId,
      type: 'EARN' as const,
      isReferralBonus: true
    };

    const [total, transactions, totalAgg] = await Promise.all([
      db.transaction.count({ where }),
      db.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          amount: true,
          description: true,
          createdAt: true,
          referralLevel: true,
          referralUserId: true,
          metadata: true
        }
      }),
      db.transaction.aggregate({ where, _sum: { amount: true } })
    ]);

    // Соберём имена клиентов-источников.
    const sourceIds = Array.from(
      new Set(
        transactions
          .map((t) => t.referralUserId)
          .filter((id): id is string => Boolean(id))
      )
    );
    const sources = sourceIds.length
      ? await db.user.findMany({
          where: { id: { in: sourceIds }, projectId },
          select: { id: true, firstName: true, lastName: true, phone: true }
        })
      : [];
    const sourceById = new Map(sources.map((s) => [s.id, s]));

    const items: PayoutItem[] = transactions.map((t) => {
      const source = t.referralUserId ? sourceById.get(t.referralUserId) : null;
      const name = source
        ? [source.firstName, source.lastName]
            .filter(Boolean)
            .join(' ')
            .trim() ||
          source.phone ||
          null
        : null;
      return {
        id: t.id,
        amount: Number(t.amount),
        description: t.description,
        createdAt: t.createdAt.toISOString(),
        level: t.referralLevel ?? null,
        referralUserId: t.referralUserId,
        referralUserName: name
      };
    });

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalAmount: Number(totalAgg._sum.amount ?? 0)
    });
  } catch (error) {
    logger.error('GET /api/projects/[id]/users/[userId]/payouts failed', {
      error: error instanceof Error ? error.message : String(error),
      projectId,
      userId,
      component: 'api-payouts'
    });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
