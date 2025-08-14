/**
 * @file: status/route.ts
 * @description: API endpoint для проверки статуса Telegram бота проекта
 * @project: SaaS Bonus System
 * @dependencies: TelegramBotValidationService, Prisma
 * @created: 2024-12-10
 * @updated: 2025-01-23
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { TelegramBotValidationService } from '@/lib/services/telegram-bot-validation.service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;

    // Получаем проект с настройками бота
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        botToken: true,
        botUsername: true,
        botStatus: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем настройки бота в отдельной таблице
    const botSettings = await db.botSettings.findUnique({
      where: { projectId },
      select: {
        botToken: true,
        botUsername: true,
        isActive: true
      }
    });

    // Берем токен из настроек бота или из проекта (для обратной совместимости)
    const botToken = botSettings?.botToken || project.botToken;
    const botUsername = botSettings?.botUsername || project.botUsername;

    if (!botToken) {
      return NextResponse.json({
        configured: false,
        status: 'INACTIVE',
        message: 'Бот не настроен. Сначала добавьте токен бота'
      });
    }

    // Используем улучшенный метод проверки статуса
    const statusInfo =
      await TelegramBotValidationService.getBotStatus(botToken);

    // Обновляем статус в базе данных если он изменился
    if (project.botStatus !== statusInfo.status) {
      await db.project.update({
        where: { id: projectId },
        data: {
          botStatus: statusInfo.status,
          botUsername: statusInfo.bot?.username || botUsername
        }
      });

      logger.info('Bot status updated in database', {
        projectId,
        oldStatus: project.botStatus,
        newStatus: statusInfo.status,
        botUsername: statusInfo.bot?.username
      });
    }

    logger.info('Bot status checked successfully', {
      projectId,
      status: statusInfo.status,
      configured: statusInfo.configured
    });

    return NextResponse.json(statusInfo);
  } catch (error: any) {
    const { id: projectId } = await context.params;
    logger.error('Error checking bot status', {
      projectId,
      error: error.message
    });

    return NextResponse.json(
      {
        configured: true,
        status: 'ERROR',
        message: 'Ошибка при проверке статуса бота',
        error: error.message
      },
      { status: 500 }
    );
  }
}
