/**
 * @file: src/app/api/notifications/system/route.ts
 * @description: API endpoint для системных уведомлений с реальными данными
 * @project: SaaS Bonus System
 * @dependencies: Next.js, Prisma, JWT
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

    const admin = await db.adminAccount.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        twoFactorEnabled: true,
        firstName: true,
        lastName: true
      }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Получаем существующие уведомления из БД
    const existingNotifications = await db.systemNotification.findMany({
      where: { adminId: admin.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Получаем статистику системы для генерации новых уведомлений
    const projectsCount = await db.project.count();
    const usersCount = await db.user.count();
    const botsCount = await db.botSettings.count();
    const activeBotsCount = await db.botSettings.count({
      where: { isActive: true }
    });

    // Генерируем новые уведомления на основе текущего состояния
    const newNotifications = [];

    // Уведомления о подписке
    if (admin.role === 'ADMIN' || admin.role === 'SUPERADMIN') {
      const hasSubscriptionNotification = existingNotifications.some(
        (n) => n.type === 'subscription' && n.status !== 'dismissed'
      );

      if (!hasSubscriptionNotification) {
        newNotifications.push({
          adminId: admin.id,
          type: 'subscription',
          title: 'Подписка активна',
          message: 'Ваша подписка на Профессиональный план активна',
          status: 'read',
          priority: 'medium',
          actionUrl: '/dashboard/billing',
          actionText: 'Управление подпиской',
          metadata: { planType: 'professional' }
        });
      }
    }

    // Уведомления о неактивных ботах
    if (activeBotsCount < botsCount) {
      const hasBotNotification = existingNotifications.some(
        (n) => n.type === 'bot' && n.status !== 'dismissed'
      );

      if (!hasBotNotification) {
        newNotifications.push({
          adminId: admin.id,
          type: 'bot',
          title: 'Неактивные Telegram боты',
          message: `${botsCount - activeBotsCount} из ${botsCount} Telegram ботов неактивны. Проверьте настройки.`,
          status: 'unread',
          priority: 'high',
          actionUrl: '/dashboard/projects',
          actionText: 'Проверить боты',
          metadata: {
            totalBots: botsCount,
            inactiveBots: botsCount - activeBotsCount
          }
        });
      }
    }

    // Уведомления о безопасности (2FA)
    if (!admin.twoFactorEnabled) {
      const hasSecurityNotification = existingNotifications.some(
        (n) => n.type === 'security' && n.status !== 'dismissed'
      );

      if (!hasSecurityNotification) {
        newNotifications.push({
          adminId: admin.id,
          type: 'security',
          title: 'Рекомендация по безопасности',
          message:
            'Рекомендуется включить двухфакторную аутентификацию для повышения безопасности',
          status: 'unread',
          priority: 'medium',
          actionUrl: '/dashboard/settings',
          actionText: 'Настройки безопасности',
          metadata: { securityType: '2fa' }
        });
      }
    }

    // Уведомления о биллинге
    const hasBillingNotification = existingNotifications.some(
      (n) => n.type === 'billing' && n.status !== 'dismissed'
    );

    if (!hasBillingNotification) {
      newNotifications.push({
        adminId: admin.id,
        type: 'billing',
        title: 'Использование ресурсов',
        message: `Используется ${projectsCount} проектов, ${usersCount} пользователей. Лимит: ${admin.role === 'ADMIN' ? '5 проектов, 1000 пользователей' : '1 проект, 100 пользователей'}.`,
        status: 'read',
        priority: 'low',
        actionUrl: '/dashboard/billing',
        actionText: 'Посмотреть использование',
        metadata: {
          projectsUsed: projectsCount,
          usersUsed: usersCount,
          adminRole: admin.role
        }
      });
    }

    // Создаем новые уведомления в БД
    if (newNotifications.length > 0) {
      await db.systemNotification.createMany({
        data: newNotifications
      });
    }

    // Получаем все уведомления (существующие + новые)
    const allNotifications = await db.systemNotification.findMany({
      where: { adminId: admin.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Форматируем уведомления для фронтенда
    const formattedNotifications = allNotifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      status: notification.status,
      priority: notification.priority,
      createdAt: notification.createdAt.toISOString(),
      actionUrl: notification.actionUrl,
      actionText: notification.actionText
    }));

    return NextResponse.json({ notifications: formattedNotifications });
  } catch (error) {
    logger.error('Error fetching system notifications:', {
      error: String(error)
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
