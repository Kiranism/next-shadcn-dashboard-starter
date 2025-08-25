/**
 * @file: src/app/api/projects/[id]/analytics/route.ts
 * @description: API для получения аналитических данных проекта
 * @project: SaaS Bonus System
 * @dependencies: Next.js API Routes, Prisma, ReferralService
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ReferralService } from '@/lib/services/referral.service';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Параллельные запросы для всей аналитики
    const [
      // Общие метрики
      totalUsers,
      activeUsers,
      totalBonuses,
      activeBonuses,
      totalTransactions,

      // Пользователи за последние 30 дней
      newUsersLast30Days,
      newUsersLast7Days,

      // Транзакции за последние 30 дней
      transactionsLast30Days,
      transactionsLast7Days,

      // Данные для графиков (последние 30 дней по дням)
      dailyStats,

      // Статистика по типам транзакций
      transactionsByType,

      // Истекающие бонусы
      expiringBonuses,

      // Топ активных пользователей
      topUsers,

      // Статистика по уровням пользователей
      usersByLevel,
      bonusLevels,

      // Реферальная статистика
      referralStats
    ] = await Promise.all([
      // Общие метрики
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

      // Новые пользователи
      db.user.count({
        where: {
          projectId: id,
          registeredAt: { gte: thirtyDaysAgo }
        }
      }),
      db.user.count({
        where: {
          projectId: id,
          registeredAt: { gte: sevenDaysAgo }
        }
      }),

      // Транзакции за период
      db.transaction.count({
        where: {
          user: { projectId: id },
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      db.transaction.count({
        where: {
          user: { projectId: id },
          createdAt: { gte: sevenDaysAgo }
        }
      }),

      // Ежедневная статистика (последние 30 дней)
      db.transaction.findMany({
        where: {
          user: { projectId: id },
          createdAt: { gte: thirtyDaysAgo }
        },
        select: {
          createdAt: true,
          type: true,
          amount: true
        }
      }).then(transactions => {
        const dailyStats = new Map<string, any>();
        transactions.forEach(t => {
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
          const stat = dailyStats.get(date);
          if (t.type === 'EARN') {
            stat.earned_transactions++;
            stat.earned_amount = Number(stat.earned_amount) + Number(t.amount);
          } else if (t.type === 'SPEND') {
            stat.spent_transactions++;
            stat.spent_amount = Number(stat.spent_amount) + Number(t.amount);
          }
        });
        return Array.from(dailyStats.values()).sort((a, b) => a.date.localeCompare(b.date));
      }),

      // Статистика по типам транзакций
      db.transaction.groupBy({
        by: ['type'],
        where: {
          user: { projectId: id },
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: true,
        _sum: { amount: true }
      }),

      // Истекающие бонусы (в ближайшие 7 дней)
      db.bonus.aggregate({
        where: {
          user: { projectId: id },
          isUsed: false,
          expiresAt: {
            gte: now,
            lte: sevenDaysAgo
          }
        },
        _sum: { amount: true },
        _count: true
      }),

      // Топ активных пользователей
      db.user.findMany({
        where: { projectId: id },
        include: {
          transactions: {
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { type: true, amount: true }
          }
        },
        take: 10
      }).then(users => {
        return users.map(u => ({
          id: u.id,
          first_name: u.firstName,
          last_name: u.lastName,
          email: u.email,
          phone: u.phone,
          transaction_count: u.transactions.length,
          total_earned: u.transactions
            .filter(t => t.type === 'EARN')
            .reduce((sum, t) => sum + Number(t.amount), 0),
          total_spent: u.transactions
            .filter(t => t.type === 'SPEND')
            .reduce((sum, t) => sum + Number(t.amount), 0)
        })).sort((a, b) => b.transaction_count - a.transaction_count);
      }),

      // Статистика по уровням пользователей
      db.user.groupBy({
        by: ['currentLevel'],
        where: { projectId: id },
        _count: { id: true },
        _avg: { totalPurchases: true }
      }).then(levels => 
        levels.map(l => ({
          level: l.currentLevel,
          user_count: l._count.id,
          avg_purchases: l._avg.totalPurchases
        })).sort((a, b) => b.user_count - a.user_count)
      ),

      // Активные уровни бонусов проекта
      db.bonusLevel.findMany({
        where: { 
          projectId: id,
          isActive: true
        },
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

      // Реферальная статистика через ReferralService
      ReferralService.getReferralStats(id)
    ]);

    // Обрабатываем данные для ответа
    const analytics = {
      // Основные метрики
      overview: {
        totalUsers,
        activeUsers,
        totalBonuses: totalBonuses._sum.amount || 0,
        activeBonuses: activeBonuses._sum.amount || 0,
        totalTransactions,

        // Динамика за периоды
        newUsersLast30Days,
        newUsersLast7Days,
        transactionsLast30Days,
        transactionsLast7Days,

        // Истекающие бонусы
        expiringBonuses: {
          amount: expiringBonuses._sum.amount || 0,
          count: expiringBonuses._count || 0
        }
      },

      // Данные для графиков
      charts: {
        // Ежедневная активность
        dailyActivity: dailyStats.map((day) => ({
          date: day.date,
          earnedTransactions: Number(day.earned_transactions) || 0,
          spentTransactions: Number(day.spent_transactions) || 0,
          earnedAmount: Number(day.earned_amount) || 0,
          spentAmount: Number(day.spent_amount) || 0
        })),

        // Статистика по типам транзакций
        transactionTypes: transactionsByType.map((type) => ({
          type: type.type,
          count: type._count,
          amount: type._sum.amount || 0
        }))
      },

      // Топ пользователей
      topUsers: topUsers.map((user) => ({
        id: user.id,
        name:
          [user.first_name, user.last_name].filter(Boolean).join(' ') ||
          'Без имени',
        contact: user.email || user.phone || 'Не указан',
        transactionCount: Number(user.transaction_count) || 0,
        totalEarned: Number(user.total_earned) || 0,
        totalSpent: Number(user.total_spent) || 0
      })),

      // Метрики по уровням пользователей
      userLevels: (usersByLevel as any[]).map((level: any) => ({
        level: level.level,
        userCount: Number(level.user_count) || 0,
        avgPurchases: Number(level.avg_purchases) || 0
      })),

      // Конфигурация уровней бонусов
      bonusLevels: (bonusLevels as any[]).map((level: any) => ({
        id: level.id,
        name: level.name,
        minAmount: Number(level.min_amount) || 0,
        maxAmount: level.max_amount ? Number(level.max_amount) : null,
        bonusPercent: Number(level.bonus_percent) || 0,
        paymentPercent: Number(level.payment_percent) || 0,
        order: Number(level.order) || 0
      })),

      // Реферальная статистика
      referralStats: referralStats
    };

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
