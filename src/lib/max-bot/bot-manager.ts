/**
 * @file: src/lib/max-bot/bot-manager.ts
 * @description: Менеджер для управления экземплярами MAX ботов
 * @project: SaaS Bonus System
 * @dependencies: @maxhub/max-bot-api
 * @created: 2026-03-22
 * @author: AI Assistant + User
 */

import { Bot, Keyboard } from '@maxhub/max-bot-api';
import { createMaxBot } from './bot';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

function resolvePublicBaseUrl(): { url: string; source: string } {
  const entries: ReadonlyArray<readonly [string, string | undefined]> = [
    ['WEBHOOK_BASE_URL', process.env.WEBHOOK_BASE_URL],
    ['NEXT_PUBLIC_APP_URL', process.env.NEXT_PUBLIC_APP_URL],
    ['APP_URL', process.env.APP_URL]
  ];
  const normalized = entries.map(
    ([key, val]) => [key, (val ?? '').trim()] as readonly [string, string]
  );
  const https = normalized.find(([, v]) => v.startsWith('https://'));
  if (https?.[1]) {
    return { url: https[1], source: https[0] };
  }
  const any = normalized.find(([, v]) => v.length > 0);
  if (any?.[1]) {
    return { url: any[1], source: any[0] };
  }
  return { url: 'http://localhost:5006', source: 'default' };
}

interface MaxBotInstance {
  bot: Bot;
  isActive: boolean;
  projectId: string;
  lastUpdated: Date;
  isPolling?: boolean;
}

/**
 * Менеджер для управления экземплярами MAX ботов.
 * Аналог BotManager из @/lib/telegram/bot-manager, но для платформы MAX.
 * MAX боты могут работать через Webhook в продакшене или long polling в локальной разработке.
 */
class MaxBotManager {
  private bots: Map<string, MaxBotInstance> = new Map();
  private readonly operationLocks: Map<string, Promise<any>> = new Map();

  get webhookBaseUrl(): string {
    return resolvePublicBaseUrl().url;
  }

  constructor() {
    logger.info('[MAX] MaxBotManager инициализирован', {
      webhookBaseUrl: this.webhookBaseUrl,
      component: 'max-bot-manager'
    });
  }

  /**
   * Получение экземпляра MAX бота по projectId
   */
  getBot(projectId: string): MaxBotInstance | undefined {
    return this.bots.get(projectId);
  }

  /**
   * Получение состояния всех MAX ботов
   */
  getAllBotsStatus(): Array<{
    projectId: string;
    isActive: boolean;
  }> {
    return Array.from(this.bots.entries()).map(([projectId, instance]) => ({
      projectId,
      isActive: instance.isActive
    }));
  }

  /**
   * Получение всех активных MAX ботов
   */
  getAllBots(): Array<[string, MaxBotInstance]> {
    return Array.from(this.bots.entries());
  }

  /**
   * Статистика MAX ботов
   */
  getStats(): { total: number; active: number; inactive: number } {
    let active = 0;
    let inactive = 0;
    for (const [, instance] of this.bots) {
      if (instance.isActive) active++;
      else inactive++;
    }
    return { total: this.bots.size, active, inactive };
  }

  /**
   * Создание и запуск MAX бота
   */
  async createBot(
    projectId: string,
    maxBotToken: string
  ): Promise<MaxBotInstance> {
    // Проверяем, не выполняется ли уже операция
    const existingOperation = this.operationLocks.get(projectId);
    if (existingOperation) {
      logger.info('[MAX] Операция создания бота уже выполняется, ожидаем', {
        projectId,
        component: 'max-bot-manager'
      });
      return existingOperation;
    }

    const operation = this._createBotInternal(projectId, maxBotToken);
    this.operationLocks.set(projectId, operation);

    try {
      return await operation;
    } finally {
      this.operationLocks.delete(projectId);
    }
  }

