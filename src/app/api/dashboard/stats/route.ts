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
import { getCurrentAdmin } from '@/lib/auth';

// GET /api/dashboard/stats - Получение статистики системы
export async function GET() {
  try {
    // Получаем текущего администратора
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Фильтр по владельцу для всех запросов
    const ownerFilter = { ownerId: admin.sub };

    // Получаем общую статистику
    const [totalProjects, totalUsers, totalBonuses, recentProjects] =
      await Promise.all([
        // Количество проектов владельца
        db.project.count({
          where: ownerFilter
        }),

        // Количество пользователей в проектах владельца
        db.user.count({
          where: {
            project: ownerFilter
          }
        }),

        // Сумма начисленных бонусов для пользователей проектов владельца
        db.bonus.aggregate({
          _sum: {
            amount: true
          },
          where: {
            user: {
              project: ownerFilter
            }
          }
        }),

        // Последние проекты владельца с информацией
        db.project.findMany({
          where: ownerFilter,
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            name: true,
            domain: true,
            webhookSecret: true,
            bonusPercentage: true,
            bonusExpiryDays: true,
            // bonusBehavior: true,
            isActive: true,
            operationMode: true,
            createdAt: true,
            updatedAt: true,
            botStatus: true,
            botToken: true,
            botUsername: true,
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

    // Подсчитываем активных ботов из менеджера только для проектов владельца
    let activeBotsFromManager = 0;
    const allBots = botManager.getAllBots();
    const ownerProjects = await db.project.findMany({
      where: ownerFilter,
      select: { id: true }
    });
    const ownerProjectIds = new Set(ownerProjects.map((p) => p.id));

    for (const [projectId, botInstance] of allBots) {
      if (ownerProjectIds.has(projectId) && botInstance.isActive) {
        activeBotsFromManager++;
      }
    }

    // Подсчитываем активных ботов из БД только для проектов владельца
    // Боты считаются активными если:
    // 1. botStatus === 'ACTIVE' ИЛИ
    // 2. есть botToken И botSettings.isActive === true
    const activeBotsFromDb = await db.project.count({
      where: {
        ...ownerFilter,
        OR: [
          { botStatus: 'ACTIVE' },
          {
            AND: [
              { botToken: { not: null } },
              { botSettings: { isActive: true } }
            ]
          }
        ]
      }
    });

    // Используем максимальное значение (либо из менеджера, либо из БД)
    const activeBots = Math.max(activeBotsFromManager, activeBotsFromDb);

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
          operationMode: string;
          isActive: boolean;
        }) => ({
          id: project.id,
          name: project.name,
          userCount: project._count.users,
          botStatus:
            project.operationMode === 'WITHOUT_BOT'
              ? project.isActive
                ? 'ACTIVE'
                : 'INACTIVE'
              : project.botSettings?.isActive
                ? 'ACTIVE'
                : 'INACTIVE',
          createdAt: project.createdAt.toISOString()
        })
      )
    };

    logger.info(
      'Статистика дашборда загружена',
      {
        adminId: admin.sub,
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
