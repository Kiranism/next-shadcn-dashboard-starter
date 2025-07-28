/**
 * @file: src/lib/telegram/bot-manager.ts
 * @description: Менеджер для управления экземплярами Telegram ботов
 * @project: SaaS Bonus System
 * @dependencies: Grammy, Node.js Map
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

// @ts-nocheck
// Временно отключаем проверку типов для совместимости с Prisma

import { Bot, Context, SessionFlavor, webhookCallback } from 'grammy';
import { createBot } from './bot';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { BotSettings } from '@/types/bonus';

// Типизация контекста (совпадает с bot.ts)
interface SessionData {
  step?: string;
  projectId?: string;
  awaitingContact?: boolean;
}

type MyContext = Context & SessionFlavor<SessionData>;

interface BotInstance {
  bot: Bot<MyContext>;
  webhook: any | null; // null в dev режиме (polling), webhookCallback в prod режиме
  isActive: boolean;
  projectId: string;
  lastUpdated: Date;
  isPolling?: boolean; // Флаг для отслеживания состояния polling
}

/**
 * Менеджер для управления несколькими экземплярами ботов
 * Поддерживает создание, обновление и деактивацию ботов для разных проектов
 */
class BotManager {
  private bots: Map<string, BotInstance> = new Map();
  private readonly WEBHOOK_BASE_URL: string;

  constructor() {
    this.WEBHOOK_BASE_URL =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5006';
    logger.info('BotManager инициализирован', {
      webhookBaseUrl: this.WEBHOOK_BASE_URL,
      component: 'bot-manager'
    });
  }

  /**
   * Получение экземпляра бота по projectId
   */
  getBot(projectId: string): BotInstance | undefined {
    return this.bots.get(projectId);
  }

