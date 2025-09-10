/**
 * @file: src/lib/telegram/notifications.ts
 * @description: Система уведомлений для Telegram ботов
 * @project: SaaS Bonus System
 * @dependencies: Grammy, BotManager
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { botManager } from './bot-manager';
import type { User, Bonus, BonusType } from '@/types/bonus';

/**
 * Отправка уведомления о начислении бонусов
 */
export async function sendBonusNotification(
  user: User,
  bonus: Bonus,
  projectId: string
): Promise<void> {
  if (!user.telegramId) {
    return; // Пользователь не связан с Telegram
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
        console.log(`❌ Бот для проекта ${projectId} неактивен или не найден`);
        return;
      }
    }

    const emoji = getBonusEmoji(bonus.type);
    const typeText = getBonusTypeText(bonus.type);

    const message =
      `${emoji} *Новые бонусы начислены!*\n\n` +
      `💰 Сумма: *+${bonus.amount}₽*\n` +
      `📝 Тип: ${typeText}\n` +
      `📄 Описание: ${bonus.description || 'Без описания'}\n\n` +
      `⏰ Срок действия: ${bonus.expiresAt ? bonus.expiresAt.toLocaleDateString('ru-RU') : 'Бессрочно'}\n\n` +
      `Используйте команду /balance чтобы посмотреть актуальный баланс! 🎉`;

    await botInstance.bot.api.sendMessage(Number(user.telegramId), message, {
      parse_mode: 'Markdown'
    });

    console.log(
      `✅ Уведомление отправлено пользователю ${user.id} в Telegram (telegramId: ${user.telegramId})`
    );
  } catch (error) {
    console.error(
      `❌ Ошибка отправки уведомления пользователю ${user.id}:`,
      error
    );
    console.error(
      `Детали: projectId=${projectId}, telegramId=${user.telegramId}, botActive=${botInstance?.isActive}`
    );
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
  if (!user.telegramId) {
    return;
  }

  try {
    const botInstance = botManager.getBot(projectId);
    if (!botInstance || !botInstance.isActive) {
      return;
    }

    const message =
      `💸 *Бонусы потрачены*\n\n` +
      `💰 Сумма: *-${amount}₽*\n` +
      `📄 За: ${description}\n\n` +
      `Спасибо за покупку! Используйте /balance для проверки баланса.`;

    await botInstance.bot.api.sendMessage(Number(user.telegramId), message, {
      parse_mode: 'Markdown'
    });

    // console.log(`✅ Уведомление о списании отправлено пользователю ${user.id}`);
  } catch (error) {
    // console.error(`❌ Ошибка отправки уведомления о списании пользователю ${user.id}:`, error);
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
  if (!user.telegramId) {
    return;
  }

  try {
    const botInstance = botManager.getBot(projectId);
    if (!botInstance || !botInstance.isActive) {
      return;
    }

    const daysLeft = Math.ceil(
      (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const message =
      `⚠️ *Внимание! Бонусы скоро истекут*\n\n` +
      `💰 Сумма: *${expiringAmount}₽*\n` +
      `📅 Истекают: ${expiryDate.toLocaleDateString('ru-RU')}\n` +
      `⏰ Осталось дней: *${daysLeft}*\n\n` +
      `Поспешите воспользоваться бонусами! 🏃‍♂️`;

    await botInstance.bot.api.sendMessage(Number(user.telegramId), message, {
      parse_mode: 'Markdown'
    });

    // console.log(`✅ Предупреждение об истечении отправлено пользователю ${user.id}`);
  } catch (error) {
    // console.error(`❌ Ошибка отправки предупреждения пользователю ${user.id}:`, error);
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
      const settings = await db.botSettings.findUnique({
        where: { projectId }
      });
      if (!settings || !settings.botToken || settings.isActive === false) {
        return { sent: 0, failed: 1 };
      }
      try {
        instance = await botManager.createBot(projectId, settings as any);
      } catch {
        return { sent: 0, failed: 1 };
      }
    }

    // Готовим список пользователей
    let targetUserIds: string[];
    if (userIds && userIds.length > 0) {
      targetUserIds = userIds;
    } else {
      const dbUsers = await db.user.findMany({
        where: { projectId, telegramId: { not: null }, isActive: true },
        select: { id: true }
      });
      targetUserIds = dbUsers.map((u: { id: string }) => u.id);
    }

    if (targetUserIds.length === 0) {
      const { logger } = await import('@/lib/logger');
      logger.warn(
        'Список получателей пуст, рассылка пропущена',
        { projectId },
        'notifications'
      );
      return { sent: 0, failed: 0 };
    }

    const result = await botManager.sendRichBroadcastMessage(
      projectId,
      targetUserIds,
      notification.message,
      {
        imageUrl: notification.imageUrl,
        buttons: notification.buttons,
        parseMode: notification.parseMode || 'Markdown'
      }
    );

    return { sent: result.sentCount, failed: result.failedCount };
  } catch (error) {
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
