/**
 * @file: route.ts
 * @description: API для массовых уведомлений с поддержкой медиа и кнопок
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, Telegram notifications
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  sendRichBroadcastMessage,
  type RichNotification
} from '@/lib/telegram/notifications';
import { botManager } from '@/lib/telegram/bot-manager';
import { withApiRateLimit, withValidation } from '@/lib';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

// POST /api/projects/[id]/notifications - Отправка расширенных уведомлений
const notificationBodySchema = z.object({
  message: z.string().min(1).max(4000),
  imageUrl: z.string().url().optional(),
  buttons: z
    .array(
      z.object({
        text: z.string().min(1).max(64),
        url: z.string().url().optional(),
        callback_data: z.string().max(64).optional()
      })
    )
    .max(6)
    .optional(),
  parseMode: z.enum(['Markdown', 'HTML']).optional(),
  userIds: z.array(z.string()).optional()
});

async function sendNotificationsHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const body = await request.json();

    // Валидация с помощью Zod
    const validatedData = notificationBodySchema.parse(body);
    const {
      message,
      imageUrl,
      buttons,
      userIds,
      parseMode = 'Markdown'
    } = validatedData;

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем и создаем бота если нужно
    let botInstance = botManager.getBot(projectId);

    if (!botInstance || !botInstance.isActive) {
      logger.info(
        `Бот для проекта ${projectId} не найден, пытаемся создать...`,
        {
          projectId,
          component: 'notifications-api'
        }
      );

      // Получаем настройки бота из базы данных
      const botSettings = await db.botSettings.findUnique({
        where: { projectId }
      });

      if (!botSettings || !botSettings.botToken) {
        logger.error(`Настройки бота не найдены для проекта ${projectId}`, {
          projectId,
          component: 'notifications-api'
        });
        return NextResponse.json(
          { error: 'Настройки бота не найдены' },
          { status: 400 }
        );
      }

      try {
        botInstance = await botManager.createBot(projectId, botSettings as any);
        logger.info(`Бот успешно создан для проекта ${projectId}`, {
          projectId,
          component: 'notifications-api'
        });
      } catch (error) {
        logger.error(`Ошибка создания бота для проекта ${projectId}`, {
          projectId,
          error: error instanceof Error ? error.message : 'Unknown error',
          component: 'notifications-api'
        });
        return NextResponse.json(
          { error: 'Ошибка создания бота' },
          { status: 500 }
        );
      }
    }

    // Быстрый health-check состояния бота перед рассылкой
    if (!botInstance || !botInstance.isActive) {
      return NextResponse.json(
        { error: 'Бот не активен для проекта. Включите бота в настройках.' },
        { status: 400 }
      );
    }

    // Создаем объект уведомления
    const notification: RichNotification = {
      message: message.trim(),
      imageUrl: imageUrl || undefined,
      buttons: buttons || undefined,
      parseMode: parseMode === 'HTML' ? 'HTML' : 'Markdown'
    };

    // Отправляем уведомления
    const result = await sendRichBroadcastMessage(
      projectId,
      notification,
      userIds
    );

    // Логируем результат
    logger.info(
      'Rich notifications sent',
      {
        projectId,
        sent: result.sent,
        failed: result.failed,
        hasImage: !!imageUrl,
        hasButtons: !!(buttons && buttons.length > 0),
        userCount: userIds ? userIds.length : 'all'
      },
      'notifications-api'
    );

    return NextResponse.json({
      success: true,
      message: `Уведомления отправлены: ${result.sent} успешно, ${result.failed} с ошибкой`,
      sentCount: result.sent,
      failedCount: result.failed,
      total: result.sent + result.failed
    });
  } catch (error) {
    // Обработка ошибок валидации Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Ошибка валидации данных',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    logger.error(
      'Error sending notifications',
      {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'notifications-api'
    );

    return NextResponse.json(
      { error: 'Ошибка отправки уведомлений' },
      { status: 500 }
    );
  }
}

// GET /api/projects/[id]/notifications/stats - Статистика уведомлений
async function getNotificationStatsHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: projectId } = params;

  // Проверяем существование проекта
  const project = await db.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
  }

  try {
    // Получаем статистику пользователей
    const totalUsers = await db.user.count({
      where: { projectId, isActive: true }
    });

    const telegramUsers = await db.user.count({
      where: {
        projectId,
        isActive: true,
        telegramId: { not: null }
      }
    });

    const stats = {
      totalUsers,
      telegramUsers,
      reachabilityPercentage:
        totalUsers > 0 ? Math.round((telegramUsers / totalUsers) * 100) : 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    logger.error(
      'Error getting notification stats',
      {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'notifications-api'
    );

    return NextResponse.json(
      { error: 'Ошибка получения статистики' },
      { status: 500 }
    );
  }
}

export const POST = withErrorHandler(sendNotificationsHandler);
export const GET = withApiRateLimit(
  withErrorHandler(getNotificationStatsHandler)
);
