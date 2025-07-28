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
      db.$queryRaw`
        SELECT 
          DATE(t.created_at) as date,
          COUNT(CASE WHEN t.type = 'EARN' THEN 1 END) as earned_transactions,
          COUNT(CASE WHEN t.type = 'SPEND' THEN 1 END) as spent_transactions,
          SUM(CASE WHEN t.type = 'EARN' THEN t.amount ELSE 0 END) as earned_amount,
          SUM(CASE WHEN t.type = 'SPEND' THEN t.amount ELSE 0 END) as spent_amount
        FROM "transactions" t
        JOIN "users" u ON t.user_id = u.id
        WHERE u.project_id = ${id}
          AND t.created_at >= ${thirtyDaysAgo}
        GROUP BY DATE(t.created_at)
        ORDER BY DATE(t.created_at) ASC
      `,

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
      db.$queryRaw`
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          COUNT(t.id) as transaction_count,
          SUM(CASE WHEN t.type = 'EARN' THEN t.amount ELSE 0 END) as total_earned,
          SUM(CASE WHEN t.type = 'SPEND' THEN t.amount ELSE 0 END) as total_spent
        FROM "users" u
        LEFT JOIN "transactions" t ON u.id = t.user_id
        WHERE u.project_id = ${id}
          AND (t.created_at IS NULL OR t.created_at >= ${thirtyDaysAgo})
        GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone
        ORDER BY transaction_count DESC, total_earned DESC
        LIMIT 10
      `,

      // Статистика по уровням пользователей
      db.$queryRaw`
        SELECT 
          u.current_level as level,
          COUNT(u.id) as user_count,
          AVG(u.total_purchases) as avg_purchases
        FROM "users" u
        WHERE u.project_id = ${id}
        GROUP BY u.current_level
        ORDER BY COUNT(u.id) DESC
      `,

      // Активные уровни бонусов проекта
      db.$queryRaw`
        SELECT 
          bl.id,
          bl.name,
          bl.min_amount,
          bl.max_amount,
          bl.bonus_percent,
          bl.payment_percent,
          bl.order
        FROM "bonus_levels" bl
        WHERE bl.project_id = ${id} AND bl.is_active = true
        ORDER BY bl.order ASC
      `,

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
        dailyActivity: (dailyStats as any[]).map((day: any) => ({
          date: day.date,
          earnedTransactions: Number(day.earned_transactions) || 0,
          spentTransactions: Number(day.spent_transactions) || 0,
          earnedAmount: Number(day.earned_amount) || 0,
          spentAmount: Number(day.spent_amount) || 0
        })),

        // Статистика по типам транзакций
        transactionTypes: transactionsByType.map((type: any) => ({
          type: type.type,
          count: type._count,
          amount: type._sum.amount || 0
        }))
      },

      // Топ пользователей
      topUsers: (topUsers as any[]).map((user: any) => ({
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
