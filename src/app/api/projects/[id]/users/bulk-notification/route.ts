/**
 * @file: route.ts
 * @description: API для отправки расширенных уведомлений пользователям
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, Prisma, BotManager
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { botManager } from '@/lib/telegram/bot-manager';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const notificationSchema = z.object({
  userIds: z.array(z.string().uuid()),
  message: z.string().min(10).max(4000),
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
  parseMode: z.enum(['Markdown', 'HTML']).default('Markdown')
});

// POST /api/projects/[id]/users/bulk-notification - Отправка расширенных уведомлений
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    // Валидация данных
    const validatedData = notificationSchema.parse(body);

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем что бот активен
    const botSettings = await db.botSettings.findUnique({
      where: { projectId }
    });

    if (!botSettings || !botSettings.isActive) {
      return NextResponse.json(
        {
          error: 'Бот не настроен или не активен для этого проекта'
        },
        { status: 400 }
      );
    }

    logger.info(
      'Отправка расширенных уведомлений',
      {
        projectId,
        userIdsCount: validatedData.userIds.length,
        messageLength: validatedData.message.length,
        hasImage: !!validatedData.imageUrl,
        buttonsCount: validatedData.buttons?.length || 0
      },
      'bulk-notification-api'
    );

    // Отправляем расширенные уведомления
    const result = await botManager.sendRichBroadcastMessage(
      projectId,
      validatedData.userIds,
      validatedData.message,
      {
        imageUrl: validatedData.imageUrl,
        buttons: validatedData.buttons,
        parseMode: validatedData.parseMode
      }
    );

    // Логируем результат
    logger.info(
      'Результат отправки расширенных уведомлений',
      {
        projectId,
        success: result.success,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        errorsCount: result.errors.length
      },
      'bulk-notification-api'
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Отправлено ${result.sentCount} из ${validatedData.userIds.length} уведомлений`,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        errors: result.errors.length > 0 ? result.errors : undefined
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Не удалось отправить ни одного уведомления',
          sentCount: result.sentCount,
          failedCount: result.failedCount,
          errors: result.errors
        },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn(
        'Ошибка валидации данных уведомления',
        {
          projectId: (await params).id,
          errors: error.errors
        },
        'bulk-notification-api'
      );

      return NextResponse.json(
        {
          error: 'Неверные данные уведомления',
          details: error.errors
        },
        { status: 400 }
      );
    }

    logger.error(
      'Ошибка отправки расширенных уведомлений',
      {
        projectId: (await params).id,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'bulk-notification-api'
    );

    return NextResponse.json(
      {
        error: 'Ошибка отправки уведомлений',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
