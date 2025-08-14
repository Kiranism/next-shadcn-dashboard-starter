/**
 * @file: scripts/test-bot-webhook.ts
 * @description: Скрипт для тестирования работы Telegram webhook
 * @project: SaaS Bonus System
 * @author: AI Assistant + User
 */

import { db } from '@/lib/db';
import { botManager } from '@/lib/telegram/bot-manager';
import { logger } from '@/lib/logger';

async function testBotWebhook() {
  try {
    console.log('🔍 Начинаем диагностику Telegram webhook...\n');

    // 1. Получаем активный проект с настройками бота
    const botSettings = await db.botSettings.findFirst({
      where: {
        isActive: true,
        botToken: { not: '' }
      },
      include: { project: true }
    });

    if (!botSettings || !botSettings.project) {
      console.log('❌ Активные боты не найдены');
      return;
    }

    const project = botSettings.project;
    console.log(`📋 Найден проект: ${project.name} (ID: ${project.id})`);

    // 2. Проверяем настройки бота
    if (!botSettings.botToken) {
      console.log('❌ Bot token не установлен для проекта');
      return;
    }

    console.log(`🤖 Bot token: ${botSettings.botToken.substring(0, 10)}...`);
    console.log(
      `🤖 Bot username: ${botSettings.botUsername || 'не установлен'}`
    );

    // 3. Проверяем состояние в bot manager
    const botInstance = botManager.getBotInstance(project.id);
    console.log(`\n🔍 Состояние в BotManager:`);
    console.log(`- Бот создан: ${!!botInstance}`);
    console.log(`- Активен: ${botInstance?.isActive || false}`);
    console.log(`- Webhook создан: ${!!botInstance?.webhook}`);
    console.log(`- Polling: ${botInstance?.isPolling || false}`);

    // 4. Проверяем webhook handler
    const webhookHandler = botManager.getWebhookHandler(project.id);
    console.log(`- Webhook handler доступен: ${!!webhookHandler}`);

    // 5. Проверяем webhook через Telegram API
    if (botInstance?.bot) {
      try {
        const webhookInfo = await botInstance.bot.api.getWebhookInfo();
        console.log(`\n📡 Telegram Webhook Info:`);
        console.log(`- URL: ${webhookInfo.url || 'не установлен'}`);
        console.log(
          `- Ожидающие обновления: ${webhookInfo.pending_update_count}`
        );
        console.log(
          `- Последняя ошибка: ${webhookInfo.last_error_message || 'нет'}`
        );
        console.log(
          `- Дата последней ошибки: ${webhookInfo.last_error_date ? new Date(webhookInfo.last_error_date * 1000) : 'нет'}`
        );
        console.log(
          `- Максимальные соединения: ${webhookInfo.max_connections || 'не установлено'}`
        );
        console.log(
          `- Разрешенные обновления: ${webhookInfo.allowed_updates?.join(', ') || 'все'}`
        );
      } catch (error) {
        console.log(
          `❌ Ошибка получения webhook info: ${error instanceof Error ? error.message : 'Unknown'}`
        );
      }

      // 6. Проверяем информацию о боте
      try {
        const botInfo = await botInstance.bot.api.getMe();
        console.log(`\n🤖 Информация о боте:`);
        console.log(`- ID: ${botInfo.id}`);
        console.log(`- Username: @${botInfo.username}`);
        console.log(`- Имя: ${botInfo.first_name}`);
        console.log(
          `- Может присоединяться к группам: ${botInfo.can_join_groups}`
        );
        console.log(
          `- Может читать все сообщения в группах: ${botInfo.can_read_all_group_messages}`
        );
        console.log(
          `- Поддерживает inline запросы: ${botInfo.supports_inline_queries}`
        );
      } catch (error) {
        console.log(
          `❌ Ошибка получения информации о боте: ${error instanceof Error ? error.message : 'Unknown'}`
        );
      }
    }

    // 7. Тестируем отправку сообщения
    if (botInstance?.bot) {
      console.log(`\n📨 Тестируем отправку сообщения...`);

      // Ищем пользователя с telegram_id для теста
      const testUser = await db.user.findFirst({
        where: {
          projectId: project.id,
          telegramId: { not: null }
        }
      });

      if (testUser && testUser.telegramId) {
        try {
          await botInstance.bot.api.sendMessage(
            testUser.telegramId.toString(),
            '🧪 Тест отправки сообщения из скрипта диагностики\n\nЕсли вы получили это сообщение, отправка работает!'
          );
          console.log(
            `✅ Тестовое сообщение отправлено пользователю ${testUser.telegramId}`
          );
        } catch (error) {
          console.log(
            `❌ Ошибка отправки тестового сообщения: ${error instanceof Error ? error.message : 'Unknown'}`
          );
        }
      } else {
        console.log(
          `⚠️ Нет пользователей с telegramId для тестирования отправки`
        );
      }
    }

    console.log('\n✅ Диагностика завершена');
  } catch (error) {
    console.error('❌ Ошибка диагностики:', error);
  } finally {
    await db.$disconnect();
  }
}

// Запускаем диагностику
testBotWebhook().catch(console.error);
