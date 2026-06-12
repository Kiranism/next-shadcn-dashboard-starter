/**
 * @file: route.ts
 * @description: API для получения рефералов пользователя с иерархической структурой
 * @project: SaaS Bonus System
 * @dependencies: Next.js, Prisma
 * @created: 2025-12-05
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireProjectAccess } from '@/lib/with-project-access';

/**
 * Интерфейс реферала для ответа API
 */
interface ReferralUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  registeredAt: string;
  bonusBalance: number;
  totalEarned: number;
  referralCount: number;
  level: number;
}

/**
 * Статистика по рефералам
 */
interface ReferralStats {
  totalReferrals: number;
  totalBonusesEarned: number;
  referralsByLevel: { level: number; count: number }[];
}

/**
 * GET - Получить рефералов пользователя
 * Query params:
 *   - level: уровень рефералов (1 = прямые, по умолчанию 1)
 *   - parentId: ID родительского реферала для подуровней
 *   - page: страница (по умолчанию 1)
 *   - limit: количество на странице (по умолчанию 20, макс 100)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  const { id: projectId, userId } = await context.params;

  const access = await requireProjectAccess(context.params);
  if (access instanceof NextResponse) return access;

  try {
    // Проверяем существование пользователя
    const user = await db.user.findFirst({
      where: { id: userId, projectId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Парсим query параметры
    const searchParams = request.nextUrl.searchParams;
    const level = Math.max(1, parseInt(searchParams.get('level') || '1', 10));
    const parentId = searchParams.get('parentId') || userId;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') || '20', 10))
    );
    const skip = (page - 1) * limit;

    // Получаем рефералов для указанного parentId
    const [referralsData, totalCount] = await Promise.all([
      db.user.findMany({
        where: {
          projectId,
          referredBy: parentId
        },
        include: {
          bonuses: {
            where: {
              isUsed: false,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
            },
            select: { amount: true }
          },
          transactions: {
            where: { type: 'EARN' },
            select: { amount: true }
          },
          _count: {
            select: { referrals: true }
          }
        },
        orderBy: { registeredAt: 'desc' },
        skip,
        take: limit
      }),
      db.user.count({
        where: {
          projectId,
          referredBy: parentId
        }
      })
    ]);

    // Форматируем рефералов
    const referrals: ReferralUser[] = referralsData.map((ref) => ({
      id: ref.id,
      firstName: ref.firstName,
      lastName: ref.lastName,
      email: ref.email,
      phone: ref.phone,
      registeredAt: ref.registeredAt.toISOString(),
      bonusBalance: ref.bonuses.reduce((sum, b) => sum + Number(b.amount), 0),
      totalEarned: ref.transactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      ),
      referralCount: ref._count.referrals,
      level
    }));

    // Вычисляем статистику только для корневого запроса (level=1, parentId=userId)
    let stats: ReferralStats | null = null;
    if (parentId === userId && level === 1) {
      stats = await calculateReferralStats(projectId, userId);
    }

    const hasMore = skip + referrals.length < totalCount;

    return NextResponse.json({
      referrals,
      stats,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore
      }
    });
  } catch (error) {
    logger.error('Ошибка получения рефералов', {
      projectId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

/**
 * Вычисляет статистику по рефералам пользователя
 * Рекурсивно подсчитывает рефералов по уровням (до 5 уровней)
 */
async function calculateReferralStats(
  projectId: string,
  userId: string,
  maxLevel: number = 5
): Promise<ReferralStats> {
  const referralsByLevel: { level: number; count: number }[] = [];
  let totalReferrals = 0;
  let totalBonusesEarned = 0;

  // Получаем бонусы, заработанные от рефералов
  const referralBonuses = await db.transaction.findMany({
    where: {
      userId,
      isReferralBonus: true,
      type: 'EARN'
    },
    select: { amount: true }
  });

  totalBonusesEarned = referralBonuses.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  // Рекурсивно подсчитываем рефералов по уровням
  let currentLevelIds = [userId];

  for (let level = 1; level <= maxLevel; level++) {
    if (currentLevelIds.length === 0) break;

    const levelReferrals = await db.user.findMany({
      where: {
        projectId,
        referredBy: { in: currentLevelIds }
      },
      select: { id: true }
    });

    const count = levelReferrals.length;
    if (count > 0) {
      referralsByLevel.push({ level, count });
      totalReferrals += count;
      currentLevelIds = levelReferrals.map((r) => r.id);
    } else {
      break;
    }
  }

  return {
    totalReferrals,
    totalBonusesEarned,
    referralsByLevel
  };
}
