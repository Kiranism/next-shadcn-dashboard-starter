/**
 * @file: route.ts
 * @description: API для управления сообщениями бота
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, Prisma
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// PUT /api/projects/[id]/bot/messages - Обновление сообщений бота
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем существование настроек бота
    const existingSettings = await db.botSettings.findUnique({
      where: { projectId: id }
    });

    if (!existingSettings) {
      return NextResponse.json(
        { error: 'Настройки бота не найдены' },
        { status: 404 }
      );
    }

    // Обновляем настройки сообщений
    const updatedSettings = await db.botSettings.update({
      where: { projectId: id },
      data: {
        messageSettings: body.messageSettings
      }
    });

    // КРИТИЧНО: Перезапускаем бота с новыми настройками
    try {
      const { botManager } = await import('@/lib/telegram/bot-manager');
      if (updatedSettings.isActive) {
        await botManager.createBot(id, updatedSettings as any);
        logger.info(
          'Bot restarted with new message settings',
          {
            projectId: id
          },
          'bot-api'
        );
      }
    } catch (error) {
      logger.warn(
        'Failed to restart bot with new message settings',
        {
          projectId: id,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        'bot-api'
      );
      // Не прерываем выполнение, настройки уже сохранены
    }

    logger.info(
      'Bot messages updated',
      {
        projectId: id,
        messages: Object.keys(body.messageSettings || {})
      },
      'bot-api'
    );

    return NextResponse.json({
      success: true,
      messageSettings: updatedSettings.messageSettings
    });
  } catch (error) {
    logger.error(
      'Error updating bot messages',
      {
        projectId: (await context.params).id,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'bot-api'
    );

    return NextResponse.json(
      { error: 'Ошибка обновления сообщений бота' },
      { status: 500 }
    );
  }
}
