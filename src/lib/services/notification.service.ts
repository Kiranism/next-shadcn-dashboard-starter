/**
 * @file: notification.service.ts
 * @description: Сервис для управления уведомлениями
 * @project: Gupil.ru - SaaS Bonus System
 * @dependencies: @/lib/db, @/types/notification, @/lib/telegram/notifications
 * @created: 2024-09-11
 * @author: AI Assistant + User
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationTemplate,
  NotificationSettings,
  NotificationLog,
  NotificationPayload
} from '@/types/notification';

export class NotificationService {
  /**
   * Отправка уведомления с автоматическим выбором канала
   */
  static async sendNotification(
    payload: NotificationPayload
  ): Promise<NotificationLog[]> {
    const logs: NotificationLog[] = [];

    try {
      // Получаем настройки уведомлений для проекта/пользователя
      const settings = await this.getNotificationSettings(
        payload.projectId,
        payload.userId
      );

      // Проверяем, разрешен ли этот тип уведомлений
      if (!settings.types[payload.type]) {
        logger.info(
          `Notification type ${payload.type} disabled for project ${payload.projectId}`
        );
        return logs;
      }

      // Определяем каналы для отправки
      const channels = this.getAvailableChannels(settings, payload.channel);

      for (const channel of channels) {
        try {
          const log = await this.sendToChannel(payload, channel);
          logs.push(log);
        } catch (error) {
          logger.error(`Failed to send notification to ${channel}:`, {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          logs.push({
            id: `failed_${Date.now()}_${channel}`,
            projectId: payload.projectId,
            userId: payload.userId,
            type: payload.type,
            channel,
            title: payload.title,
            message: payload.message,
            status: 'failed',
            priority: payload.priority || NotificationPriority.NORMAL,
            error: error instanceof Error ? error.message : 'Unknown error',
            createdAt: new Date()
          });
        }
      }

      return logs;
    } catch (error) {
      logger.error('Failed to send notification:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Отправка уведомления в конкретный канал
   */
  private static async sendToChannel(
    payload: NotificationPayload,
    channel: NotificationChannel
  ): Promise<NotificationLog> {
    const logId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Создаем запись в логе
    const log: NotificationLog = {
      id: logId,
      projectId: payload.projectId,
      userId: payload.userId,
      type: payload.type,
      channel,
      title: payload.title,
      message: payload.message,
      status: 'pending',
      priority: payload.priority || NotificationPriority.NORMAL,
      metadata: payload.metadata,
      createdAt: new Date()
    };

    try {
      // Отправляем в зависимости от канала
      switch (channel) {
        case NotificationChannel.TELEGRAM:
          await this.sendTelegramNotification(payload);
          break;
        case NotificationChannel.EMAIL:
          await this.sendEmailNotification(payload);
          break;
        case NotificationChannel.SMS:
          await this.sendSmsNotification(payload);
          break;
        case NotificationChannel.PUSH:
          await this.sendPushNotification(payload);
          break;
      }

      log.status = 'sent';
      log.sentAt = new Date();

      logger.info(`Notification sent successfully via ${channel}`, {
        logId,
        projectId: payload.projectId
      });

      // Фиксируем лог уведомления в БД
      try {
        await db.notification.create({
          data: {
            projectId: payload.projectId,
            userId: payload.userId || null,
            channel,
            title: payload.title,
            message: payload.message,
            metadata: {
              type: payload.type,
              priority: payload.priority || NotificationPriority.NORMAL
            },
            sentAt: log.sentAt
          }
        });
      } catch (persistError) {
        logger.error('Failed to persist notification log', {
          error:
            persistError instanceof Error
              ? persistError.message
              : 'Unknown error'
        });
      }
    } catch (error) {
      log.status = 'failed';
      log.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to send notification via ${channel}:`, {
        error: log.error
      });

      // Пишем неудачную попытку в БД для аудита
      try {
        await db.notification.create({
          data: {
            projectId: payload.projectId,
            userId: payload.userId || null,
            channel,
            title: payload.title,
            message: payload.message,
            metadata: {
              type: payload.type,
              priority: payload.priority || NotificationPriority.NORMAL,
              error: log.error
            }
          }
        });
      } catch (persistError) {
        logger.error('Failed to persist failed notification log', {
          error:
            persistError instanceof Error
              ? persistError.message
              : 'Unknown error'
        });
      }
    }

    return log;
  }

  /**
   * Отправка Telegram уведомления
   */
  private static async sendTelegramNotification(
    payload: NotificationPayload
  ): Promise<void> {
    if (!payload.userId) {
      throw new Error('User ID required for Telegram notifications');
    }

    // Получаем пользователя из БД
    const { db } = await import('@/lib/db');
    const user = await db.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || !user.telegramId) {
      throw new Error('User not found or not linked to Telegram');
    }

    // Создаем временный объект бонуса для совместимости с существующей функцией
    const mockBonus = {
      id: 'notification',
      amount: 0,
      type: 'manual' as any,
      description: payload.message,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    };

    const { sendBonusNotification } = await import(
      '@/lib/telegram/notifications'
    );

    await sendBonusNotification(
      user as any,
      mockBonus as any,
      payload.projectId
    );
  }

  /**
   * Отправка Email уведомления (заглушка)
   */
  private static async sendEmailNotification(
    payload: NotificationPayload
  ): Promise<void> {
    // Заглушка: реальная отправка не настроена. Логируем и считаем отправленным.
    logger.info('Email notification (stub) sent:', {
      to: payload.userId,
      title: payload.title
    });
  }

  /**
   * Отправка SMS уведомления (заглушка)
   */
  private static async sendSmsNotification(
    payload: NotificationPayload
  ): Promise<void> {
    // Заглушка: реальная отправка не настроена. Логируем и считаем отправленным.
    logger.info('SMS notification (stub) sent:', {
      to: payload.userId,
      title: payload.title
    });
  }

  /**
   * Отправка Push уведомления (заглушка)
   */
  private static async sendPushNotification(
    payload: NotificationPayload
  ): Promise<void> {
    // Заглушка: реальная отправка не настроена. Логируем и считаем отправленным.
    logger.info('Push notification (stub) sent:', {
      to: payload.userId,
      title: payload.title
    });
  }

  /**
   * Получение настроек уведомлений
   */
  static async getNotificationSettings(
    projectId: string,
    userId?: string
  ): Promise<NotificationSettings> {
    // TODO: Реализовать получение настроек из БД
    // Пока возвращаем дефолтные настройки
    return {
      projectId,
      userId,
      channels: {
        [NotificationChannel.TELEGRAM]: true,
        [NotificationChannel.EMAIL]: false,
        [NotificationChannel.SMS]: false,
        [NotificationChannel.PUSH]: false
      },
      types: {
        [NotificationType.BONUS_EARNED]: true,
        [NotificationType.BONUS_SPENT]: true,
        [NotificationType.REFERRAL_BONUS]: true,
        [NotificationType.WELCOME_BONUS]: true,
        [NotificationType.LEVEL_UP]: true,
        [NotificationType.PURCHASE_COMPLETED]: true,
        [NotificationType.SYSTEM_ANNOUNCEMENT]: true,
        [NotificationType.PROMOTION]: false
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      },
      frequency: {
        maxPerDay: 10,
        maxPerHour: 3
      }
    };
  }

  /**
   * Определение доступных каналов для отправки
   */
  private static getAvailableChannels(
    settings: NotificationSettings,
    preferredChannel?: NotificationChannel
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = [];

    // Если указан предпочтительный канал и он включен
    if (preferredChannel && settings.channels[preferredChannel]) {
      channels.push(preferredChannel);
    } else {
      // Иначе используем все включенные каналы
      Object.entries(settings.channels).forEach(([channel, enabled]) => {
        if (enabled) {
          channels.push(channel as NotificationChannel);
        }
      });
    }

    return channels;
  }

  /**
   * Получение шаблонов уведомлений для проекта
   */
  static async getTemplates(
    projectId: string
  ): Promise<NotificationTemplate[]> {
    // TODO: Реализовать получение шаблонов из БД
    return this.getDefaultTemplates();
  }

  /**
   * Дефолтные шаблоны уведомлений
   */
  private static getDefaultTemplates(): NotificationTemplate[] {
    return [
      {
        id: 'bonus_earned_default',
        type: NotificationType.BONUS_EARNED,
        channel: NotificationChannel.TELEGRAM,
        title: '🎉 Бонус начислен!',
        message:
          'Вам начислено {{bonusAmount}} бонусов за покупку. Ваш баланс: {{totalBalance}} бонусов.',
        variables: ['bonusAmount', 'totalBalance'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'referral_bonus_default',
        type: NotificationType.REFERRAL_BONUS,
        channel: NotificationChannel.TELEGRAM,
        title: '👥 Реферальный бонус!',
        message:
          'Вы получили {{bonusAmount}} бонусов за приглашение друга {{friendName}}. Продолжайте приглашать!',
        variables: ['bonusAmount', 'friendName'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'welcome_bonus_default',
        type: NotificationType.WELCOME_BONUS,
        channel: NotificationChannel.TELEGRAM,
        title: '🎁 Добро пожаловать!',
        message:
          'Добро пожаловать в нашу бонусную программу! Вам начислен приветственный бонус {{bonusAmount}} бонусов.',
        variables: ['bonusAmount'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'level_up_default',
        type: NotificationType.LEVEL_UP,
        channel: NotificationChannel.TELEGRAM,
        title: '⭐ Новый уровень!',
        message:
          'Поздравляем! Вы достигли уровня {{levelName}} и получили {{bonusAmount}} бонусов.',
        variables: ['levelName', 'bonusAmount'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Подстановка переменных в шаблон
   */
  static processTemplate(
    template: NotificationTemplate,
    variables: Record<string, any>
  ): { title: string; message: string } {
    let title = template.title;
    let message = template.message;

    // Подставляем переменные
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return { title, message };
  }

  /**
   * Получение логов уведомлений
   */
  static async getNotificationLogs(
    projectId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationLog[]> {
    const rows = await db.notification.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return rows.map((n) => ({
      id: n.id,
      projectId: n.projectId,
      userId: n.userId || undefined,
      type:
        (n.metadata as any)?.type || NotificationType.SYSTEM_ANNOUNCEMENT,
      channel: n.channel as NotificationChannel,
      title: n.title,
      message: n.message,
      status: 'sent',
      priority:
        (n.metadata as any)?.priority || NotificationPriority.NORMAL,
      sentAt: n.sentAt || undefined,
      createdAt: n.createdAt,
      metadata: (n.metadata as Record<string, any>) || undefined
    }));
  }
}
