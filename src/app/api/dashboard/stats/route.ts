/**
 * @file: route.ts
 * @description: API для статистики главной страницы дашборда
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, Prisma, BotManager
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { botManager } from '@/lib/telegram/bot-manager';
import { logger } from '@/lib/logger';

// GET /api/dashboard/stats - Получение статистики системы
export async function GET() {
  try {
    // Получаем общую статистику
    const [totalProjects, totalUsers, totalBonuses, recentProjects] =
      await Promise.all([
        // Общее количество проектов
        db.project.count(),

        // Общее количество пользователей
        db.user.count(),

        // Общая сумма начисленных бонусов
        db.bonus.aggregate({
          _sum: {
            amount: true
          }
        }),

        // Последние проекты с информацией
        db.project.findMany({
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            _count: {
              select: {
                users: true
              }
            },
            botSettings: {
              select: {
                isActive: true
              }
            }
          }
        })
      ]);

    // Подсчитываем активных ботов
    let activeBots = 0;
    const allBots = botManager.getAllBots();
    for (const [projectId, botInstance] of allBots) {
      if (botInstance.isActive) {
        activeBots++;
      }
    }

    // Форматируем данные для ответа
    const stats = {
      totalProjects,
      totalUsers,
      activeBots,
      totalBonuses: Number(totalBonuses._sum.amount || 0),
      recentProjects: recentProjects.map(
        (project: {
          id: string;
          name: string;
          createdAt: Date;
          _count: { users: number };
          botSettings: { isActive: boolean } | null;
        }) => ({
          id: project.id,
          name: project.name,
          userCount: project._count.users,
          botStatus: project.botSettings?.isActive ? 'ACTIVE' : 'INACTIVE',
          createdAt: project.createdAt.toISOString()
        })
      )
    };

    logger.info(
      'Статистика дашборда загружена',
      {
        totalProjects,
        totalUsers,
        activeBots,
        totalBonuses: stats.totalBonuses,
        recentProjectsCount: stats.recentProjects.length
      },
      'dashboard-stats-api'
    );

    return NextResponse.json(stats);
  } catch (error) {
    logger.error(
      'Ошибка загрузки статистики дашборда',
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'dashboard-stats-api'
    );

    return NextResponse.json(
      {
        error: 'Ошибка загрузки статистики',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
