/**
 * @file: check-bot-manager.ts
 * @description: Скрипт для проверки состояния botManager
 * @project: SaaS Bonus System
 * @dependencies: @/lib/telegram/bot-manager
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

import { botManager } from '../src/lib/telegram/bot-manager';

async function checkBotManager() {
  try {
    const projectId = 'cmdkloj85000cv8o0611rblp3';

    console.log('🔍 Проверка botManager...');

    // Получаем статистику
    const stats = botManager.getStats();
    console.log('📊 Статистика botManager:', stats);

    // Проверяем конкретный бот
    const bot = botManager.getBot(projectId);
    console.log(
      '🤖 Бот для проекта:',
      bot
        ? {
            isActive: bot.isActive,
            isPolling: bot.isPolling,
            lastUpdated: bot.lastUpdated
          }
        : 'Не найден'
    );

    // Проверяем здоровье бота
    const health = await botManager.checkBotHealth(projectId);
    console.log('🏥 Здоровье бота:', health);
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

checkBotManager();
