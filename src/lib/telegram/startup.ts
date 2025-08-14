/**
 * @file: src/lib/telegram/startup.ts
 * @description: Автоматическая инициализация всех активных Telegram ботов при запуске
 * @project: SaaS Bonus System
 * @dependencies: BotManager, Database
 * @created: 2025-08-09
 * @author: AI Assistant + User
 */

import { db } from '@/lib/db';
import { botManager } from './bot-manager';
import { logger } from '@/lib/logger';

/**
 * Инициализирует все активные боты при запуске приложения
 */
export async function initializeAllBots() {
  try {
    logger.info('🚀 Запуск инициализации всех активных ботов...', {
      component: 'bot-startup'
    });

    // Получаем все активные настройки ботов
    const activeBotSettings = await db.botSettings.findMany({
      where: {
        isActive: true,
        botToken: { not: '' }
      },
      include: { project: true }
    });

    if (activeBotSettings.length === 0) {
      logger.info('📭 Активные боты не найдены', {
        component: 'bot-startup'
      });
      return;
    }

    logger.info(`🤖 Найдено ${activeBotSettings.length} активных ботов`, {
      bots: activeBotSettings.map((s) => ({
        projectId: s.projectId,
        username: s.botUsername,
        projectName: s.project.name
      })),
      component: 'bot-startup'
    });

    // Инициализируем боты с задержками для избежания rate limiting
    const results = [];
    for (const botSettings of activeBotSettings) {
      try {
        logger.info(
          `⏳ Инициализация бота для проекта ${botSettings.project.name}`,
          {
            projectId: botSettings.projectId,
            username: botSettings.botUsername,
            component: 'bot-startup'
          }
        );

        const botInstance = await botManager.createBot(
          botSettings.projectId,
          botSettings as any
        );

        results.push({
          projectId: botSettings.projectId,
          success: true,
          username: botInstance.bot.botInfo.username
        });

        logger.info(`✅ Бот успешно инициализирован`, {
          projectId: botSettings.projectId,
          username: botInstance.bot.botInfo.username,
          projectName: botSettings.project.name,
          component: 'bot-startup'
        });

        // Задержка между инициализацией ботов
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`❌ Ошибка инициализации бота`, {
          projectId: botSettings.projectId,
          username: botSettings.botUsername,
          error: error instanceof Error ? error.message : 'Unknown error',
          component: 'bot-startup'
        });

        results.push({
          projectId: botSettings.projectId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    logger.info(`🎉 Инициализация ботов завершена`, {
      total: activeBotSettings.length,
      success: successCount,
      failures: failureCount,
      results,
      component: 'bot-startup'
    });
  } catch (error) {
    logger.error('💥 Критическая ошибка инициализации ботов', {
      error: error instanceof Error ? error.message : 'Unknown error',
      component: 'bot-startup'
    });
  }
}

/**
 * Выполняет инициализацию с задержкой для развертывания
 */
export async function startupBots() {
  // Задержка для полной загрузки приложения
  setTimeout(async () => {
    await initializeAllBots();
  }, 3000); // 3 секунды после запуска
}
