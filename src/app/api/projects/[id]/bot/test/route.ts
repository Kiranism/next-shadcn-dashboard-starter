/**
 * @file: test/route.ts
 * @description: API endpoint для полного тестирования Telegram бота проекта
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
import { BotStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const body = await request.json();
    const { testChatId } = body;

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

    if (!botToken) {
      return NextResponse.json(
        { error: 'Бот не настроен. Сначала настройте токен бота' },
        { status: 400 }
      );
    }

    // Проводим полное тестирование бота
    const testResult = await TelegramBotValidationService.testBot(
      botToken,
      testChatId
    );

    if (!testResult.success) {
      // Обновляем статус бота на ERROR если тест не прошел
      await db.project.update({
        where: { id: projectId },
        data: { botStatus: BotStatus.ERROR }
      });

      logger.warn('Bot test failed', {
        projectId,
        botUsername: project.botUsername,
        error: testResult.error,
        testChatId: testChatId || 'not provided'
      });

      return NextResponse.json(
        {
          success: false,
          error: testResult.error,
          message: 'Тест бота не прошел',
          details: testResult.details
        },
        { status: 400 }
      );
    }

    // Обновляем статус бота на ACTIVE если тест прошел успешно
    await db.project.update({
      where: { id: projectId },
      data: { botStatus: BotStatus.ACTIVE }
    });

    logger.info('Bot test completed successfully', {
      projectId,
      botUsername: project.botUsername,
      testChatId: testChatId || 'not provided',
      details: testResult.details
    });

    return NextResponse.json({
      success: true,
      message: testResult.message,
      details: {
        ...testResult.details,
        testType: testChatId ? 'full_test_with_message' : 'status_check_only',
        projectName: project.name,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    const { id: projectId } = await context.params;
    logger.error('Error testing bot', {
      projectId,
      error: error.message
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: error.message
      },
      { status: 500 }
    );
  }
}