  private async _createBotInternal(
    projectId: string,
    maxBotToken: string
  ): Promise<MaxBotInstance> {
    try {
      logger.info(`🚀 [MAX] СОЗДАНИЕ БОТА ${projectId}`, {
        projectId,
        token: '***' + maxBotToken.slice(-4),
        component: 'max-bot-manager'
      });

      // Останавливаем существующий бот, если есть
      await this.stopBot(projectId, false);

      // Задержка для избежания конфликтов
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Создаём бота через фабрику
      const bot = createMaxBot(maxBotToken, projectId);

      // Определение режима: Webhook или Polling
      const isWebhookCapable = this.webhookBaseUrl.startsWith('https://');
      const isLocalDevelopment = process.env.NODE_ENV === 'development';
      
      let useWebhook = !isLocalDevelopment && isWebhookCapable;
      if (process.env.MAX_BOT_USE_WEBHOOK !== undefined) {
        useWebhook = process.env.MAX_BOT_USE_WEBHOOK === 'true';
      }

      const webhookUrl = `${this.webhookBaseUrl}/api/webhook/max-bot/${projectId}`;
      let isPolling = false;

      if (useWebhook) {
        logger.info(`🌐 [MAX] Настройка Webhook для бота ${projectId}`, {
          projectId,
          webhookUrl,
          component: 'max-bot-manager'
        });

        try {
          // Инициализируем botInfo для бота, чтобы handleUpdate мог создавать Context корректно
          bot.botInfo = await bot.api.getMyInfo();
          logger.info(`✅ [MAX] Информация о боте получена: @${bot.botInfo.username}`, {
            projectId,
            component: 'max-bot-manager'
          });

          // Подписываемся на события вебхука
          const response = await (bot.api.raw as any).client.call({
            method: 'subscriptions',
            options: {
              method: 'POST',
              body: {
                url: webhookUrl,
                update_types: ['message_created', 'message_callback', 'bot_started']
              }
            }
          });

          logger.info(`✅ [MAX] Webhook успешно зарегистрирован на MAX платформе`, {
            projectId,
            webhookUrl,
            status: response.status,
            data: response.data,
            component: 'max-bot-manager'
          });
        } catch (error) {
          logger.error(`❌ [MAX] Ошибка регистрации Webhook`, {
            projectId,
            error: error instanceof Error ? error.message : 'Unknown error',
            component: 'max-bot-manager'
          });
          throw error;
        }
      } else {
        // Режим Polling
        logger.info(`🔌 [MAX] Режим Polling для бота ${projectId}`, {
          projectId,
          component: 'max-bot-manager'
        });

        // Пытаемся удалить активный webhook перед запуском polling, чтобы события шли в getUpdates
        try {
          await (bot.api.raw as any).client.call({
            method: 'subscriptions',
            options: {
              method: 'DELETE',
              query: { url: webhookUrl }
            }
          });
          logger.info(`✅ [MAX] Предыдущий Webhook удален (если был) перед запуском Polling`, {
            projectId,
            component: 'max-bot-manager'
          });
        } catch (error) {
          logger.debug(`[MAX] Ошибка удаления Webhook перед Polling (возможно, подписка отсутствовала)`, {
            projectId,
            error: error instanceof Error ? error.message : 'Unknown'
          });
        }

        try {
          await bot.start();
          isPolling = true;
          logger.info(`✅ [MAX] Бот запущен (polling)`, {
            projectId,
            component: 'max-bot-manager'
          });
        } catch (error) {
          logger.error(`❌ [MAX] Ошибка запуска polling`, {
            projectId,
            error: error instanceof Error ? error.message : 'Unknown',
            component: 'max-bot-manager'
          });
        }
      }

      const instance: MaxBotInstance = {
        bot,
        isActive: true,
        projectId,
        lastUpdated: new Date(),
        isPolling
      };

      this.bots.set(projectId, instance);

      logger.info(`✅ [MAX] Бот создан и зарегистрирован`, {
        projectId,
        totalBots: this.bots.size,
        mode: useWebhook ? 'webhook' : 'polling',
        component: 'max-bot-manager'
      });

      return instance;
    } catch (error) {
      logger.error(`❌ [MAX] Ошибка создания бота`, {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'max-bot-manager'
      });
      throw error;
    }
  }

