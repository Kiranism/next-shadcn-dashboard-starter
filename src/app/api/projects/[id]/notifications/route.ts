/**
 * @file: notifications/route.ts
 * @description: API для управления уведомлениями проекта
 * @project: Gupil.ru - SaaS Bonus System
 * @dependencies: @/lib/services/notification.service, @/lib/auth
 * @created: 2024-09-11
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification.service';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority
} from '@/types/notification';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Получаем шаблоны уведомлений
    const templates = await NotificationService.getTemplates(projectId);

    // Получаем логи уведомлений
    const logs = await NotificationService.getNotificationLogs(projectId);

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    const {
      userId,
      type,
      channel = NotificationChannel.TELEGRAM,
      title,
      message,
      priority = NotificationPriority.NORMAL,
      variables = {},
      metadata = {}
    } = body;

    // Валидация обязательных полей
    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля: type, title, message' },
        { status: 400 }
      );
    }

    // Валидация типа уведомления
    if (!Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { error: 'Недопустимый тип уведомления' },
        { status: 400 }
      );
    }

    // Валидация канала
    if (!Object.values(NotificationChannel).includes(channel)) {
      return NextResponse.json(
        { error: 'Недопустимый канал уведомления' },
        { status: 400 }
      );
    }

    // Если userId не указан, отправляем рассылку всем пользователям проекта
    if (!userId && channel === NotificationChannel.TELEGRAM) {
      const { sendRichBroadcastMessage } = await import(
        '@/lib/telegram/notifications'
      );

      const result = await sendRichBroadcastMessage(projectId, {
        message: `${title}\n\n${message}`,
        imageUrl: metadata.imageUrl,
        parseMode: metadata.parseMode || 'Markdown'
      });

      return NextResponse.json({
        success: true,
        data: {
          result,
          message: 'Рассылка отправлена'
        }
      });
    }

    // Отправляем уведомление конкретному пользователю
    const logs = await NotificationService.sendNotification({
      projectId,
      userId,
      type,
      channel,
      title,
      message,
      priority,
      variables,
      metadata
    });

    return NextResponse.json({
      success: true,
      data: {
        logs,
        message: 'Уведомление отправлено'
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
