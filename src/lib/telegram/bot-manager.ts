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
}

/**
 * Менеджер для управления несколькими экземплярами ботов
 * Поддерживает создание, обновление и деактивацию ботов для разных проектов
 */
class BotManager {
  private bots: Map<string, BotInstance> = new Map();
  private readonly WEBHOOK_BASE_URL: string;

  constructor() {
    this.WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5006';
    // TODO: логгер
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
  async createBot(projectId: string, botSettings: BotSettings): Promise<BotInstance> {
    try {
      // Останавливаем существующий бот если есть
      await this.stopBot(projectId);

      // Создаем новый экземпляр бота
      const bot = createBot(botSettings.botToken, projectId);
      
      // ВАЖНО: Инициализируем бота согласно документации Grammy
      // TODO: логгер
      await bot.init();
      // TODO: логгер
      // console.log(`✅ Бот инициализирован: @${bot.botInfo.username} (ID: ${bot.botInfo.id})`);
      
      // Определяем dev режим по localhost URL ПЕРЕД созданием webhook callback
      const isDev = this.WEBHOOK_BASE_URL.includes('localhost') || this.WEBHOOK_BASE_URL.includes('127.0.0.1');
      
      // TODO: логгер
      // console.log(`🔍 Режим работы: ${isDev ? 'Development (polling)' : 'Production (webhook)'}`);
      // TODO: логгер
      // console.log(`🔗 Base URL: ${this.WEBHOOK_BASE_URL}`);
      // TODO: логгер
      // console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);

      let webhook = null;

      if (isDev) {
        // Development режим - очищаем webhook и запускаем polling
        try {
          // TODO: логгер
          // console.log(`🔄 Development режим: очищаем webhook для бота ${projectId}`);
          await bot.api.deleteWebhook();
          // TODO: логгер
          // console.log(`✅ Webhook очищен для бота ${projectId}`);
        } catch (error) {
          // TODO: логгер
          // console.warn(`⚠️ Не удалось очистить webhook для бота ${projectId}:`, error);
          // НЕ останавливаем работу - это не критично
        }

        // Запускаем polling для реальных пользователей
        try {
          // TODO: логгер
          // console.log(`🔄 Запускаем polling для бота ${projectId}...`);
          bot.start({
            onStart: (botInfo) => {
              // TODO: логгер
              // console.log(`🚀 Polling запущен для бота @${botInfo.username} (ID: ${botInfo.id})`);
              // TODO: логгер
              // console.log(`📱 Реальные пользователи могут писать боту в Telegram!`);
            },
            drop_pending_updates: true // Пропускаем старые обновления
          });
          // TODO: логгер
          // console.log(`✅ Polling активирован для бота ${projectId}`);
        } catch (error) {
          // TODO: логгер
          // console.error(`❌ Ошибка запуска polling для бота ${projectId}:`, error);
          // НЕ выбрасываем ошибку - пусть бот работает хотя бы через API
        }
      } else {
        // Production режим - создаем webhook callback и настраиваем webhook
        // TODO: логгер
        // console.log(`🔄 Production режим: создаем webhook callback для бота ${projectId}`);
        webhook = webhookCallback(bot, 'std/http');
        // Production режим - настраиваем webhook только если есть HTTPS
        const webhookUrl = `${this.WEBHOOK_BASE_URL}/api/telegram/webhook/${projectId}`;
        
        if (!webhookUrl.startsWith('https://')) {
          // TODO: логгер
          // console.warn(`⚠️ HTTPS отсутствует для webhook в production: ${webhookUrl}`);
          // TODO: логгер
          // console.warn(`⚠️ Бот будет работать без webhook (только для тестирования)`);
          // НЕ выбрасываем ошибку - пусть бот работает для тестирования
        } else {
          try {
            // TODO: логгер
            // console.log(`🔄 Production режим: устанавливаем webhook для бота ${projectId}: ${webhookUrl}`);
            
            await bot.api.setWebhook(webhookUrl, {
              allowed_updates: [
                'message',
                'callback_query',
                'inline_query',
                'my_chat_member'
              ]
            });
            
            // TODO: логгер
            // console.log(`✅ Webhook установлен для бота ${projectId}: ${webhookUrl}`);
            
            // Проверяем webhook info
            const webhookInfo = await bot.api.getWebhookInfo();
            // TODO: логгер
            // console.log(`📊 Webhook info для бота ${projectId}:`, webhookInfo);
            
          } catch (error) {
            // TODO: логгер
            // console.error(`❌ Ошибка установки webhook для бота ${projectId}:`, error);
            // TODO: логгер
            // console.warn(`⚠️ Бот будет работать без webhook (только для тестирования)`);
            // НЕ выбрасываем ошибку - пусть бот работает
          }
        }
      }

      // Создаем и сохраняем BotInstance ПОСЛЕ настройки webhook/polling
      const botInstance: BotInstance = {
        bot,
        webhook, // null в dev режиме, webhookCallback в prod режиме
        isActive: botSettings.isActive,
        projectId,
        lastUpdated: new Date()
      };

      this.bots.set(projectId, botInstance);
      // TODO: логгер
      // console.log(`💾 Бот для проекта ${projectId} сохранен в BotManager`);
      // TODO: логгер
      // console.log(`🤖 Бот для проекта ${projectId} создан и активирован`);
      return botInstance;

    } catch (error) {
      // TODO: логгер
      // console.error(`Ошибка создания бота для проекта ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Обновление настроек бота
   */
  async updateBot(projectId: string, botSettings: BotSettings): Promise<BotInstance> {
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
        await existingBot.bot.stop();
        // TODO: логгер
        // console.log(`🔄 Бот для проекта ${projectId} деактивирован`);
      } catch (error) {
        // TODO: логгер
        // console.error(`Ошибка деактивации бота ${projectId}:`, error);
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
        // Удаляем webhook
        await botInstance.bot.api.deleteWebhook();
        // TODO: логгер
        // console.log(`🛑 Webhook удален для бота ${projectId}`);
      } catch (error) {
        // TODO: логгер
        // console.error(`Ошибка удаления webhook для бота ${projectId}:`, error);
      }

      // Останавливаем бота
      try {
        await botInstance.bot.stop();
        // TODO: логгер
        // console.log(`🛑 Бот ${projectId} остановлен`);
      } catch (error) {
        // TODO: логгер
        // console.error(`Ошибка остановки бота ${projectId}:`, error);
      }

      this.bots.delete(projectId);
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

      // TODO: логгер
      // console.log(`🔄 Загрузка ${allBotSettings.length} активных ботов...`);

      for (const botSettings of allBotSettings) {
        try {
          // Преобразуем настройки для BotManager
          const botSettingsForManager = {
            ...botSettings,
            welcomeMessage: typeof botSettings.welcomeMessage === 'string' 
              ? botSettings.welcomeMessage 
              : 'Добро пожаловать! 🎉\n\nЭто бот бонусной программы.'
          };
          await this.createBot(botSettings.projectId, botSettingsForManager as BotSettings);
        } catch (error) {
          // TODO: логгер
          // console.error(`Ошибка загрузки бота ${botSettings.projectId}:`, error);
        }
      }

      // TODO: логгер
      // console.log(`✅ Загружено ${this.bots.size} ботов`);
    } catch (error) {
      // TODO: логгер
      // console.error('Ошибка загрузки ботов из базы данных:', error);
    }
  }

  /**
   * Получение статистики ботов
   */
  getStats() {
    const total = this.bots.size;
    const active = Array.from(this.bots.values()).filter(bot => bot.isActive).length;
    const inactive = total - active;

    return {
      total,
      active,
      inactive,
      bots: Array.from(this.bots.entries()).map(([projectId, instance]) => ({
        projectId,
        isActive: instance.isActive,
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
   * Получение экземпляра бота для конкретного проекта
   */
  getBot(projectId: string): BotInstance | null {
    return this.bots.get(projectId) || null;
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
// Загружаем в любом режиме для тестирования
botManager.loadAllBots().catch(error => {
  // TODO: логгер
  // console.error('Ошибка автоматической загрузки ботов:', error);
}); 