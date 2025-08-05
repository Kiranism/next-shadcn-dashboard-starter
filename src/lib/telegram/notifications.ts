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

  try {
    const botInstance = botManager.getBot(projectId);
    if (!botInstance || !botInstance.isActive) {
      // console.log(`Бот для проекта ${projectId} неактивен или не найден`);
      return;
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

    // console.log(`✅ Уведомление отправлено пользователю ${user.id} в Telegram`);
  } catch (error) {
    // console.error(`❌ Ошибка отправки уведомления пользователю ${user.id}:`, error);
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
    const botInstance = botManager.getBot(projectId);

    if (!botInstance || !botInstance.isActive) {
      return { sent: 0, failed: 0 };
    }

    // Получаем пользователей из базы данных
    let users: User[] = [];
    if (userIds && userIds.length > 0) {
      users = (await db.user.findMany({
        where: {
          id: { in: userIds },
          projectId,
          telegramId: { not: null },
          isActive: true
        }
      })) as User[];
    } else {
      users = (await db.user.findMany({
        where: {
          projectId,
          telegramId: { not: null },
          isActive: true
        }
      })) as User[];
    }

    let sent = 0;
    let failed = 0;

    // Создаем клавиатуру если есть кнопки
    let replyMarkup;
    if (notification.buttons && notification.buttons.length > 0) {
      const keyboard = notification.buttons.map((button) => {
        if (button.url) {
          return [{ text: button.text, url: button.url }];
        } else if (button.callback_data) {
          return [{ text: button.text, callback_data: button.callback_data }];
        }
        return [{ text: button.text, callback_data: 'no_action' }];
      });

      replyMarkup = { inline_keyboard: keyboard };
    }

    for (const user of users) {
      if (user.telegramId) {
        try {
          const telegramId = Number(user.telegramId);

          if (notification.imageUrl) {
            // Отправляем фото с текстом
            await botInstance.bot.api.sendPhoto(
              telegramId,
              notification.imageUrl,
              {
                caption: notification.message,
                parse_mode: notification.parseMode || 'Markdown',
                reply_markup: replyMarkup
              }
            );
          } else {
            // Отправляем обычное текстовое сообщение
            await botInstance.bot.api.sendMessage(
              telegramId,
              notification.message,
              {
                parse_mode: notification.parseMode || 'Markdown',
                reply_markup: replyMarkup
              }
            );
          }

          sent++;

          // Небольшая задержка чтобы не превысить лимиты Telegram API
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (error) {
          console.error(`Ошибка отправки пользователю ${user.id}:`, error);
          failed++;
        }
      }
    }

    console.log(`📢 Рассылка завершена: отправлено ${sent}, ошибок ${failed}`);
    return { sent, failed };
  } catch (error) {
    console.error('Ошибка массовой рассылки:', error);
    return { sent: 0, failed: 0 };
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
