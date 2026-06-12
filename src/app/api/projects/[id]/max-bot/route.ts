/**
 * @file: src/app/api/projects/[id]/max-bot/route.ts
 * @description: API для управления настройками MAX бота проекта
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, Prisma
 * @created: 2026-03-22
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ProjectService } from '@/lib/services/project.service';
import { logger } from '@/lib/logger';
import { requireProjectAccess } from '@/lib/with-project-access';

function createCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  };
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: createCorsHeaders()
  });
}

/**
 * GET /api/projects/[id]/max-bot — Получение настроек MAX бота
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    const project = await ProjectService.getProjectById(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404, headers: createCorsHeaders() }
      );
    }

    // Получаем MAX-специфичные поля из project и botSettings
    const projectData = await (db.project as any).findUnique({
      where: { id },
      select: {
        maxBotToken: true,
        maxBotUsername: true,
        operationMode: true
      }
    });

    const botSettings = await (db.botSettings as any).findUnique({
      where: { projectId: id },
      select: {
        maxBotToken: true,
        maxBotUsername: true,
        isActive: true
      }
    });

    const maxBotToken =
      botSettings?.maxBotToken || projectData?.maxBotToken || null;
    const maxBotUsername =
      botSettings?.maxBotUsername || projectData?.maxBotUsername || null;

    // Проверяем, запущен ли MAX бот
    let isRunning = false;
    try {
      const { maxBotManager } = await import('@/lib/max-bot/bot-manager');
      const instance = maxBotManager.getBot(id);
      isRunning = !!instance?.isActive;
    } catch {
      // MaxBotManager может быть не инициализирован
    }

    return NextResponse.json(
      {
        maxBotToken: maxBotToken ? '***' + maxBotToken.slice(-4) : null,
        maxBotUsername,
        isConfigured: !!maxBotToken,
        isRunning,
        operationMode: projectData?.operationMode
      },
      { headers: createCorsHeaders() }
    );
  } catch (error) {
    logger.error('[MAX] Ошибка получения настроек MAX бота', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { error: 'Ошибка получения настроек MAX бота' },
      { status: 500, headers: createCorsHeaders() }
    );
  }
}

/**
 * PUT /api/projects/[id]/max-bot — Сохранение/обновление токена MAX бота
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;
    const body = await request.json();

    logger.info('[MAX] PUT /api/projects/[id]/max-bot', {
      projectId: id,
      hasToken: !!body.maxBotToken,
      component: 'max-bot-api'
    });

    const project = await ProjectService.getProjectById(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404, headers: createCorsHeaders() }
      );
    }

    if (!body.maxBotToken) {
      return NextResponse.json(
        { error: 'Токен MAX бота обязателен' },
        { status: 400, headers: createCorsHeaders() }
      );
    }

    let maxBotUsername = body.maxBotUsername || null;

    // Автоматически запрашиваем информацию о боте для получения его username
    try {
      const { Bot } = await import('@maxhub/max-bot-api');
      const tempBot = new Bot(body.maxBotToken);
      const botInfo = await tempBot.api.getMyInfo();
      if (botInfo?.username) {
        maxBotUsername = botInfo.username;
        logger.info('[MAX] Автоматически получен username бота', {
          projectId: id,
          username: maxBotUsername
        });
      }
    } catch (botInfoError) {
      logger.warn('[MAX] Не удалось автоматически получить username бота', {
        projectId: id,
        error:
          botInfoError instanceof Error
            ? botInfoError.message
            : String(botInfoError)
      });
    }

    // Сохраняем MAX токен в Project
    await (db.project as any).update({
      where: { id },
      data: {
        maxBotToken: body.maxBotToken,
        maxBotUsername
      }
    });

    // Также обновляем в BotSettings, если запись существует
    const existingBotSettings = await db.botSettings.findUnique({
      where: { projectId: id }
    });

    if (existingBotSettings) {
      await (db.botSettings as any).update({
        where: { projectId: id },
        data: {
          maxBotToken: body.maxBotToken,
          maxBotUsername
        }
      });
    }

    // Запускаем/перезапускаем MAX бота
    try {
      const { maxBotManager } = await import('@/lib/max-bot/bot-manager');

      // Останавливаем, если был запущен
      await maxBotManager.stopBot(id);

      // Запускаем с новым токеном
      await maxBotManager.createBot(id, body.maxBotToken);

      logger.info('[MAX] Бот запущен после обновления токена', {
        projectId: id,
        component: 'max-bot-api'
      });

      return NextResponse.json(
        {
          success: true,
          message: 'MAX бот успешно настроен и запущен',
          maxBotUsername,
          isRunning: true
        },
        { headers: createCorsHeaders() }
      );
    } catch (botError) {
      logger.error('[MAX] Ошибка запуска бота после обновления токена', {
        projectId: id,
        error: botError instanceof Error ? botError.message : 'Unknown',
        component: 'max-bot-api'
      });

      return NextResponse.json(
        {
          success: true,
          message:
            'Токен MAX бота сохранен, но бот не удалось запустить. Попробуйте перезагрузить.',
          maxBotUsername,
          isRunning: false,
          botError:
            botError instanceof Error ? botError.message : 'Unknown error'
        },
        { headers: createCorsHeaders() }
      );
    }
  } catch (error) {
    logger.error('[MAX] Ошибка обновления MAX бота', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { error: 'Ошибка обновления MAX бота' },
      { status: 500, headers: createCorsHeaders() }
    );
  }
}

/**
 * DELETE /api/projects/[id]/max-bot — Удаление MAX бота
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    // Останавливаем бота
    try {
      const { maxBotManager } = await import('@/lib/max-bot/bot-manager');
      await maxBotManager.stopBot(id);
    } catch {
      // Может быть не запущен
    }

    // Удаляем токен из Project
    await (db.project as any).update({
      where: { id },
      data: {
        maxBotToken: null,
        maxBotUsername: null
      }
    });

    // Удаляем из BotSettings
    const existingBotSettings = await db.botSettings.findUnique({
      where: { projectId: id }
    });

    if (existingBotSettings) {
      await (db.botSettings as any).update({
        where: { projectId: id },
        data: {
          maxBotToken: null,
          maxBotUsername: null
        }
      });
    }

    logger.info('[MAX] MAX бот удален', { projectId: id });

    return NextResponse.json(
      { success: true, message: 'MAX бот удален' },
      { headers: createCorsHeaders() }
    );
  } catch (error) {
    logger.error('[MAX] Ошибка удаления MAX бота', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { error: 'Ошибка удаления MAX бота' },
      { status: 500, headers: createCorsHeaders() }
    );
  }
}