  /**
   * Создание и запуск нового бота
   */
  async createBot(
    projectId: string,
    botSettings: BotSettings
  ): Promise<BotInstance> {
    try {
      // КРИТИЧНО: Останавливаем существующий бот если есть
      await this.stopBot(projectId);

      // Создаем новый экземпляр бота
      const bot = createBot(botSettings.botToken, projectId, botSettings);

      // ВАЖНО: Инициализируем бота согласно документации Grammy
      await bot.init();
      logger.info(`Бот инициализирован: @${bot.botInfo.username}`, {
        projectId,
        botId: bot.botInfo.id,
        username: bot.botInfo.username,
        component: 'bot-manager'
      });

      // Определяем dev режим по localhost URL ПЕРЕД созданием webhook callback
      const isDev =
        this.WEBHOOK_BASE_URL.includes('localhost') ||
        this.WEBHOOK_BASE_URL.includes('127.0.0.1');

      logger.info(
        `Режим работы: ${isDev ? 'Development (polling)' : 'Production (webhook)'}`,
        {
          projectId,
          isDev,
          baseUrl: this.WEBHOOK_BASE_URL,
          nodeEnv: process.env.NODE_ENV,
          component: 'bot-manager'
        }
      );

      let webhook = null;
      let isPolling = false;

      if (isDev) {
        // Development режим - очищаем webhook и запускаем polling
        try {
          logger.info(`Development режим: очищаем webhook для бота`, {
            projectId,
            component: 'bot-manager'
          });
          await bot.api.deleteWebhook({ drop_pending_updates: true });
          logger.info(`Webhook очищен для бота`, {
            projectId,
            component: 'bot-manager'
          });
        } catch (error) {
          logger.warn(`Не удалось очистить webhook для бота`, {
            projectId,
            error:
              error instanceof Error ? error.message : 'Неизвестная ошибка',
            component: 'bot-manager'
          });
        }

        // Запускаем polling для реальных пользователей ТОЛЬКО ОДИН РАЗ
        try {
          logger.info(`Запускаем polling для бота`, {
            projectId,
            component: 'bot-manager'
          });

          // Используем промис для контроля процесса
          const startPromise = bot.start({
            onStart: (botInfo) => {
              logger.info(`Polling запущен для бота @${botInfo.username}`, {
                projectId,
                botId: botInfo.id,
                username: botInfo.username,
                component: 'bot-manager'
              });
              logger.info(
                `Реальные пользователи могут писать боту в Telegram`,
                {
                  projectId,
                  component: 'bot-manager'
                }
              );
            },
            drop_pending_updates: true // Пропускаем старые обновления
          });

          isPolling = true;
          logger.info(`Polling активирован для бота`, {
            projectId,
            component: 'bot-manager'
          });

          // НЕ ждем завершения start() - он работает бесконечно
        } catch (error) {
          logger.error(`Ошибка запуска polling для бота`, {
            projectId,
            error:
              error instanceof Error ? error.message : 'Неизвестная ошибка',
            component: 'bot-manager'
          });
          isPolling = false;
        }
      } else {
        // Production режим - создаем webhook callback и настраиваем webhook
        logger.info(`Production режим: создаем webhook callback для бота`, {
          projectId,
          component: 'bot-manager'
        });
        webhook = webhookCallback(bot, 'std/http');
        // Production режим - настраиваем webhook только если есть HTTPS
        const webhookUrl = `${this.WEBHOOK_BASE_URL}/api/telegram/webhook/${projectId}`;

        if (!webhookUrl.startsWith('https://')) {
          logger.warn(`HTTPS отсутствует для webhook в production`, {
            projectId,
            webhookUrl,
            component: 'bot-manager'
          });
          logger.warn(
            `Бот будет работать без webhook (только для тестирования)`,
            {
              projectId,
              component: 'bot-manager'
            }
          );
        } else {
          try {
            logger.info(`Production режим: устанавливаем webhook для бота`, {
              projectId,
              webhookUrl,
              component: 'bot-manager'
            });

            await bot.api.setWebhook(webhookUrl, {
              allowed_updates: [
                'message',
                'callback_query',
                'inline_query',
                'my_chat_member'
              ],
              drop_pending_updates: true
            });

            logger.info(`Webhook установлен для бота`, {
              projectId,
              webhookUrl,
              component: 'bot-manager'
            });
          } catch (error) {
            logger.error(`Ошибка установки webhook для бота`, {
              projectId,
              error:
                error instanceof Error ? error.message : 'Неизвестная ошибка',
              component: 'bot-manager'
            });
          }
        }
      }

      // Создаем и сохраняем BotInstance ПОСЛЕ настройки webhook/polling
      const botInstance: BotInstance = {
        bot,
        webhook, // null в dev режиме, webhookCallback в prod режиме
        isActive: botSettings.isActive,
        projectId,
        lastUpdated: new Date(),
        isPolling
      };

      this.bots.set(projectId, botInstance);
      logger.info(`Бот для проекта ${projectId} создан и активирован`, {
        projectId,
        component: 'bot-manager'
      });

      return botInstance;
    } catch (error) {
      logger.error(`Ошибка создания бота для проекта ${projectId}`, {
        projectId,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'bot-manager'
      });
      throw error;
    }
  }

  /**
   * Обновление настроек бота
   */
  async updateBot(
    projectId: string,
    botSettings: BotSettings
  ): Promise<BotInstance> {
    const existingBot = this.bots.get(projectId);

    // Если токен изменился, создаем новый бот
    if (!existingBot || existingBot.bot.token !== botSettings.botToken) {
      return this.createBot(projectId, botSettings);
    }

    // Обновляем статус активности
    existingBot.isActive = botSettings.isActive;
    existingBot.lastUpdated = new Date();

    // Если бот деактивирован, останавливаем его
    if (!botSettings.isActive) {
      try {
        await this.stopBot(projectId);
        logger.info(`Бот для проекта ${projectId} деактивирован`, {
          projectId,
          component: 'bot-manager'
        });
      } catch (error) {
        logger.error(`Ошибка деактивации бота ${projectId}`, {
          projectId,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка',
          component: 'bot-manager'
        });
      }
    }

    this.bots.set(projectId, existingBot);
    return existingBot;
  }

