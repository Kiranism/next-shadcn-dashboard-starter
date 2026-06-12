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
import { requireProjectAccess } from '@/lib/with-project-access';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    const { searchParams } = new URL(request.url);

    // Получаем параметры фильтрации
    const periodParam = searchParams.get('period') || 'month';
    const userId = searchParams.get('userId');

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, operationMode: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем режим работы проекта
    if (project.operationMode === 'WITHOUT_BOT') {
      return NextResponse.json(
        {
          error:
            'Статистика реферальной программы недоступна в режиме "Без Telegram бота"',
          code: 'REFERRAL_DISABLED_WITHOUT_BOT'
        },
        { status: 403 }
      );
    }

    // Определяем период в днях
    let periodDays: number;
    switch (periodParam) {
      case 'week':
        periodDays = 7;
        break;
      case 'month':
        periodDays = 30;
        break;
      case 'all':
        periodDays = 36500; // ~100 лет
        break;
      default:
        periodDays = parseInt(periodParam) || 30;
    }

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - periodDays);

    if (userId) {
      // Статистика конкретного пользователя
      const user = await db.user.findFirst({
        where: { id: userId, projectId }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Пользователь не найден' },
          { status: 404 }
        );
      }

      const stats = await ReferralService.getReferralStats(userId);
      return NextResponse.json(stats);
    }

    // Общая статистика проекта

    // Общее количество рефералов
    const totalReferrals = await db.user.count({
      where: {
        projectId,
        referredBy: { not: null }
      }
    });

    // Рефералы за период
    const periodReferrals = await db.user.count({
      where: {
        projectId,
        referredBy: { not: null },
        registeredAt: { gte: dateFrom }
      }
    });

    // Активные рефереры (у которых есть хотя бы 1 реферал)
    const activeReferrers = await db.user.count({
      where: {
        projectId,
        referrals: { some: {} }
      }
    });

    // Общий объем выплаченных реферальных бонусов
    const totalReferralBonuses = await db.transaction.aggregate({
      where: {
        user: { projectId },
        isReferralBonus: true,
        type: 'EARN'
      },
      _sum: { amount: true }
    });

    // Реферальные бонусы за период
    const periodReferralBonuses = await db.transaction.aggregate({
      where: {
        user: { projectId },
        isReferralBonus: true,
        type: 'EARN',
        createdAt: { gte: dateFrom }
      },
      _sum: { amount: true }
    });

    // Средний чек от рефералов (транзакции SPEND от пользователей с referredBy)
    const referralOrders = await db.transaction.aggregate({
      where: {
        user: {
          projectId,
          referredBy: { not: null }
        },
        type: 'SPEND'
      },
      _avg: { amount: true },
      _count: true
    });

    // Топ рефереров с суммой бонусов
    const topReferrersRaw = await db.user.findMany({
      where: {
        projectId,
        referrals: { some: {} }
      },
      include: {
        _count: {
          select: { referrals: true }
        },
        transactions: {
          where: {
            isReferralBonus: true,
            type: 'EARN'
          },
          select: { amount: true }
        }
      },
      orderBy: {
        referrals: { _count: 'desc' }
      },
      take: 10
    });

    const topReferrers = topReferrersRaw.map((user) => ({
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      referralCount: user._count.referrals,
      totalBonus: user.transactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      )
    }));

    // UTM источники
    const utmSourcesRaw = await db.user.groupBy({
      by: ['utmSource', 'utmMedium', 'utmCampaign'],
      where: {
        projectId,
        referredBy: { not: null },
        OR: [
          { utmSource: { not: null } },
          { utmMedium: { not: null } },
          { utmCampaign: { not: null } }
        ]
      },
      _count: true
    });

    const utmSources = utmSourcesRaw
      .map((source) => ({
        utm_source: source.utmSource,
        utm_medium: source.utmMedium,
        utm_campaign: source.utmCampaign,
        count: source._count
      }))
      .sort((a, b) => b.count - a.count);

    // Распределение по уровням реферальной программы
    const levelBreakdownRaw = await db.transaction.groupBy({
      by: ['referralLevel'],
      where: {
        user: { projectId },
        isReferralBonus: true,
        type: 'EARN',
        referralLevel: { not: null }
      },
      _sum: { amount: true },
      _count: true
    });

    const levelBreakdown = levelBreakdownRaw
      .filter((l) => l.referralLevel !== null)
      .map((l) => ({
        level: l.referralLevel as number,
        payouts: l._count,
        totalBonus: Number(l._sum.amount || 0)
      }))
      .sort((a, b) => a.level - b.level);

    const stats = {
      totalReferrals,
      periodReferrals,
      totalBonusPaid: Number(totalReferralBonuses._sum?.amount || 0),
      periodBonusPaid: Number(periodReferralBonuses._sum?.amount || 0),
      activeReferrers,
      averageOrderValue: Math.abs(Number(referralOrders._avg?.amount || 0)),
      topReferrers,
      utmSources,
      levelBreakdown
    };

    logger.info('Referral stats retrieved', {
      projectId,
      period: periodParam
    });

    return NextResponse.json(stats);
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
