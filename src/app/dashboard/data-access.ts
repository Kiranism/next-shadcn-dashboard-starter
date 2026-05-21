import { db } from '@/lib/db';
import { botManager } from '@/lib/telegram/bot-manager';
import { logger } from '@/lib/logger';
import { getCurrentAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

export interface RecentProject {
  id: string;
  name: string;
  userCount: number;
  botStatus: string;
  createdAt: string;
}

export interface UserGrowthPoint {
  name: string;
  total: number;
}

/** @deprecated use UserGrowthPoint */
export type MonthlyUserGrowth = UserGrowthPoint;

export interface SystemStats {
  totalProjects: number;
  totalUsers: number;
  activeUsers: number;
  activeBots: number;
  totalBonuses: number;
  recentProjects: RecentProject[];
  userGrowth: UserGrowthPoint[];
  userGrowthByDays: UserGrowthPoint[];
  userGrowthByWeeks: UserGrowthPoint[];
}

export async function getDashboardStats(): Promise<SystemStats> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect('/auth/login');
  }

  // Фильтр по владельцу для всех запросов
  const ownerFilter = { ownerId: admin.sub };

  try {
    // Получаем общую статистику
    const [
      totalProjects,
      totalUsers,
      activeUsers,
      totalBonuses,
      recentProjects
    ] = await Promise.all([
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

      // Количество активированных пользователей (с telegramId)
      db.user.count({
        where: {
          project: ownerFilter,
          telegramId: {
            not: null
          }
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
          createdAt: true,
          botToken: true,
          isActive: true,
          operationMode: true,
          botSettings: {
            select: {
              isActive: true
            }
          },
          botStatus: true,
          _count: {
            select: {
              users: true
            }
          }
        }
      })
    ]);

    // Подсчитываем активных ботов (логика упрощена для RSC, но должна совпадать с API)
    // 1. Из менеджера:
    let activeBotsFromManager = 0;
    // Note: botManager is a singleton in memory, might not work if scaling, but fine for single instance
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

    // 2. Из БД:
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

    // 3. Из Workflows:
    const activeWorkflowsCount = await db.workflow.count({
      where: {
        project: ownerFilter,
        isActive: true
      }
    });

    const activeBots = Math.max(
      activeBotsFromManager,
      activeBotsFromDb,
      activeWorkflowsCount
    );

    // Получаем статистику роста пользователей за все периоды
    const [userGrowth, userGrowthByDays, userGrowthByWeeks] = await Promise.all(
      [
        getUserGrowthStats(admin.sub),
        getUserGrowthByDays(admin.sub),
        getUserGrowthByWeeks(admin.sub)
      ]
    );

    return {
      totalProjects,
      totalUsers,
      activeUsers,
      activeBots,
      totalBonuses: Number(totalBonuses._sum.amount || 0),
      recentProjects: recentProjects.map((project) => ({
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
      })),
      userGrowth,
      userGrowthByDays,
      userGrowthByWeeks
    };
  } catch (error) {
    logger.error(
      'Error fetching dashboard stats',
      { error },
      'dashboard-service'
    );
    // Return empty stats on error rather than crashing the whole page
    return {
      totalProjects: 0,
      totalUsers: 0,
      activeUsers: 0,
      activeBots: 0,
      totalBonuses: 0,
      recentProjects: [],
      userGrowth: [],
      userGrowthByDays: [],
      userGrowthByWeeks: []
    };
  }
}

/**
 * Получить статистику роста пользователей по месяцам
 */
