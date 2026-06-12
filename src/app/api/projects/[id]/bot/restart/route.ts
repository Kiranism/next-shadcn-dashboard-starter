/**
 * @file: route.ts
 * @description: API для перезапуска Telegram бота
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, BotManager
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { botManager } from '@/lib/telegram/bot-manager';
import { WorkflowRuntimeService } from '@/lib/services/workflow-runtime.service';
import { requireProjectAccess } from '@/lib/with-project-access';

// POST /api/projects/[id]/bot/restart - Принудительный перезапуск или остановка бота
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    const body = await request.json().catch(() => ({}));
    const shouldStop = body.stop === true;

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        botSettings: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    if (!project.botSettings) {
      return NextResponse.json(
        { error: 'Настройки бота не найдены' },
        { status: 404 }
      );
    }

    logger.info('🔄 RESTART API ВЫЗВАН', {
      projectId,
      shouldStop,
      botToken: project.botSettings.botToken
        ? '***' + project.botSettings.botToken.slice(-4)
        : 'none',
      allBotsInManager: botManager.getAllBotsStatus(),
      component: 'bot-restart'
    });

    // Если нужно просто остановить бота
    if (shouldStop) {
      // ✅ КРИТИЧНО: Сначала останавливаем конкретного бота
      try {
        await botManager.stopBot(projectId);
        logger.info(
          `✅ Бот ${projectId} остановлен`,
          { projectId },
          'bot-restart'
        );
      } catch (error) {
        logger.warn(
          `⚠️ Ошибка остановки конкретного бота, пробуем emergencyStopAll`,
          {
            projectId,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          'bot-restart'
        );

        // Fallback: экстренная остановка всех ботов
        await botManager.emergencyStopAll();
      }

      // Дополнительная задержка для полной очистки
      await new Promise((resolve) => setTimeout(resolve, 1000));

      logger.info('🛑 БОТ ОСТАНОВЛЕН', { projectId }, 'bot-restart');

      return NextResponse.json({
        success: true,
        message: 'Бот успешно остановлен'
      });
    }

    // Иначе перезапускаем
    // ЭКСТРЕННО ОСТАНАВЛИВАЕМ ВСЕ БОТЫ для предотвращения 409 конфликтов
    await botManager.emergencyStopAll();
    logger.info(
      '🚨 ВСЕ БОТЫ ЭКСТРЕННО ОСТАНОВЛЕНЫ',
      { projectId },
      'bot-restart'
    );

    // ✅ КРИТИЧНО: Инвалидируем кэш workflow для этого проекта
    // Это гарантирует, что бот загрузит актуальную версию workflow из БД
    await WorkflowRuntimeService.invalidateCache(projectId);
    logger.info(
      '🔄 Кэш workflow инвалидирован для проекта',
      { projectId },
      'bot-restart'
    );

    // ✅ ДОПОЛНИТЕЛЬНАЯ ЗАДЕРЖКА: ждем полной остановки всех ботов перед запуском нового
    // Это гарантирует, что Telegram API успеет освободить соединения
    await new Promise((resolve) => setTimeout(resolve, 2000));
    logger.info(
      '⏳ Ожидание завершения остановки ботов...',
      { projectId },
      'bot-restart'
    );

    // Создаем новый экземпляр бота
    const botInstance = await botManager.createBot(
      projectId,
      project.botSettings as any
    );
    logger.info(
      'Bot restarted successfully',
      {
        projectId,
        botId: botInstance.bot.botInfo.id,
        username: botInstance.bot.botInfo.username
      },
      'bot-restart'
    );

    return NextResponse.json({
      success: true,
      message: 'Бот успешно перезапущен',
      bot: {
        id: botInstance.bot.botInfo.id,
        username: botInstance.bot.botInfo.username,
        isActive: botInstance.isActive,
        isPolling: botInstance.isPolling
      }
    });
  } catch (error) {
    logger.error(
      'Error restarting bot',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      'bot-restart'
    );

    return NextResponse.json(
      { error: 'Ошибка перезапуска бота' },
      { status: 500 }
    );
  }
}
