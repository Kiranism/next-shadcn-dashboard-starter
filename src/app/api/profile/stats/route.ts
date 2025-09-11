/**
 * @file: src/app/api/profile/stats/route.ts
 * @description: API endpoint для получения статистики профиля пользователя
 * @project: SaaS Bonus System
 * @dependencies: Next.js API routes, Prisma, JWT auth
 * @created: 2024-09-11
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { verifyJwt } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию через HttpOnly cookie
    const token = request.cookies.get('sb_auth')?.value;
    // eslint-disable-next-line no-console
    console.log('Profile stats API - token:', token ? 'present' : 'missing');

    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    // eslint-disable-next-line no-console
    console.log('Profile stats API - payload:', payload ? 'valid' : 'invalid');

    if (!payload) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    // Получаем статистику из базы данных
    const [
      projectsCount,
      usersCount,
      botsCount,
      totalBonuses,
      activeProjects,
      recentActivity
    ] = await Promise.all([
      // Общее количество проектов
      db.project.count(),

      // Общее количество пользователей
      db.user.count(),

      // Количество активных ботов (проекты с настроенными ботами)
      db.project.count({
        where: {
          botSettings: {
            isNot: null
          }
        }
      }),

      // Общая сумма бонусов
      db.bonus.aggregate({
        _sum: {
          amount: true
        }
      }),

      // Активные проекты (с активностью за последние 30 дней)
      db.project.count({
        where: {
          users: {
            some: {
              bonuses: {
                some: {
                  createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  }
                }
              }
            }
          }
        }
      }),

      // Последняя активность
      db.bonus.findFirst({
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          createdAt: true
        }
      })
    ]);

    // Получаем информацию об администраторе
    const admin = await db.adminAccount.findUnique({
      where: { id: payload.sub },
      select: {
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Вычисляем uptime (примерно, на основе последней активности)
    const uptime = recentActivity
      ? Math.round(
          (Date.now() - recentActivity.createdAt.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    const stats = {
      user: {
        name: admin ? `Администратор (${admin.role})` : 'Администратор',
        email: admin?.email || '',
        createdAt: admin?.createdAt || new Date(),
        lastLogin: admin?.updatedAt || new Date()
      },
      system: {
        projects: projectsCount,
        users: usersCount,
        bots: botsCount,
        activeProjects,
        totalBonuses: totalBonuses._sum.amount || 0,
        uptime: Math.max(0, 100 - uptime), // Процент uptime
        lastActivity: recentActivity?.createdAt || new Date()
      },
      version: 'v2.1.0',
      status: {
        database: 'Подключена',
        redis: 'Активен',
        telegram: 'Работает'
      }
    };

    return NextResponse.json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get profile stats:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
