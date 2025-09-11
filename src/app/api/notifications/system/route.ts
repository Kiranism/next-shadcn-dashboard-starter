/**
 * @file: src/app/api/notifications/system/route.ts
 * @description: API endpoint для системных уведомлений
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

    // Получаем статистику для генерации уведомлений
    const projectsCount = await db.project.count();
    const usersCount = await db.user.count();
    const botsCount = await db.botSettings.count();
    const activeBotsCount = await db.botSettings.count({
      where: { isActive: true }
    });

    // Генерируем системные уведомления на основе текущего состояния
    const notifications = [];

    // Уведомления о подписке
    if (admin.role === 'ADMIN' || admin.role === 'SUPERADMIN') {
      notifications.push({
        id: 'sub-1',
        type: 'subscription',
        title: 'Подписка активна',
        message:
          'Ваша подписка на Профессиональный план активна до 28 февраля 2025',
        status: 'read',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        actionUrl: '/dashboard/billing',
        actionText: 'Управление подпиской'
      });
    }

    // Уведомления о ботах
    if (activeBotsCount < botsCount) {
      notifications.push({
        id: 'bot-1',
        type: 'bot',
        title: 'Неактивные Telegram боты',
        message: `${botsCount - activeBotsCount} из ${botsCount} Telegram ботов неактивны. Проверьте настройки.`,
        status: 'unread',
        priority: 'high',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 часа назад
        actionUrl: '/dashboard/projects',
        actionText: 'Проверить боты'
      });
    }

    // Уведомления о безопасности
    notifications.push({
      id: 'sec-1',
      type: 'security',
      title: 'Рекомендация по безопасности',
      message:
        'Рекомендуется включить двухфакторную аутентификацию для повышения безопасности',
      status: 'unread',
      priority: 'medium',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 день назад
      actionUrl: '/dashboard/settings',
      actionText: 'Настройки безопасности'
    });

    // Системные уведомления
    notifications.push({
      id: 'sys-1',
      type: 'system',
      title: 'Обновление системы',
      message:
        'Доступно обновление системы. Рекомендуется обновить до последней версии.',
      status: 'read',
      priority: 'low',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 дня назад
      actionUrl: '/dashboard',
      actionText: 'Подробнее'
    });

    // Уведомления о биллинге
    if (admin.role === 'ADMIN' || admin.role === 'SUPERADMIN') {
      notifications.push({
        id: 'bill-1',
        type: 'billing',
        title: 'Использование ресурсов',
        message: `Используется ${projectsCount} проектов, ${usersCount} пользователей. Лимит: 5 проектов, 1000 пользователей.`,
        status: 'read',
        priority: 'low',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 неделя назад
        actionUrl: '/dashboard/billing',
        actionText: 'Посмотреть использование'
      });
    }

    // Критическое уведомление если нет активных ботов
    if (activeBotsCount === 0 && botsCount > 0) {
      notifications.push({
        id: 'bot-critical',
        type: 'bot',
        title: 'КРИТИЧНО: Все Telegram боты неактивны',
        message:
          'Все Telegram боты в системе неактивны. Пользователи не могут получать уведомления.',
        status: 'unread',
        priority: 'critical',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 минут назад
        actionUrl: '/dashboard/projects',
        actionText: 'Настроить боты'
      });
    }

    return NextResponse.json({
      notifications: notifications.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      stats: {
        total: notifications.length,
        unread: notifications.filter((n) => n.status === 'unread').length,
        critical: notifications.filter((n) => n.priority === 'critical').length,
        read: notifications.filter((n) => n.status === 'read').length
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
