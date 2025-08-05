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

// POST /api/projects/[id]/bot/restart - Принудительный перезапуск бота
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

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

    // Останавливаем существующий бот
    await botManager.stopBot(projectId);
    logger.info('Bot stopped for restart', { projectId }, 'bot-restart');

    // Создаем новый экземпляр бота
    const botInstance = await botManager.createBot(
      projectId,
      project.botSettings
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
