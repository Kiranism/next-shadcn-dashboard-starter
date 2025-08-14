/**
 * @file: scripts/init-bots.ts
 * @description: Ручная инициализация всех активных Telegram ботов
 * @project: SaaS Bonus System
 * @author: AI Assistant + User
 */

import { initializeAllBots } from '../src/lib/telegram/startup';

async function main() {
  console.log('🚀 Запуск инициализации ботов...');

  try {
    await initializeAllBots();
    console.log('✅ Инициализация завершена');
  } catch (error) {
    console.error('❌ Ошибка инициализации:', error);
  }

  process.exit(0);
}

main();