  /**
   * Получение или ленивая инициализация бота для обработки вебхука
   */
  async getBotForWebhook(projectId: string): Promise<Bot | null> {
    let instance = this.bots.get(projectId);

    if (!instance || !instance.isActive) {
      logger.info(`🔍 [MAX] Бот не найден в памяти, пробуем инициализировать (lazy-loading)`, {
        projectId,
        component: 'max-bot-manager'
      });

      try {
        const project = await db.project.findUnique({
          where: { id: projectId },
          select: { maxBotToken: true }
        });

        if (project?.maxBotToken) {
          instance = await this.createBot(projectId, project.maxBotToken);
        }
      } catch (error) {
        logger.error(`❌ [MAX] Ошибка lazy-loading бота`, {
          projectId,
          error: error instanceof Error ? error.message : String(error),
          component: 'max-bot-manager'
        });
      }
    }

    return instance?.isActive ? instance.bot : null;
  }

  /**
   * Остановка MAX бота
   */
  async stopBot(
    projectId: string,
    _updateDb: boolean = true
  ): Promise<boolean> {
    const instance = this.bots.get(projectId);
    if (!instance) return false;

    try {
      logger.info(`🛑 [MAX] Остановка бота ${projectId}`, {
        projectId,
        component: 'max-bot-manager'
      });

      instance.isActive = false;

      if (instance.isPolling) {
        try {
          instance.bot.stop();
        } catch (stopError) {
          logger.warn(`[MAX] Ошибка stop()`, {
            projectId,
            error: stopError instanceof Error ? stopError.message : 'Unknown',
            component: 'max-bot-manager'
          });
        }
      } else {
        // Удаляем Webhook подписку на стороне MAX
        const webhookUrl = `${this.webhookBaseUrl}/api/webhook/max-bot/${projectId}`;
        try {
          await (instance.bot.api.raw as any).client.call({
            method: 'subscriptions',
            options: {
              method: 'DELETE',
              query: { url: webhookUrl }
            }
          });
          logger.info(`✅ [MAX] Webhook успешно удален при остановке бота`, {
            projectId,
            webhookUrl,
            component: 'max-bot-manager'
          });
        } catch (error) {
          logger.warn(`[MAX] Ошибка удаления Webhook при остановке бота`, {
            projectId,
            error: error instanceof Error ? error.message : 'Unknown error',
            component: 'max-bot-manager'
          });
        }
      }

      this.bots.delete(projectId);

      logger.info(`✅ [MAX] Бот остановлен`, {
        projectId,
        totalBots: this.bots.size,
        component: 'max-bot-manager'
      });

      return true;
    } catch (error) {
      logger.error(`❌ [MAX] Ошибка остановки бота`, {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'max-bot-manager'
      });
      return false;
    }
  }

  /**
   * Остановка всех MAX ботов
   */
  async stopAll(): Promise<void> {
    logger.info(`🛑 [MAX] Остановка всех ботов`, {
      botCount: this.bots.size,
      component: 'max-bot-manager'
    });

    const promises = Array.from(this.bots.keys()).map((projectId) =>
      this.stopBot(projectId, false)
    );
    await Promise.allSettled(promises);
    this.bots.clear();
    this.operationLocks.clear();

    logger.info(`✅ [MAX] Все боты остановлены`, {
      component: 'max-bot-manager'
    });
  }

