/**
 * @file: src/app/api/billing/route.ts
 * @description: API endpoint для получения данных биллинга
 * @project: SaaS Bonus System
 * @dependencies: Prisma, JWT auth
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJwt } from '@/lib/jwt';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('sb_auth')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Получаем данные администратора
    const admin = await db.adminAccount.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Получаем статистику проектов
    const projectsCount = await db.project.count();
    const usersCount = await db.user.count();
    const botsCount = await db.botSettings.count({
      where: { status: 'ACTIVE' }
    });

    // Определяем текущий план на основе роли
    let currentPlan = {
      id: 'starter',
      name: 'Стартовый',
      price: 0,
      currency: 'RUB',
      interval: 'month' as const,
      features: [
        'До 1 проекта',
        'До 100 пользователей',
        '1 Telegram бот',
        'Базовые уведомления',
        'Email поддержка'
      ],
      limits: {
        projects: 1,
        users: 100,
        bots: 1,
        notifications: 1000
      }
    };

    if (admin.role === 'ADMIN' || admin.role === 'SUPERADMIN') {
      currentPlan = {
        id: 'professional',
        name: 'Профессиональный',
        price: 2990,
        currency: 'RUB',
        interval: 'month' as const,
        features: [
          'До 5 проектов',
          'До 1000 пользователей',
          '5 Telegram ботов',
          'Расширенные уведомления',
          'Приоритетная поддержка',
          'Аналитика и отчеты'
        ],
        limits: {
          projects: 5,
          users: 1000,
          bots: 5,
          notifications: 10000
        },
        popular: true
      };
    }

    // Статистика использования
    const usageStats = {
      projects: {
        used: projectsCount,
        limit:
          currentPlan.limits.projects === -1 ? -1 : currentPlan.limits.projects
      },
      users: {
        used: usersCount,
        limit: currentPlan.limits.users === -1 ? -1 : currentPlan.limits.users
      },
      bots: {
        used: botsCount,
        limit: currentPlan.limits.bots === -1 ? -1 : currentPlan.limits.bots
      },
      notifications: {
        used: 0, // Пока нет системы подсчета уведомлений
        limit:
          currentPlan.limits.notifications === -1
            ? -1
            : currentPlan.limits.notifications
      }
    };

    // Моковые данные для истории платежей (в реальном приложении это будет из платежной системы)
    const paymentHistory = [
      {
        id: '1',
        date: '2025-01-01',
        amount: currentPlan.price,
        currency: currentPlan.currency,
        status: 'paid' as const,
        description: `${currentPlan.name} план - Январь 2025`,
        invoiceUrl: '#'
      }
    ];

    return NextResponse.json({
      currentPlan,
      usageStats,
      paymentHistory,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    logger.error('Error fetching billing data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
