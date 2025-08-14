/**
 * @file: route.ts
 * @description: API для управления функциональными настройками бота
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, Prisma
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { botManager } from '@/lib/telegram/bot-manager';

// PUT /api/projects/[id]/bot/features - Обновление функциональных настроек бота
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Обновляем функциональные настройки
    const updatedSettings = await db.botSettings.update({
      where: { projectId: id },
      data: {
        functionalSettings: body.functionalSettings
      }
    });

    // КРИТИЧНО: Перезапускаем бота с новыми настройками если он активен
    try {
      if (updatedSettings.isActive) {
        await botManager.createBot(id, updatedSettings as any);
        logger.info(
          'Bot restarted with new functional settings',
          {
            projectId: id
          },
          'bot-api'
        );
      }
    } catch (error) {
      logger.warn(
        'Failed to restart bot with new settings',
        {
          projectId: id,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        'bot-api'
      );
      // Не прерываем выполнение, настройки уже сохранены
    }

    logger.info(
      'Bot functional settings updated',
      {
        projectId: id,
        features: Object.keys(body.functionalSettings || {})
      },
      'bot-api'
    );

    return NextResponse.json({
      success: true,
      functionalSettings: updatedSettings.functionalSettings
    });
  } catch (error) {
    logger.error(
      'Error updating bot functional settings',
      {
        projectId: (await params).id,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'bot-api'
    );

    return NextResponse.json(
      { error: 'Ошибка обновления функциональных настроек бота' },
      { status: 500 }
    );
  }
}
