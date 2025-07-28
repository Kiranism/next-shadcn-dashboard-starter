/**
 * @file: telegram-bot-validation.service.ts
 * @description: Улучшенный сервис для валидации Telegram Bot токенов с проверкой статуса
 * @project: SaaS Bonus System
 * @dependencies: Grammy Bot API
 * @created: 2024-12-10
 * @updated: 2025-01-23
 * @author: AI Assistant + User
 */

import { Bot } from 'grammy';
import { logger } from '@/lib/logger';

export interface BotValidationResult {
  isValid: boolean;
  botInfo?: {
    id: number;
    username: string;
    firstName: string;
    canJoinGroups: boolean;
    canReadAllGroupMessages: boolean;
    supportsInlineQueries: boolean;
  };
  error?: string;
}

export interface BotTestResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: {
    botActive: boolean;
    webhookStatus?: string;
    lastUpdate?: string | null;
    canSendMessages?: boolean;
  };
}

export interface BotStatusInfo {
  configured: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  message: string;
  bot?: {
    id: number;
    username: string;
    firstName: string;
  };
  connection?: {
    hasWebhook: boolean;
    lastUpdate?: string | null;
    canReceiveUpdates: boolean;
  };
}

export class TelegramBotValidationService {
  /**
   * Полная проверка статуса бота (используется для API bot/status)
   */
  static async getBotStatus(token: string): Promise<BotStatusInfo> {
    try {
      if (!token) {
        return {
          configured: false,
          status: 'INACTIVE',
          message: 'Токен бота не настроен'
        };
      }

      const tempBot = new Bot(token);

      // Проверяем основную информацию о боте
      const botInfo = await tempBot.api.getMe();

      // Проверяем статус webhook
      let webhookInfo;
      try {
        webhookInfo = await tempBot.api.getWebhookInfo();
      } catch (webhookError) {
        logger.warn('Failed to get webhook info', { error: webhookError });
      }

      // Проверяем возможность получения обновлений
      let canReceiveUpdates = false;
      let lastUpdate = null;

      try {
        // Пытаемся получить последние обновления (limit=1, timeout=1)
        const updates = await tempBot.api.getUpdates({ limit: 1, timeout: 1 });
        canReceiveUpdates = true;
        if (updates.length > 0) {
          const firstUpdate = updates[0];
          if (firstUpdate.message?.date) {
            lastUpdate = new Date(
              firstUpdate.message.date * 1000
            ).toISOString();
          }
        }
      } catch (updateError: any) {
        // Если getUpdates не работает из-за webhook, это нормально
        if (updateError.message?.includes('webhook')) {
          canReceiveUpdates = true; // webhook активен, значит бот может получать обновления
        }
        logger.warn('Failed to check updates', { error: updateError.message });
      }

      logger.info('Bot status checked successfully', {
        botId: botInfo.id.toString(),
        username: botInfo.username,
        hasWebhook: webhookInfo?.url ? true : false,
        canReceiveUpdates
      });

      return {
        configured: true,
        status: 'ACTIVE',
        message: `Бот активен и работает корректно`,
        bot: {
          id: botInfo.id,
          username: botInfo.username || '',
          firstName: botInfo.first_name
        },
        connection: {
          hasWebhook: webhookInfo?.url ? true : false,
          lastUpdate,
          canReceiveUpdates
        }
      };
    } catch (error: any) {
      logger.error('Bot status check failed', {
        error: error.message,
        tokenPreview: token.substring(0, 10) + '...'
      });

      let status: 'INACTIVE' | 'ERROR' = 'ERROR';
      let message = 'Ошибка проверки статуса бота';

      if (
        error.message?.includes('401') ||
        error.message?.includes('Unauthorized')
      ) {
        status = 'INACTIVE';
        message = 'Неверный токен бота';
      } else if (
        error.message?.includes('network') ||
        error.message?.includes('timeout')
      ) {
        message = 'Ошибка сети или превышено время ожидания';
      }

      return {
        configured: true,
        status,
        message
      };
    }
  }

  /**
   * Валидация токена бота через Telegram Bot API
   */
  static async validateBotToken(token: string): Promise<BotValidationResult> {
    try {
      if (!token || !token.includes(':')) {
        return {
          isValid: false,
          error: 'Неверный формат токена. Токен должен содержать символ ":"'
        };
      }

      // Создаем временный экземпляр бота для проверки
      const tempBot = new Bot(token);

      // Получаем информацию о боте
      const botInfo = await tempBot.api.getMe();

      logger.info('Bot token validated successfully', {
        botId: botInfo.id.toString(),
        username: botInfo.username
      });

      return {
        isValid: true,
        botInfo: {
          id: botInfo.id,
          username: botInfo.username || '',
          firstName: botInfo.first_name,
          canJoinGroups: botInfo.can_join_groups || false,
          canReadAllGroupMessages: botInfo.can_read_all_group_messages || false,
          supportsInlineQueries: botInfo.supports_inline_queries || false
        }
      };
    } catch (error: any) {
      logger.error('Bot token validation failed', {
        error: error.message,
        tokenPreview: token.substring(0, 10) + '...'
      });

      let errorMessage = 'Ошибка валидации токена';

      if (error.message?.includes('401')) {
        errorMessage = 'Неверный токен бота. Проверьте токен в @BotFather';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Ошибка сети. Попробуйте позже';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Превышено время ожидания. Попробуйте позже';
      }

      return {
        isValid: false,
        error: errorMessage
      };
    }
  }