  /**
   * Остановка и удаление бота
   */
  async stopBot(projectId: string): Promise<void> {
    const botInstance = this.bots.get(projectId);

    if (botInstance) {
      try {
        // Сначала останавливаем polling если активен
        if (botInstance.isPolling) {
          logger.info(`Останавливаем polling для бота ${projectId}`, {
            projectId,
            component: 'bot-manager'
          });
          await botInstance.bot.stop();
          logger.info(`Polling остановлен для бота ${projectId}`, {
            projectId,
            component: 'bot-manager'
          });
        }

        // Затем удаляем webhook
        await botInstance.bot.api.deleteWebhook({ drop_pending_updates: true });
        logger.info(`Webhook удален для бота ${projectId}`, {
          projectId,
          component: 'bot-manager'
        });
      } catch (error) {
        logger.warn(`Ошибка остановки бота ${projectId}`, {
          projectId,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка',
          component: 'bot-manager'
        });
      }

      this.bots.delete(projectId);
      logger.info(`Бот ${projectId} удален из менеджера`, {
        projectId,
        component: 'bot-manager'
      });
    }
  }

  /**
   * Загрузка всех активных ботов из базы данных
   */
  async loadAllBots(): Promise<void> {
    try {
      const allBotSettings = await db.botSettings.findMany({
        where: { isActive: true },
        include: { project: true }
      });

      logger.info(`Загрузка ${allBotSettings.length} активных ботов...`, {
        component: 'bot-manager'
      });

      for (const botSettings of allBotSettings) {
        try {
          // Преобразуем настройки для BotManager
          const botSettingsForManager = {
            ...botSettings,
            welcomeMessage:
              typeof botSettings.welcomeMessage === 'string'
                ? botSettings.welcomeMessage
                : 'Добро пожаловать! 🎉\n\nЭто бот бонусной программы.'
          };
          await this.createBot(
            botSettings.projectId,
            botSettingsForManager as BotSettings
          );
        } catch (error) {
          logger.error(`Ошибка загрузки бота ${botSettings.projectId}`, {
            projectId: botSettings.projectId,
            error:
              error instanceof Error ? error.message : 'Неизвестная ошибка',
            component: 'bot-manager'
          });
        }
      }

      logger.info(`Загружено ${this.bots.size} ботов`, {
        component: 'bot-manager'
      });
    } catch (error) {
      logger.error('Ошибка загрузки ботов из базы данных', {
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'bot-manager'
      });
    }
  }

  /**
   * Получение статистики ботов
   */
  getStats() {
    const total = this.bots.size;
    const active = Array.from(this.bots.values()).filter(
      (bot) => bot.isActive
    ).length;
    const inactive = total - active;

    return {
      total,
      active,
      inactive,
      bots: Array.from(this.bots.entries()).map(([projectId, instance]) => ({
        projectId,
        isActive: instance.isActive,
        isPolling: instance.isPolling || false,
        lastUpdated: instance.lastUpdated
      }))
    };
  }

  /**
   * Получение webhook handler для конкретного проекта
   * Возвращает null в dev режиме (используется polling)
   */
  getWebhookHandler(projectId: string) {
    const botInstance = this.bots.get(projectId);

    if (!botInstance || !botInstance.isActive) {
      return null;
    }

    // В dev режиме webhook может быть null (используется polling)
    return botInstance.webhook;
  }

  /**
   * Проверка состояния бота
   */
  async checkBotHealth(projectId: string): Promise<{
    isRunning: boolean;
    webhookInfo?: any;
    error?: string;
  }> {
    const botInstance = this.bots.get(projectId);

    if (!botInstance) {
      return { isRunning: false, error: 'Бот не найден' };
    }

    try {
      const webhookInfo = await botInstance.bot.api.getWebhookInfo();
      return {
        isRunning: true,
        webhookInfo
      };
    } catch (error) {
      return {
        isRunning: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }
}

// Создаем глобальный экземпляр менеджера
const globalForBotManager = globalThis as unknown as {
  botManager: BotManager | undefined;
};

export const botManager = globalForBotManager.botManager ?? new BotManager();

if (process.env.NODE_ENV !== 'production') {
  globalForBotManager.botManager = botManager;
}

// Автоматическая загрузка ботов при инициализации модуля
// ОТКЛЮЧАЕМ автозагрузку - будем загружать только по требованию
// botManager.loadAllBots().catch(error => {
//   logger.error('Ошибка автоматической загрузки ботов:', {
//     error: error instanceof Error ? error.message : 'Неизвестная ошибка',
//     component: 'bot-manager'
//   });
// });
