/**
 * @file: src/app/api/dev/bot-test/route.ts
 * @description: API для тестирования ботов в development режиме
 * @project: SaaS Bonus System
 * @dependencies: Grammy, BotManager
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { botManager } from '@/lib/telegram/bot-manager';

export async function POST(request: NextRequest) {
  try {
    const { projectId, message } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID обязателен' },
        { status: 400 }
      );
    }

    // TODO: логгер
    const botInstance = botManager.getBot(projectId);
    logger.debug('🤖 Найден бот:', { found: !!botInstance });
    logger.debug('🔄 Активен:', { isActive: botInstance?.isActive });
    logger.debug('📋 Всего ботов в менеджере:', { bots: Array.from(botManager['bots'].keys()) });
    
    if (!botInstance) {
      return NextResponse.json(
        { 
          error: 'Бот не найден в BotManager',
          projectId,
          availableBots: Array.from(botManager['bots'].keys())
        },
        { status: 404 }
      );
    }

    if (!botInstance.isActive) {
      return NextResponse.json(
        { 
          error: 'Бот найден, но неактивен',
          projectId,
          botStatus: 'inactive'
        },
        { status: 404 }
      );
    }

    // Симулируем сообщение /start от пользователя
    const testMessage = message || '/start';
    
    logger.info(`📤 Отправляем тестовое сообщение боту:`, { message: testMessage });
    
    const mockUpdate = {
      update_id: Date.now(),
      message: {
        message_id: Date.now(),
        from: {
          id: 123456789,
          is_bot: false,
          first_name: 'TestUser',
          username: 'testuser',
          language_code: 'ru'
        },
        chat: {
          id: 123456789,
          first_name: 'TestUser',
          username: 'testuser',
          type: 'private' as const
        },
        date: Math.floor(Date.now() / 1000),
        text: testMessage
      }
    } as any; // Упрощаем типизацию для тестирования

    try {
      // Обрабатываем обновление через бота напрямую (минуя webhook)
      logger.debug('🤖 Обрабатываем обновление через бота...');
      await botInstance.bot.handleUpdate(mockUpdate);
      logger.info('✅ Обновление обработано успешно');

      return NextResponse.json({
        success: true,
        message: `Тестовое сообщение "${testMessage}" успешно обработано ботом`,
        projectId,
        botActive: botInstance.isActive,
        testUser: 'TestUser (ID: 123456789)',
        processedAt: new Date().toISOString()
      });
    } catch (botError) {
      logger.error('❌ Ошибка обработки обновления ботом:', { error: botError });
      return NextResponse.json({
        success: false,
        error: `Ошибка обработки сообщения ботом: ${botError}`,
        projectId,
        testMessage
      }, { status: 500 });
    }

  } catch (error) {
    logger.error('Ошибка тестирования бота:', { error });
    return NextResponse.json(
      { error: 'Ошибка тестирования бота' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID обязателен' },
        { status: 400 }
      );
    }

    const botInstance = botManager.getBot(projectId);
    
    if (!botInstance) {
      return NextResponse.json({
        projectId,
        isRunning: false,
        error: 'Бот не найден'
      });
    }

    // Проверяем webhook info
    try {
      const webhookInfo = await botInstance.bot.api.getWebhookInfo();
      const me = await botInstance.bot.api.getMe();

      return NextResponse.json({
        projectId,
        isRunning: botInstance.isActive,
        botInfo: {
          id: me.id,
          username: me.username,
          first_name: me.first_name,
          can_join_groups: me.can_join_groups,
          can_read_all_group_messages: me.can_read_all_group_messages,
          supports_inline_queries: me.supports_inline_queries
        },
        webhookInfo: {
          url: webhookInfo.url,
          has_custom_certificate: webhookInfo.has_custom_certificate,
          pending_update_count: webhookInfo.pending_update_count,
          last_error_date: webhookInfo.last_error_date,
          last_error_message: webhookInfo.last_error_message,
          max_connections: webhookInfo.max_connections,
          allowed_updates: webhookInfo.allowed_updates
        }
      });

    } catch (error) {
      return NextResponse.json({
        projectId,
        isRunning: false,
        error: `Ошибка получения информации о боте: ${error}`
      });
    }

  } catch (error) {
    logger.error('Ошибка проверки бота:', { error });
    return NextResponse.json(
      { error: 'Ошибка проверки бота' },
      { status: 500 }
    );
  }
}
