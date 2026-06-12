/**
 * @file: notifications/route.ts
 * @description: API для управления уведомлениями проекта
 * @project: Gupil.ru - SaaS Bonus System
 * @dependencies: @/lib/services/notification.service, @/lib/auth
 * @created: 2024-09-11
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProjectNotificationService } from '../../../../../lib/services/project-notification.service';
import { logger } from '../../../../../lib/logger';
import { withApiRateLimit } from '../../../../../lib/with-rate-limit';
import { requireProjectAccess } from '../../../../../lib/with-project-access';

async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;

    // Получаем шаблоны уведомлений
    const templates = await ProjectNotificationService.getTemplates(projectId);

    // Получаем логи уведомлений
    const logs =
      await ProjectNotificationService.getNotificationLogs(projectId);

    return NextResponse.json({
      success: true,
      data: {
        templates,
        logs
      }
    });
  } catch (error) {
    logger.error('Failed to get notifications:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

async function handlePOST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;
    const body = await request.json();

    // Валидация обязательных полей
    if (!body.channel || !body.title || !body.message) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля: channel, title, message' },
        { status: 400 }
      );
    }

    // Валидация канала
    const validChannels = ['telegram', 'email', 'sms', 'push'];
    if (!validChannels.includes(body.channel)) {
      return NextResponse.json(
        {
          error:
            'Неверный канал отправки. Допустимые: telegram, email, sms, push'
        },
        { status: 400 }
      );
    }

    // Определяем пользователей для отправки
    let userIds: string[] = [];

    if (body.userId) {
      // Отправка конкретному пользователю
      userIds = [body.userId];
    } else if (body.userIds && Array.isArray(body.userIds)) {
      // Отправка списку пользователей
      userIds = body.userIds;
    } else {
      // Отправка всем пользователям проекта
      const users = await ProjectNotificationService.getProjectUsers(projectId);
      userIds = users.map((user: any) => user.id);
    }

    if (userIds.length === 0) {
      return NextResponse.json(
        { error: 'Не найдено пользователей для отправки' },
        { status: 400 }
      );
    }

    // Отправляем уведомления массово
    // Извлекаем данные из metadata, если они там есть, иначе из body напрямую
    const imageUrl = body.metadata?.imageUrl || body.imageUrl;
    const buttons = body.metadata?.buttons || body.buttons;
    const parseMode = body.metadata?.parseMode || body.parseMode || 'Markdown';

    const result = await ProjectNotificationService.sendBulk(
      projectId,
      userIds,
      {
        type: body.type || 'custom',
        channel: body.channel as string,
        title: body.title,
        message: body.message,
        metadata: {
          imageUrl,
          buttons,
          parseMode,
          priority: body.priority || 'medium'
        }
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        sent: result.sent,
        failed: result.failed,
        total: result.total,
        results: result.results.filter((r) => !r.success) // Возвращаем только ошибки
      }
    });
  } catch (error) {
    logger.error('Failed to send notification:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Применяем rate limiting
export const GET = withApiRateLimit(handleGET);
export const POST = withApiRateLimit(handlePOST);
