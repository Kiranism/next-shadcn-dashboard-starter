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
import { withApiRateLimit } from '@/lib';

async function handleGET(
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

async function handlePOST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    // Валидация типа уведомления
    if (!body.type || !Object.values(NotificationType).includes(body.type)) {
      return NextResponse.json(
        { error: 'Неверный тип уведомления' },
        { status: 400 }
      );
    }

    // Валидация типа канала
    if (
      !body.channel ||
      !Object.values(NotificationChannel).includes(body.channel)
    ) {
      return NextResponse.json(
        { error: 'Неверный канал отправки' },
        { status: 400 }
      );
    }

    // Валидация обязательных полей
    if (!body.title || !body.message) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля: title, message' },
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
      const users = await NotificationService.getProjectUsers(projectId);
      userIds = users.map((user: { id: string }) => user.id);
    }

    // Готовим данные для отправки
    const notificationData = {
      type: body.type as NotificationType,
      channel: body.channel as NotificationChannel,
      priority: body.priority || NotificationPriority.MEDIUM,
      title: body.title,
      message: body.message,
      imageUrl: body.imageUrl,
      buttons: body.buttons
    };

    // Отправляем уведомления
    const results = await Promise.all(
      userIds.map((userId) =>
        NotificationService.send({
          ...notificationData,
          userId,
          projectId
        })
      )
    );

    // Подсчитываем результаты
    const sent = results.filter((r: { success: boolean }) => r.success).length;
    const failed = results.filter(
      (r: { success: boolean }) => !r.success
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        sent,
        failed,
        total: userIds.length,
        results: results.filter((r: { success: boolean }) => !r.success) // Возвращаем только ошибки
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
