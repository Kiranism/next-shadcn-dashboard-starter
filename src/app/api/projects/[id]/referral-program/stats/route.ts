/**
 * @file: stats/route.ts
 * @description: API endpoint для получения статистики реферальной программы
 * @project: SaaS Bonus System
 * @dependencies: ReferralService, Prisma
 * @created: 2024-12-10
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ReferralService } from '@/lib/services/referral.service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const { searchParams } = new URL(request.url);

    // Получаем параметры фильтрации
    const period = searchParams.get('period') || '30'; // дней
    const userId = searchParams.get('userId'); // статистика конкретного пользователя

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    let stats;

    if (userId) {
      // Статистика конкретного пользователя
      const user = await db.user.findFirst({
        where: {
          id: userId,
          projectId: projectId
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Пользователь не найден' },
          { status: 404 }
        );
      }

      stats = await ReferralService.getReferralStats(userId);
    } else {
      // Общая статистика проекта
      const periodDays = parseInt(period);
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - periodDays);

      // Общее количество рефералов
      const totalReferrals = await db.user.count({
        where: {
          projectId: projectId,
          referredBy: { not: null }
        }
      });

      // Рефералы за период
      const periodReferrals = await db.user.count({
        where: {
          projectId: projectId,
          referredBy: { not: null },
          registeredAt: { gte: dateFrom }
        }
      });

      // Топ рефереров
      const topReferrers = await db.user.findMany({
        where: {
          projectId: projectId,
          referrals: { some: {} }
        },
        include: {
          _count: {
            select: { referrals: true }
          }
        },
        orderBy: {
          referrals: { _count: 'desc' }
        },
        take: 10
      });

      // Общий объем выплаченных реферальных бонусов
      const totalReferralBonuses = await db.transaction.aggregate({
        where: {
          user: { projectId: projectId },
          isReferralBonus: true,
          type: 'EARN'
        },
        _sum: { amount: true }
      });

      // Реферальные бонусы за период
      const periodReferralBonuses = await db.transaction.aggregate({
        where: {
          user: { projectId: projectId },
          isReferralBonus: true,
          type: 'EARN',
          createdAt: { gte: dateFrom }
        },
        _sum: { amount: true }
      });

      // UTM источники
      const utmSources = await db.user.groupBy({
        by: ['utmSource'],
        where: {
          projectId: projectId,
          utmSource: { not: null },
          referredBy: { not: null }
        },
        _count: true
      });

      stats = {
        overview: {
          totalReferrals,
          periodReferrals,
          totalBonusPaid: Number(totalReferralBonuses._sum?.amount || 0),
          periodBonusPaid: Number(periodReferralBonuses._sum?.amount || 0)
        },
        topReferrers: topReferrers.map((user) => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          referralsCount: user._count.referrals,
          referralCode: user.referralCode
        })),
        utmSources: utmSources
          .map((source) => ({
            source: source.utmSource,
            count: source._count
          }))
          .sort((a, b) => b.count - a.count),
        period: periodDays
      };
    }

    logger.info('Referral stats retrieved', {
      projectId,
      userId: userId || 'all',
      period: userId ? 'user-specific' : `${period} days`
    });

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    const { id: projectId } = await context.params;
    logger.error('Error retrieving referral stats', {
      projectId,
      error: error.message
    });

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
