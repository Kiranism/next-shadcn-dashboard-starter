/**
 * @file: src/lib/telegram/notifications.ts
 * @description: Система уведомлений для Telegram ботов
 * @project: SaaS Bonus System
 * @dependencies: Grammy, BotManager
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { botManager } from './bot-manager';
import { maxBotManager } from '../max-bot/bot-manager';
import type { User, Bonus, BonusType } from '@/types/bonus';
import { logger } from '@/lib/logger';

/**
 * Отправка уведомления о начислении бонусов
 */
export async function sendBonusNotification(
  user: User,
  bonus: Bonus,
  projectId: string
): Promise<void> {
  if (!user.telegramId && !user.maxId) {
    return; // Пользователь не связан ни с одной платформой
  }

  let botInstance = botManager.getBot(projectId);
  try {
    if (!botInstance || !botInstance.isActive) {
      // пробуем автоинициализировать по настройкам проекта
      try {
        const { db } = await import('@/lib/db');
        const settings = await db.botSettings.findUnique({
          where: { projectId }
        });
        if (settings?.botToken && settings.isActive !== false) {
          botInstance = await botManager.createBot(projectId, settings as any);
        }
      } catch (e) {
        // ignore, отрепортим ниже
      }
      if (!botInstance || !botInstance.isActive) {
        logger.warn(`Бот для проекта ${projectId} неактивен или не найден`);
        return;
      }
    }

    const emoji = getBonusEmoji(bonus.type);
    const typeText = getBonusTypeText(bonus.type);

    // Phase 5.6: для реферальной комиссии обогащаем текст именем клиента
    // и уровнем (если они есть в bonus.metadata / на самом бонусе).
    let message: string;
    if (bonus.type === 'REFERRAL') {
      const meta =
        ((bonus as any).metadata as Record<string, any> | null) || {};
      const referredUserId: string | undefined =
        meta.referredUserId ||
        meta.sourceUserId ||
        (bonus as any).referralUserId ||
        undefined;
      const level: number | undefined =
        meta.level ?? (bonus as any).referralLevel ?? undefined;

      let clientName = 'клиента';
      if (referredUserId) {
        try {
          const { db } = await import('@/lib/db');
          const ref = await db.user.findUnique({
            where: { id: referredUserId },
            select: { firstName: true, lastName: true, phone: true }
          });
          if (ref) {
            const fn = (ref.firstName ?? '').trim();
            const ln = (ref.lastName ?? '').trim();
            const full = `${fn} ${ln}`.trim();
            clientName = full || ref.phone || clientName;
          }
        } catch (err) {
          // Не падаем — оставляем дефолт «клиента».
          logger.warn('Не удалось загрузить имя клиента-источника', {
            referredUserId,
            err: err instanceof Error ? err.message : String(err)
          });
        }
      }
      const levelStr = level ? ` (уровень ${level})` : '';
      message = `💰 *Вам начислено ${bonus.amount} ₽ за покупку клиента ${clientName}${levelStr}*`;
    } else {
      message =
        `${emoji} *Новые бонусы начислены!*\n\n` +
        `💰 Сумма: *+${bonus.amount} бонусов*\n` +
        `📝 Тип: ${typeText}\n` +
        `📄 Описание: ${bonus.description || 'Без описания'}\n\n` +
        `⏰ Срок действия: ${bonus.expiresAt ? bonus.expiresAt.toLocaleDateString('ru-RU') : 'Бессрочно'}`;
    }

    // Отправляем в Telegram если есть ID
    if (user.telegramId && botInstance && botInstance.isActive) {
      await botInstance.bot.api.sendMessage(Number(user.telegramId), message, {
        parse_mode: 'Markdown'
      });
      logger.info(`Уведомление отправлено пользователю ${user.id} в Telegram`, {
        telegramId: user.telegramId,
        projectId
      });
    }

    // Отправляем в MAX если есть ID
    if (user.maxId) {
      await maxBotManager.sendMessageToUser(
        projectId,
        Number(user.maxId),
        message.replace(/\*/g, '') // MAX может не поддерживать Markdown в таком виде, упрощаем
      );
      logger.info(`Уведомление отправлено пользователю ${user.id} в MAX`, {
        maxId: user.maxId,
        projectId
      });
    }
  } catch (error) {
    logger.error(`Ошибка отправки уведомления пользователю ${user.id}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      projectId,
      telegramId: user.telegramId,
      botActive: botInstance?.isActive
    });
  }
}

/**
 * Отправка уведомления о списании бонусов
 */
export async function sendBonusSpentNotification(
  user: User,
  amount: number,
  description: string,
  projectId: string
): Promise<void> {
  try {
    const message =
      `💸 *Бонусы потрачены*\n\n` +
      `💰 Сумма: *-${amount} бонусов*\n` +
      `📄 За: ${description}\n\n` +
      `Спасибо за покупку!`;

    // Telegram
    if (user.telegramId) {
      const botInstance = botManager.getBot(projectId);
      if (botInstance && botInstance.isActive) {
        await botInstance.bot.api.sendMessage(
          Number(user.telegramId),
          message,
          {
            parse_mode: 'Markdown'
          }
        );
      }
    }

    // MAX
    if (user.maxId) {
      await maxBotManager.sendMessageToUser(
        projectId,
        Number(user.maxId),
        message.replace(/\*/g, '')
      );
    }
  } catch (error) {
    logger.error(
      `Ошибка отправки уведомления о списании пользователю ${user.id}`,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        projectId
      }
    );
  }
}

/**
 * Отправка уведомления о скором истечении бонусов
 */
export async function sendBonusExpiryWarning(
  user: User,
  expiringAmount: number,
  expiryDate: Date,
  projectId: string
): Promise<void> {
  try {
    const daysLeft = Math.ceil(
      (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const message =
      `⚠️ *Внимание! Бонусы скоро истекут*\n\n` +
      `💰 Сумма: *${expiringAmount} бонусов*\n` +
      `📅 Истекают: ${expiryDate.toLocaleDateString('ru-RU')}\n` +
      `⏰ Осталось дней: *${daysLeft}*\n\n` +
      `Поспешите воспользоваться бонусами! 🏃‍♂️`;

    // Telegram
    if (user.telegramId) {
      const botInstance = botManager.getBot(projectId);
      if (botInstance && botInstance.isActive) {
        await botInstance.bot.api.sendMessage(
          Number(user.telegramId),
          message,
          {
            parse_mode: 'Markdown'
          }
        );
      }
    }

    // MAX
    if (user.maxId) {
      await maxBotManager.sendMessageToUser(
        projectId,
        Number(user.maxId),
        message.replace(/\*/g, '')
      );
    }
  } catch (error) {
    logger.error(
      `Ошибка отправки предупреждения об истечении пользователю ${user.id}`,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        projectId
      }
    );
  }
}

/**
 * Интерфейс для расширенного уведомления
 */
export interface RichNotification {
  message: string;
  imageUrl?: string;
  buttons?: Array<{
    text: string;
    url?: string;
    callback_data?: string;
  }>;
  parseMode?: 'Markdown' | 'HTML';
}

/**
 * Массовая отправка уведомлений всем пользователям проекта
 */
export async function sendBroadcastMessage(
  projectId: string,
  message: string,
  userIds?: string[]
): Promise<{ sent: number; failed: number }> {
  return sendRichBroadcastMessage(projectId, { message }, userIds);
}

/**
 * Расширенная массовая рассылка с поддержкой медиа и кнопок
 */
export async function sendRichBroadcastMessage(
  projectId: string,
  notification: RichNotification,
  userIds?: string[]
): Promise<{ sent: number; failed: number }> {
  try {
    const { db } = await import('@/lib/db');

    // Проверяем/создаём активного бота через BotManager
    let instance = botManager.getBot(projectId);
    if (!instance || !instance.isActive) {
      const settings = (await db.botSettings.findUnique({
        where: { projectId }
      })) as any;
      if (settings?.botToken && settings?.isActive !== false) {
        try {
          instance = await botManager.createBot(projectId, settings);
        } catch (e) {
          // ignore
        }
      }
    }

    // Выполняем рассылку Telegram
    let telegramResult = { sentCount: 0, failedCount: 0 };
    if (instance && instance.isActive) {
      const telegramUserIds =
        userIds && userIds.length > 0
          ? userIds
          : (
              await db.user.findMany({
                where: { projectId, telegramId: { not: null }, isActive: true },
                select: { id: true }
              })
            ).map((u: { id: string }) => u.id);

      if (telegramUserIds.length > 0) {
        telegramResult = await botManager.sendRichBroadcastMessage(
          projectId,
          telegramUserIds,
          notification.message,
          {
            imageUrl: notification.imageUrl,
            buttons: notification.buttons,
            parseMode: notification.parseMode || 'Markdown'
          }
        );
      }
    }

    // Выполняем рассылку MAX
    let maxResult = { sentCount: 0, failedCount: 0 };
    const maxUserIds =
      userIds && userIds.length > 0
        ? userIds
        : (
            await db.user.findMany({
              where: { projectId, maxId: { not: null }, isActive: true },
              select: { id: true }
            })
          ).map((u: { id: string }) => u.id);

    if (maxUserIds.length > 0) {
      maxResult = await maxBotManager.sendRichBroadcastMessage(
        projectId,
        maxUserIds,
        notification.message,
        {
          buttons: notification.buttons?.map((b) => ({
            text: b.text,
            url: b.url,
            payload: b.callback_data
          }))
        }
      );
    }

    return {
      sent: telegramResult.sentCount + maxResult.sentCount,
      failed: telegramResult.failedCount + maxResult.failedCount
    };
  } catch (error) {
    logger.error('Ошибка массовой рассылки (Telegram + MAX)', {
      error: error instanceof Error ? error.message : 'Unknown error',
      projectId
    });
    return { sent: 0, failed: 1 };
  }
}

// Утилитарные функции
function getBonusEmoji(type: BonusType): string {
  switch (type) {
    case 'PURCHASE':
      return '🛒';
    case 'BIRTHDAY':
      return '🎂';
    case 'MANUAL':
      return '👨‍💼';
    case 'REFERRAL':
      return '👥';
    case 'PROMO':
      return '🎁';
    default:
      return '💰';
  }
}

function getBonusTypeText(type: BonusType): string {
  switch (type) {
    case 'PURCHASE':
      return 'За покупку';
    case 'BIRTHDAY':
      return 'День рождения';
    case 'MANUAL':
      return 'Ручное начисление';
    case 'REFERRAL':
      return 'Реферальная программа';
    case 'PROMO':
      return 'Промоакция';
    default:
      return 'Бонус';
  }
}
