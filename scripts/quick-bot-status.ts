/**
 * Быстрая проверка статуса ботов
 */
import { botManager } from '../src/lib/telegram/bot-manager';

try {
  const allBots = botManager.getAllBots();

  console.log(`🤖 Всего ботов в памяти: ${allBots.length}`);

  allBots.forEach(([projectId, bot]) => {
    console.log(
      `- ${projectId}: polling=${bot.isPolling}, active=${bot.isActive}, webhook=${!!bot.webhook}`
    );
  });

  console.log('\n✅ Проверка завершена');
} catch (error) {
  console.error('❌ Ошибка:', error);
}