  /**
   * Улучшенное тестирование бота с проверкой всех аспектов
   */
  static async testBot(
    token: string,
    testChatId?: string
  ): Promise<BotTestResult> {
    try {
      const tempBot = new Bot(token);

      // 1. Проверяем базовую информацию о боте
      const botInfo = await tempBot.api.getMe();

      // 2. Проверяем статус webhook
      let webhookStatus = 'none';
      try {
        const webhookInfo = await tempBot.api.getWebhookInfo();
        if (webhookInfo.url) {
          webhookStatus = `active (${webhookInfo.url})`;
        } else {
          webhookStatus = 'not set';
        }
      } catch (webhookError) {
        webhookStatus = 'check failed';
      }

      // 3. Проверяем возможность получения обновлений
      let canReceiveUpdates = false;
      let lastUpdateTime = null;

      try {
        const updates = await tempBot.api.getUpdates({ limit: 1, timeout: 2 });
        canReceiveUpdates = true;
        if (updates.length > 0) {
          const firstUpdate = updates[0];
          if (firstUpdate?.message?.date) {
            lastUpdateTime = new Date(
              firstUpdate.message.date * 1000
            ).toLocaleString('ru-RU');
          }
        }
      } catch (updateError: any) {
        if (updateError.message?.includes('webhook')) {
          canReceiveUpdates = true;
          webhookStatus = 'webhook active (polling disabled)';
        }
      }

      // 4. Если указан тестовый чат, отправляем сообщение
      let canSendMessages = false;
      if (testChatId) {
        try {
          const testMessage =
            `🤖 Тест бота успешен!\n\n` +
            `📋 Информация о боте:\n` +
            `• Имя: ${botInfo.first_name}\n` +
            `• Username: @${botInfo.username}\n` +
            `• ID: ${botInfo.id}\n\n` +
            `🔗 Статус подключения:\n` +
            `• Webhook: ${webhookStatus}\n` +
            `• Получение обновлений: ${canReceiveUpdates ? '✅' : '❌'}\n` +
            `${lastUpdateTime ? `• Последнее обновление: ${lastUpdateTime}\n` : ''}` +
            `\n⏰ Время теста: ${new Date().toLocaleString('ru-RU')}`;

          await tempBot.api.sendMessage(testChatId, testMessage);
          canSendMessages = true;

          logger.info('Bot test message sent successfully', {
            chatId: testChatId,
            botUsername: botInfo.username
          });
        } catch (sendError: any) {
          logger.warn('Failed to send test message', {
            error: sendError.message,
            chatId: testChatId
          });

          if (sendError.message?.includes('chat not found')) {
            throw new Error(
              'Чат не найден. Убедитесь, что ID чата указан корректно'
            );
          } else if (sendError.message?.includes('Forbidden')) {
            throw new Error(
              'Бот не имеет прав для отправки сообщений в этот чат'
            );
          } else {
            throw sendError;
          }
        }
      }

      return {
        success: true,
        message: testChatId
          ? `Тест прошел успешно! Сообщение отправлено в чат ${testChatId}`
          : `Бот @${botInfo.username} настроен и готов к работе`,
        details: {
          botActive: true,
          webhookStatus,
          lastUpdate: lastUpdateTime,
          canSendMessages
        }
      };
    } catch (error: any) {
      logger.error('Bot test failed', {
        error: error.message,
        chatId: testChatId,
        tokenPreview: token.substring(0, 10) + '...'
      });

      return {
        success: false,
        error: error.message,
        details: {
          botActive: false,
          canSendMessages: false
        }
      };
    }
  }

  /**
   * Получение информации о боте без создания постоянного экземпляра
   */
  static async getBotInfo(token: string) {
    try {
      const tempBot = new Bot(token);
      const botInfo = await tempBot.api.getMe();

      return {
        id: botInfo.id,
        username: botInfo.username || '',
        firstName: botInfo.first_name,
        isBot: botInfo.is_bot
      };
    } catch (error: any) {
      logger.error('Failed to get bot info', {
        error: error.message,
        tokenPreview: token.substring(0, 10) + '...'
      });
      throw error;
    }
  }

  /**
   * Установка команд бота
   */
  static async setBotCommands(token: string) {
    try {
      const tempBot = new Bot(token);

      const commands = [
        { command: 'start', description: '🚀 Начать работу с ботом' },
        { command: 'balance', description: '💰 Проверить баланс бонусов' },
        { command: 'history', description: '📊 История операций' },
        { command: 'level', description: '⭐ Текущий уровень и прогресс' },
        { command: 'referral', description: '👥 Реферальная программа' },
        { command: 'invite', description: '🔗 Пригласить друга' },
        { command: 'help', description: '❓ Помощь и поддержка' }
      ];

      await tempBot.api.setMyCommands(commands);

      logger.info('Bot commands set successfully', {
        tokenPreview: token.substring(0, 10) + '...',
        commandsCount: commands.length
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to set bot commands', {
        error: error.message,
        tokenPreview: token.substring(0, 10) + '...'
      });
      throw error;
    }
  }
}