  /**
   * Загрузка всех MAX ботов из БД при старте приложения
   */
  async loadAllBots(): Promise<void> {
    try {
      // Ищем проекты, у которых есть maxBotToken и они активны
      const projects = await (db.project as any).findMany({
        where: {
          maxBotToken: { not: null },
          isActive: true
        },
        select: {
          id: true,
          maxBotToken: true,
          maxBotUsername: true
        }
      });

      logger.info(`[MAX] Найдено проектов с MAX токеном: ${projects.length}`, {
        component: 'max-bot-manager'
      });

      for (const project of projects) {
        const token = project.maxBotToken;
        if (!token) continue;

        try {
          await this.createBot(project.id, token);
          logger.info(`✅ [MAX] Бот загружен для проекта ${project.id}`, {
            component: 'max-bot-manager'
          });
        } catch (error) {
          logger.error(
            `❌ [MAX] Ошибка загрузки бота для проекта ${project.id}`,
            {
              error: error instanceof Error ? error.message : 'Unknown error',
              component: 'max-bot-manager'
            }
          );
        }
      }
    } catch (error) {
      logger.error(`❌ [MAX] Ошибка загрузки ботов`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'max-bot-manager'
      });
    }
  }

  /**
   * Отправка сообщения пользователю через MAX API
   */
  async sendMessageToUser(
    projectId: string,
    maxUserId: number,
    text: string,
    options: {
      buttons?: Array<{ text: string; url?: string; payload?: string }>;
    } = {}
  ): Promise<boolean> {
    const instance = this.bots.get(projectId);
    if (!instance || !instance.isActive) {
      logger.error('[MAX] Бот не активен для отправки', {
        projectId,
        component: 'max-bot-manager'
      });
      return false;
    }

    try {
      // Формируем extra (SendMessageExtra) с форматом и клавиатурой
      let extra: any = {
        format: 'html' as const
      };

      if (options.buttons && options.buttons.length > 0) {
        const buttons = options.buttons.map((btn) => {
          if (btn.url) {
            return [Keyboard.button.link(btn.text, btn.url)];
          }
          return [Keyboard.button.callback(btn.text, btn.payload || btn.text)];
        });

        extra.attachments = [Keyboard.inlineKeyboard(buttons)];
      }

      await instance.bot.api.sendMessageToUser(maxUserId, text, extra);

      logger.info(`✅ [MAX] Сообщение отправлено`, {
        projectId,
        userId: maxUserId,
        component: 'max-bot-manager'
      });

      return true;
    } catch (error) {
      logger.error(`❌ [MAX] Ошибка отправки сообщения`, {
        projectId,
        userId: maxUserId,
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'max-bot-manager'
      });
      return false;
    }
  }

  /**
   * Рассылка сообщений пользователям MAX
   * Аналог sendRichBroadcastMessage в Telegram BotManager
   */
  async sendRichBroadcastMessage(
    projectId: string,
    userIds: string[],
    message: string,
    options: {
      buttons?: Array<{
        text: string;
        url?: string;
        payload?: string;
      }>;
    } = {}
  ): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    errors: string[];
  }> {
    try {
      const instance = this.bots.get(projectId);
      if (!instance || !instance.isActive) {
        throw new Error('[MAX] Бот не активен для этого проекта');
      }

      let sentCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      const CONCURRENCY = 20;

      const sendToUser = async (userId: string) => {
        try {
          const user = await (db.user as any).findUnique({
            where: { id: userId }
          });
          if (!user || !user.maxId) {
            failedCount++;
            errors.push(
              `Пользователь ${userId}: не найден или не привязан к MAX`
            );
            return;
          }

          await this.sendMessageToUser(
            projectId,
            Number(user.maxId),
            message,
            options
          );
          sentCount++;
        } catch (error) {
          failedCount++;
          errors.push(
            `Пользователь ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      };

      for (let i = 0; i < userIds.length; i += CONCURRENCY) {
        const batch = userIds.slice(i, i + CONCURRENCY);
        await Promise.allSettled(batch.map((id) => sendToUser(id)));
      }

      return { success: sentCount > 0, sentCount, failedCount, errors };
    } catch (error) {
      return {
        success: false,
        sentCount: 0,
        failedCount: userIds.length,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}

// Синглтон (аналогично Telegram BotManager)
const globalForMaxBotManager = globalThis as unknown as {
  maxBotManager: MaxBotManager | undefined;
};

export const maxBotManager =
  globalForMaxBotManager.maxBotManager ?? new MaxBotManager();

if (process.env.NODE_ENV !== 'production') {
  globalForMaxBotManager.maxBotManager = maxBotManager;
}