async function getUserGrowthStats(
  ownerId: string
): Promise<MonthlyUserGrowth[]> {
  try {
    // Получаем дату 6 месяцев назад
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Получаем всех пользователей за последние 6 месяцев
    const users = await db.user.findMany({
      where: {
        project: {
          ownerId
        },
        registeredAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        registeredAt: true
      },
      orderBy: {
        registeredAt: 'asc'
      }
    });

    // Группируем по месяцам
    const monthNames = [
      'Янв',
      'Фев',
      'Мар',
      'Апр',
      'Май',
      'Июн',
      'Июл',
      'Авг',
      'Сен',
      'Окт',
      'Ноя',
      'Дек'
    ];
    const monthlyData = new Map<string, number>();

    // Инициализируем последние 6 месяцев нулями
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.set(key, 0);
    }

    // Подсчитываем кумулятивное количество пользователей
    let cumulativeCount = 0;
    const sortedKeys = Array.from(monthlyData.keys()).sort();

    for (const user of users) {
      const userDate = new Date(user.registeredAt);
      const key = `${userDate.getFullYear()}-${String(userDate.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyData.has(key)) {
        cumulativeCount++;
        monthlyData.set(key, cumulativeCount);
      }
    }

    // Обновляем кумулятивные значения для всех месяцев
    let lastCount = 0;
    for (const key of sortedKeys) {
      const count = monthlyData.get(key) || lastCount;
      monthlyData.set(key, count);
      lastCount = count;
    }

    // Преобразуем в формат для графика
    return sortedKeys.map((key) => {
      const [year, month] = key.split('-');
      const monthIndex = parseInt(month) - 1;
      return {
        name: monthNames[monthIndex],
        total: monthlyData.get(key) || 0
      };
    });
  } catch (error) {
    logger.error(
      'Error fetching user growth stats',
      { error },
      'dashboard-service'
    );
    return [];
  }
}

/**
 * Получить статистику роста пользователей по дням (последние 30 дней)
 */
async function getUserGrowthByDays(
  ownerId: string
): Promise<UserGrowthPoint[]> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const users = await db.user.findMany({
      where: {
        project: { ownerId },
        registeredAt: { gte: thirtyDaysAgo }
      },
      select: { registeredAt: true },
      orderBy: { registeredAt: 'asc' }
    });

    // Инициализируем последние 30 дней нулями
    const dailyData = new Map<string, number>();
    const now = new Date();
    const dayKeys: string[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      dailyData.set(key, 0);
      dayKeys.push(key);
    }

    // Подсчитываем количество регистраций за каждый день
    for (const user of users) {
      const d = new Date(user.registeredAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dailyData.has(key)) {
        dailyData.set(key, (dailyData.get(key) || 0) + 1);
      }
    }

    return dayKeys.map((key) => {
      const parts = key.split('-');
      const day = parseInt(parts[2]);
      const month = parseInt(parts[1]);
      return {
        name: `${day}/${month}`,
        total: dailyData.get(key) || 0
      };
    });
  } catch (error) {
    logger.error(
      'Error fetching daily user growth stats',
      { error },
      'dashboard-service'
    );
    return [];
  }
}

/**
 * Получить статистику роста пользователей по неделям (последние 12 недель)
 */
async function getUserGrowthByWeeks(
  ownerId: string
): Promise<UserGrowthPoint[]> {
  try {
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);
    twelveWeeksAgo.setHours(0, 0, 0, 0);

    const users = await db.user.findMany({
      where: {
        project: { ownerId },
        registeredAt: { gte: twelveWeeksAgo }
      },
      select: { registeredAt: true },
      orderBy: { registeredAt: 'asc' }
    });

    // Строим 12 недельных бакетов, заканчивая текущей неделей
    const now = new Date();
    const weekBuckets: {
      start: Date;
      end: Date;
      label: string;
      count: number;
    }[] = [];

    for (let i = 11; i >= 0; i--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      weekEnd.setHours(23, 59, 59, 999);

      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      weekBuckets.push({
        start: weekStart,
        end: weekEnd,
        label: `Нед ${12 - i}`,
        count: 0
      });
    }

    // Распределяем пользователей по неделям
    for (const user of users) {
      const regDate = new Date(user.registeredAt);
      for (const bucket of weekBuckets) {
        if (regDate >= bucket.start && regDate <= bucket.end) {
          bucket.count++;
          break;
        }
      }
    }

    return weekBuckets.map((bucket) => ({
      name: bucket.label,
      total: bucket.count
    }));
  } catch (error) {
    logger.error(
      'Error fetching weekly user growth stats',
      { error },
      'dashboard-service'
    );
    return [];
  }
}
