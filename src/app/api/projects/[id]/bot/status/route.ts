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
import { botManager } from '@/lib/telegram/bot-manager';
import { requireProjectAccess } from '@/lib/with-project-access';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

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

    // Проверяем статус бота в BotManager - это реальный источник правды
    const botInstance = botManager.getBot(projectId);
    const isBotRunning =
      botInstance && botInstance.isActive && botInstance.isPolling;

    // КРИТИЧНО: Сначала проверяем реальное состояние BotManager, а не Telegram API
    // Если бот запущен через long polling (isPolling), он работает независимо от webhook
    if (isBotRunning) {
      // Бот реально работает через polling
      // Безопасная проверка botInfo - может быть не загружен
      const botInfo = (botInstance?.bot as any)?.botInfo as
        | {
            id?: number;
            username?: string;
            first_name?: string;
          }
        | undefined;

      // Если botInfo не загружен, используем данные из базы
      const finalBotUsername = botInfo?.username || botUsername || '';
      const finalBotId = botInfo?.id || null;
      const finalBotFirstName = botInfo?.first_name || null;

      const statusInfo = {
        configured: true,
        status: 'ACTIVE' as const,
        message: 'Бот активен и работает через long polling',
        bot: {
          id: finalBotId,
          username: finalBotUsername,
          firstName: finalBotFirstName
        },
        connection: {
          hasWebhook: false, // При polling webhook не используется
          lastUpdate: null,
          canReceiveUpdates: true // Long polling работает
        }
      };

      // Обновляем статус в базе данных если он изменился
      if (
        project.botStatus !== 'ACTIVE' ||
        (finalBotUsername && project.botUsername !== finalBotUsername)
      ) {
        await db.project.update({
          where: { id: projectId },
          data: {
            botStatus: 'ACTIVE',
            botUsername: finalBotUsername || project.botUsername
          }
        });

        // Также обновляем botUsername в botSettings, если он изменился
        if (
          finalBotUsername &&
          botSettings &&
          botSettings.botUsername !== finalBotUsername
        ) {
          await db.botSettings.update({
            where: { projectId },
            data: { botUsername: finalBotUsername }
          });
        }

        logger.info('Bot status updated to ACTIVE (from BotManager)', {
          projectId,
          oldStatus: project.botStatus,
          newStatus: 'ACTIVE',
          botUsername: finalBotUsername,
          botManagerStatus: 'RUNNING_POLLING'
        });
      }

      logger.info('Bot status checked successfully (from BotManager)', {
        projectId,
        status: 'ACTIVE',
        isPolling: true,
        isActive: botInstance.isActive
      });

      return NextResponse.json(statusInfo);
    }

    // Если бот не запущен в BotManager, проверяем через Telegram API
    // Используем улучшенный метод проверки статуса
    const statusInfo =
      await TelegramBotValidationService.getBotStatus(botToken);

    // Корректируем статус на основе реального состояния BotManager
    let finalStatus = statusInfo.status;

    // Если бот не запущен в BotManager, но Telegram API говорит что он активен,
    // это значит бот работает через webhook или не запущен вообще
    if (!isBotRunning && statusInfo.status === 'ACTIVE') {
      // Проверяем, есть ли webhook - если есть, бот может работать через webhook
      // Если нет webhook и нет polling - бот неактивен
      if (!statusInfo.connection?.hasWebhook) {
        finalStatus = 'INACTIVE';
        statusInfo.status = 'INACTIVE';
        statusInfo.message = 'Бот не запущен (нет ни polling, ни webhook)';
      } else {
        // Webhook настроен - бот может работать через webhook
        statusInfo.message = 'Бот настроен на webhook (не через polling)';
      }
    }

    // Обновляем статус в базе данных если он изменился
    const telegramBotUsername = statusInfo.bot?.username || botUsername || '';
    if (
      project.botStatus !== finalStatus ||
      (telegramBotUsername && project.botUsername !== telegramBotUsername)
    ) {
      await db.project.update({
        where: { id: projectId },
        data: {
          botStatus: finalStatus,
          botUsername: telegramBotUsername || project.botUsername
        }
      });

      // Также обновляем botUsername в botSettings, если он изменился
      if (
        telegramBotUsername &&
        botSettings &&
        botSettings.botUsername !== telegramBotUsername
      ) {
        await db.botSettings
          .update({
            where: { projectId },
            data: { botUsername: telegramBotUsername }
          })
          .catch((err) => {
            logger.warn('Failed to update botUsername in botSettings', {
              projectId,
              error: err instanceof Error ? err.message : String(err)
            });
          });
      }

      logger.info('Bot status updated in database', {
        projectId,
        oldStatus: project.botStatus,
        newStatus: finalStatus,
        botUsername: telegramBotUsername,
        botManagerStatus: isBotRunning ? 'RUNNING' : 'STOPPED'
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
