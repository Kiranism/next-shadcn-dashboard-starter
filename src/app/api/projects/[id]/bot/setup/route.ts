/**
 * @file: src/app/api/projects/[id]/bot/setup/route.ts
 * @description: API для настройки и перезапуска Telegram бота
 * @project: SaaS Bonus System
 * @dependencies: botManager, db
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { botManager } from '@/lib/telegram/bot-manager';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { BotSettings } from '@/types/bonus';
import { TelegramBotValidationService } from '@/lib/services/telegram-bot-validation.service';
import { withApiRateLimit } from '@/lib';
import { requireProjectAccess } from '@/lib/with-project-access';

async function handlePOST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;

    // Получаем настройки бота из базы данных
    const project = await db.project.findUnique({
      where: { id },
      include: {
        botSettings: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    const botSettings = project.botSettings;
    if (!botSettings || !botSettings.botToken) {
      return NextResponse.json(
        { error: 'Настройки бота не найдены' },
        { status: 404 }
      );
    }

    // КРИТИЧНО: Сначала останавливаем существующий бот
    try {
      await botManager.stopBot(id);
      logger.info(`Предыдущий бот остановлен для проекта ${id}`, {
        projectId: id,
        component: 'bot-setup'
      });
    } catch (stopError) {
      logger.warn(`Ошибка остановки предыдущего бота для проекта ${id}`, {
        projectId: id,
        error:
          stopError instanceof Error ? stopError.message : 'Неизвестная ошибка',
        component: 'bot-setup'
      });
      // Продолжаем выполнение - возможно бот не был запущен
    }

    // Небольшая задержка для полной остановки
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Создаем и запускаем новый бот
    const botSettingsForManager = {
      ...botSettings,
      welcomeMessage:
        typeof botSettings.welcomeMessage === 'string'
          ? botSettings.welcomeMessage
          : (botSettings.welcomeMessage as any)?.text ||
            'Добро пожаловать! 🎉\n\nЭто бот бонусной программы.'
    };

    const botInstance = await botManager.createBot(
      id,
      botSettingsForManager as BotSettings
    );

    // Устанавливаем команды бота сразу после запуска
    try {
      await TelegramBotValidationService.setBotCommands(botSettings.botToken);
    } catch {}

    logger.info(`Бот перезапущен`, {
      projectId: id,
      component: 'bot-setup'
    });

    return NextResponse.json({
      message: 'Бот успешно перезапущен',
      botInfo: {
        projectId: id,
        isActive: botInstance.isActive,
        lastUpdated: botInstance.lastUpdated
      }
    });
  } catch (error) {
    const { id } = await params;
    logger.error(`Ошибка перезапуска бота для проекта ${id}`, {
      projectId: id,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      component: 'bot-setup'
    });

    return NextResponse.json(
      { error: 'Не удалось перезапустить бота' },
      { status: 500 }
    );
  }
}

// Применяем rate limiting
export const POST = withApiRateLimit(handlePOST);
