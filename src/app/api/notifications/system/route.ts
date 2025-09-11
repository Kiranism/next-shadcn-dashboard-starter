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
        isActive: true
      }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Получаем существующие уведомления из БД (временно пустой массив)
    const existingNotifications: any[] = [];

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
        (n) =>
          n.title.includes('Подписка') &&
          (n.metadata as any)?.status !== 'dismissed'
      );

      if (!hasSubscriptionNotification) {
        newNotifications.push({
          projectId: 'system',
          channel: 'EMAIL' as any,
          title: 'Подписка активна',
          message: 'Ваша подписка на Профессиональный план активна',
          metadata: {
            type: 'subscription',
            status: 'read',
            priority: 'medium',
            actionUrl: '/dashboard/billing',
            actionText: 'Управление подпиской',
            planType: 'professional'
          }
        });
      }
    }

    // Уведомления о неактивных ботах
    if (activeBotsCount < botsCount) {
      const hasBotNotification = existingNotifications.some(
        (n) =>
          (n.metadata as any)?.type === 'bot' &&
          (n.metadata as any)?.status !== 'dismissed'
      );

      if (!hasBotNotification) {
        newNotifications.push({
          projectId: 'system',
          channel: 'TELEGRAM' as any,
          title: 'Неактивные Telegram боты',
          message: `${botsCount - activeBotsCount} из ${botsCount} Telegram ботов неактивны. Проверьте настройки.`,
          metadata: {
            type: 'bot',
            status: 'unread',
            priority: 'high',
            actionUrl: '/dashboard/projects',
            actionText: 'Проверить боты',
            totalBots: botsCount,
            inactiveBots: botsCount - activeBotsCount
          }
        });
      }
    }

    // Уведомления о биллинге
    const hasBillingNotification = existingNotifications.some(
      (n) =>
        (n.metadata as any)?.type === 'billing' &&
        (n.metadata as any)?.status !== 'dismissed'
    );

    if (!hasBillingNotification) {
      newNotifications.push({
        projectId: 'system',
        channel: 'EMAIL' as any,
        title: 'Использование ресурсов',
        message: `Используется ${projectsCount} проектов, ${usersCount} пользователей. Лимит: ${admin.role === 'ADMIN' ? '5 проектов, 1000 пользователей' : '1 проект, 100 пользователей'}.`,
        metadata: {
          type: 'billing',
          status: 'read',
          priority: 'low',
          actionUrl: '/dashboard/billing',
          actionText: 'Посмотреть использование',
          projectsUsed: projectsCount,
          usersUsed: usersCount,
          adminRole: admin.role
        }
      });
    }

    // Временно не создаем уведомления в БД из-за ограничений прав
    // if (newNotifications.length > 0) {
    //   await db.notification.createMany({
    //     data: newNotifications
    //   });
    // }

    // Получаем все уведомления (временно только новые)
    const allNotifications = newNotifications;

    // Преобразуем в формат для фронтенда
    const formattedNotifications = allNotifications.map(
      (notification, index) => ({
        id: `temp-${index}`, // Временный ID для новых уведомлений
        type: (notification.metadata as any)?.type || 'info',
        title: notification.title,
        message: notification.message,
        status: (notification.metadata as any)?.status || 'unread',
        priority: (notification.metadata as any)?.priority || 'medium',
        actionUrl: (notification.metadata as any)?.actionUrl,
        actionText: (notification.metadata as any)?.actionText,
        createdAt: new Date().toISOString(),
        metadata: notification.metadata
      })
    );

    logger.info('System notifications retrieved', {
      adminId: admin.id,
      notificationsCount: formattedNotifications.length,
      newNotificationsCreated: newNotifications.length
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications: formattedNotifications,
        stats: {
          totalNotifications: formattedNotifications.length,
          unreadCount: formattedNotifications.filter(
            (n) => n.status === 'unread'
          ).length,
          projectsCount,
          usersCount,
          botsCount,
          activeBotsCount
        }
      }
    });
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
