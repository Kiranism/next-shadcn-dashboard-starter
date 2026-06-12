import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ReferralService } from '@/lib/services/referral.service';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { logger } from '@/lib/logger';
import { CacheService } from '@/lib/redis';
import { requireProjectAccess } from '@/lib/with-project-access';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    const analytics = await CacheService.getOrSet(
      `analytics:${id}:v2`, // Incremented cache version
      async () => {
        const now = new Date();
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
          totalUsers,
          activeUsers,
          totalBonuses,
          activeBonuses,
          totalTransactions,
          newUsersLast30Days,
          newUsersLast7Days,
          transactionsLast30Days,
          transactionsLast7Days,
          dailyStats,
          transactionsByType,
          expiringBonuses,
          topUsers,
          usersByLevel,
          bonusLevels,
          referralStats,
          cohortAnalysis,
          financialMetrics,
          advancedReferralStats
        ] = await Promise.all([
          db.user.count({ where: { projectId: id } }),
          db.user.count({ where: { projectId: id, isActive: true } }),
          db.bonus.aggregate({
            where: { user: { projectId: id } },
            _sum: { amount: true }
          }),
          db.bonus.aggregate({
            where: {
              user: { projectId: id },
              isUsed: false,
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
            },
            _sum: { amount: true }
          }),
          db.transaction.count({ where: { user: { projectId: id } } }),
          db.user.count({
            where: { projectId: id, registeredAt: { gte: thirtyDaysAgo } }
          }),
          db.user.count({
            where: { projectId: id, registeredAt: { gte: sevenDaysAgo } }
          }),
          db.transaction.count({
            where: {
              user: { projectId: id },
              createdAt: { gte: thirtyDaysAgo }
            }
          }),
          db.transaction.count({
            where: { user: { projectId: id }, createdAt: { gte: sevenDaysAgo } }
          }),
          db.transaction
            .findMany({
              where: {
                user: { projectId: id },
                createdAt: { gte: thirtyDaysAgo }
              },
              select: { createdAt: true, type: true, amount: true }
            })
            .then(
              (
                transactions: Array<{
                  createdAt: Date;
                  type: string;
                  amount: any;
                }>
              ) => {
                const dailyStats = new Map<string, any>();
                transactions.forEach((t) => {
                  const date = t.createdAt.toISOString().split('T')[0];
                  if (!dailyStats.has(date)) {
                    dailyStats.set(date, {
                      date,
                      earned_transactions: 0,
                      spent_transactions: 0,
                      earned_amount: 0,
                      spent_amount: 0
                    });
                  }
                  const stat: any = dailyStats.get(date);
                  if (t.type === 'EARN') {
                    stat.earned_transactions++;
                    stat.earned_amount =
                      Number(stat.earned_amount) + Number(t.amount);
                  } else if (t.type === 'SPEND') {
                    stat.spent_transactions++;
                    stat.spent_amount =
                      Number(stat.spent_amount) + Number(t.amount);
                  }
                });
                return Array.from(dailyStats.values()).sort((a: any, b: any) =>
                  a.date.localeCompare(b.date)
                );
              }
            ),
          db.transaction.groupBy({
            by: ['type'],
            where: {
              user: { projectId: id },
              createdAt: { gte: thirtyDaysAgo }
            },
            _count: true,
            _sum: { amount: true }
          }),
          db.bonus.aggregate({
            where: {
              user: { projectId: id },
              isUsed: false,
              expiresAt: { gte: now, lte: sevenDaysAgo }
            },
            _sum: { amount: true },
            _count: true
          }),
          db.user
            .findMany({
              where: {
                projectId: id,
                // Фильтруем только пользователей с транзакциями за последние 30 дней
                transactions: {
                  some: {
                    createdAt: { gte: thirtyDaysAgo }
                  }
                }
              },
              include: {
                transactions: {
                  where: { createdAt: { gte: thirtyDaysAgo } },
                  select: { type: true, amount: true }
                }
              }
            })
            .then(
              (
                users: Array<{
                  id: string;
                  firstName: string | null;
                  lastName: string | null;
                  email: string | null;
                  phone: string | null;
                  transactions: Array<{ type: string; amount: any }>;
                }>
              ) =>
                users
                  .map((u) => {
                    const totalEarned = u.transactions
                      .filter((t) => t.type === 'EARN')
                      .reduce((sum, t) => sum + Number(t.amount), 0);
                    const totalSpent = u.transactions
                      .filter((t) => t.type === 'SPEND')
                      .reduce((sum, t) => sum + Number(t.amount), 0);

                    return {
                      id: u.id,
                      first_name: u.firstName,
                      last_name: u.lastName,
                      email: u.email,
                      phone: u.phone,
                      transaction_count: u.transactions.length,
                      total_earned: totalEarned,
                      total_spent: totalSpent,
                      // Добавляем общую активность для сортировки
                      activity_score: u.transactions.length * 100 + totalEarned
                    };
                  })
                  .sort((a: any, b: any) => {
                    // Сортируем по общему счету активности (количество транзакций + сумма начисленных)
                    // Если счет равен, сортируем по количеству транзакций
                    if (b.activity_score !== a.activity_score) {
                      return b.activity_score - a.activity_score;
                    }
                    return b.transaction_count - a.transaction_count;
                  })
                  .slice(0, 10) // Берем только топ-10 после сортировки
            ),
          db.user
            .groupBy({
              by: ['currentLevel'],
              where: { projectId: id },
              _count: { id: true },
              _avg: { totalPurchases: true }
            })
            .then(
              (
                levels: Array<{
                  currentLevel: string | null;
                  _count: { id: number };
                  _avg: { totalPurchases: any };
                }>
              ) =>
                levels
                  .map((l) => ({
                    level: l.currentLevel,
                    user_count: l._count.id,
                    avg_purchases: l._avg.totalPurchases
                  }))
                  .sort((a: any, b: any) => b.user_count - a.user_count)
            ),
          db.bonusLevel.findMany({
            where: { projectId: id, isActive: true },
            select: {
              id: true,
              name: true,
              minAmount: true,
              maxAmount: true,
              bonusPercent: true,
              paymentPercent: true,
              order: true
            },
            orderBy: { order: 'asc' }
          }),
          ReferralService.getReferralStats(id),
          // New Analytics Calls
          AnalyticsService.getCohortAnalysis(id),
          AnalyticsService.getFinancialMetrics(id),
          AnalyticsService.getReferralAnalytics(id)
        ]);

        return {
          overview: {
            totalUsers,
            activeUsers,
            totalBonuses: totalBonuses._sum.amount || 0,
            activeBonuses: activeBonuses._sum.amount || 0,
            totalTransactions,
            newUsersLast30Days,
            newUsersLast7Days,
            transactionsLast30Days,
            transactionsLast7Days,
            expiringBonuses: {
              amount: expiringBonuses._sum.amount || 0,
              count: expiringBonuses._count || 0
            }
          },
          charts: {
            dailyActivity: dailyStats.map((day: any) => ({
              date: day.date,
              earnedTransactions: Number(day.earned_transactions) || 0,
              spentTransactions: Number(day.spent_transactions) || 0,
              earnedAmount: Number(day.earned_amount) || 0,
              spentAmount: Number(day.spent_amount) || 0
            })),
            transactionTypes: transactionsByType.map((type: any) => ({
              type: type.type,
              count: type._count,
              amount: type._sum.amount || 0
            }))
          },
          topUsers: topUsers.map((user: any) => ({
            id: user.id,
            name:
              [user.first_name, user.last_name].filter(Boolean).join(' ') ||
              'Без имени',
            contact: user.email || user.phone || 'Не указан',
            transactionCount: Number(user.transaction_count) || 0,
            totalEarned: Number(user.total_earned) || 0,
            totalSpent: Number(user.total_spent) || 0
          })),
          userLevels: (usersByLevel as any[]).map((level: any) => ({
            level: level.level,
            userCount: Number(level.user_count) || 0,
            avgPurchases: Number(level.avg_purchases) || 0
          })),
          bonusLevels: (bonusLevels as any[]).map((level: any) => ({
            id: level.id,
            name: level.name,
            minAmount: Number(level.min_amount) || 0,
            maxAmount: level.max_amount ? Number(level.max_amount) : null,
            bonusPercent: Number(level.bonus_percent) || 0,
            paymentPercent: Number(level.payment_percent) || 0,
            order: Number(level.order) || 0
          })),
          referralStats,
          // New Data
          cohorts: cohortAnalysis.cohorts,
          financial: financialMetrics,
          advancedReferralStats
        };
      },
      60
    );

    return NextResponse.json(analytics);
  } catch (error) {
    logger.error('Ошибка получения аналитики проекта', {
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      component: 'analytics-api'
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
