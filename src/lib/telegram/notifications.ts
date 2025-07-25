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

    await botInstance.bot.api.sendMessage(
      Number(user.telegramId),
      message,
      { parse_mode: 'Markdown' }
    );

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

    await botInstance.bot.api.sendMessage(
      Number(user.telegramId),
      message,
      { parse_mode: 'Markdown' }
    );

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

    const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    const message = 
      `⚠️ *Внимание! Бонусы скоро истекут*\n\n` +
      `💰 Сумма: *${expiringAmount}₽*\n` +
      `📅 Истекают: ${expiryDate.toLocaleDateString('ru-RU')}\n` +
      `⏰ Осталось дней: *${daysLeft}*\n\n` +
      `Поспешите воспользоваться бонусами! 🏃‍♂️`;

    await botInstance.bot.api.sendMessage(
      Number(user.telegramId),
      message,
      { parse_mode: 'Markdown' }
    );

    // console.log(`✅ Предупреждение об истечении отправлено пользователю ${user.id}`);
  } catch (error) {
    // console.error(`❌ Ошибка отправки предупреждения пользователю ${user.id}:`, error);
  }
}

/**
 * Массовая отправка уведомлений всем пользователям проекта
 */
export async function sendBroadcastMessage(
  projectId: string,
  message: string,
  userIds?: string[]
): Promise<{ sent: number; failed: number }> {
  try {
    const botInstance = botManager.getBot(projectId);
    if (!botInstance || !botInstance.isActive) {
      return { sent: 0, failed: 0 };
    }

    // Если не указаны конкретные пользователи, получаем всех активных с Telegram ID
    let users: User[] = [];
    if (userIds) {
      // Здесь должен быть запрос к базе для получения пользователей по ID
      // Для простоты пропускаем реализацию
    } else {
      // Здесь должен быть запрос всех активных пользователей проекта с telegramId
      // Для простоты пропускаем реализацию
    }

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      if (user.telegramId) {
        try {
          await botInstance.bot.api.sendMessage(
            Number(user.telegramId),
            message,
            { parse_mode: 'Markdown' }
          );
          sent++;
        } catch (error) {
          // TODO: логгер
          // console.error(`Ошибка отправки пользователю ${user.id}:`, error);
          failed++;
        }
      }
    }

    // TODO: логгер
    // console.log(`📢 Рассылка завершена: отправлено ${sent}, ошибок ${failed}`);
    return { sent, failed };
  } catch (error) {
    // TODO: логгер
    // console.error('Ошибка массовой рассылки:', error);
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