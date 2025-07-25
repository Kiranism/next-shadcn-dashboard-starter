import { NextRequest, NextResponse } from 'next/server';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      title?: string;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: any;
    message?: any;
    data?: string;
  };
}

interface BotCommand {
  command: string;
  description: string;
  handler: (update: TelegramUpdate, projectId: string) => Promise<any>;
}

// Обработчики команд бота
const botCommands: BotCommand[] = [
  {
    command: '/start',
    description: 'Начать работу с ботом',
    handler: async (update, projectId) => {
      const chatId = update.message?.chat.id;
      const userName = update.message?.from.first_name || 'Пользователь';

      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `Привет, ${userName}! 👋\n\nДобро пожаловать в проект ${projectId}!\n\nДоступные команды:\n/help - Помощь\n/status - Статус\n/bonus - Мои бонусы`,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 Статистика', callback_data: 'stats' },
              { text: '🎁 Бонусы', callback_data: 'bonuses' }
            ],
            [{ text: '⚙️ Настройки', callback_data: 'settings' }]
          ]
        }
      };
    }
  },
  {
    command: '/help',
    description: 'Показать справку',
    handler: async (update, projectId) => {
      const chatId = update.message?.chat.id;

      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `🤖 Справка по боту\n\n📋 Доступные команды:\n\n/start - Начать работу\n/help - Эта справка\n/status - Текущий статус\n/bonus - Информация о бонусах\n/settings - Настройки\n\n💡 Вы также можете использовать кнопки в интерфейсе.`
      };
    }
  },
  {
    command: '/status',
    description: 'Показать статус пользователя',
    handler: async (update, projectId) => {
      const chatId = update.message?.chat.id;
      const userId = update.message?.from.id;

      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `📊 Ваш статус\n\n🆔 ID: ${userId}\n📱 Проект: ${projectId}\n⭐ Статус: Активный\n🎁 Бонусы: ${Math.floor(Math.random() * 1000) + 100}\n📅 Регистрация: Январь 2024`,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Обновить', callback_data: 'refresh_status' }]
          ]
        }
      };
    }
  }
];

/**
 * POST /api/telegram/webhook/[projectId]
 * Обработка webhook от Telegram
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const update: TelegramUpdate = await request.json();

    console.log('Telegram webhook:', { projectId, updateId: update.update_id });

    let response: any = null;

    // Обработка текстовых сообщений
    if (update.message?.text) {
      const text = update.message.text;
      const command = text.split(' ')[0];

      // Поиск обработчика команды
      const botCommand = botCommands.find((cmd) => cmd.command === command);

      if (botCommand) {
        response = await botCommand.handler(update, projectId);
      } else {
        // Обработка обычного текста
        response = {
          method: 'sendMessage',
          chat_id: update.message.chat.id,
          text: `Получено сообщение: "${text}"\n\nИспользуйте /help для просмотра доступных команд.`
        };
      }
    }

    // Обработка callback query (нажатия на кнопки)
    if (update.callback_query) {
      response = await handleCallbackQuery(update.callback_query, projectId);
    }

    // Отправка ответа боту (если есть)
    if (response) {
      await sendTelegramResponse(response, projectId);
    }

    return NextResponse.json({
      success: true,
      processed: true,
      update_id: update.update_id
    });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/telegram/webhook/[projectId]
 * Проверка статуса webhook
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    console.log('Webhook status check for project:', projectId);

    return NextResponse.json({
      success: true,
      project_id: projectId,
      webhook_status: 'active',
      bot_commands: botCommands.map((cmd) => ({
        command: cmd.command,
        description: cmd.description
      })),
      last_update: new Date().toISOString()
    });
  } catch (error) {
    console.error('Webhook status error:', error);
    return NextResponse.json(
      { error: 'Failed to check webhook status' },
      { status: 500 }
    );
  }
}

// Обработка callback queries
async function handleCallbackQuery(callbackQuery: any, projectId: string) {
  const chatId = callbackQuery.message?.chat?.id;
  const data = callbackQuery.data;

  console.log('Callback query:', { data, projectId });

  // Ответ на callback query
  await answerCallbackQuery(callbackQuery.id);

  switch (data) {
    case 'stats':
      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `📊 Статистика проекта ${projectId}\n\n👥 Пользователей: ${Math.floor(Math.random() * 1000) + 500}\n📈 Активность: +${Math.floor(Math.random() * 20) + 5}%\n🎯 Конверсия: ${(Math.random() * 10 + 5).toFixed(1)}%`
      };

    case 'bonuses':
      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `🎁 Ваши бонусы\n\n💰 Текущий баланс: ${Math.floor(Math.random() * 1000) + 100} бонусов\n⭐ Уровень: Gold\n🏆 Достижений: ${Math.floor(Math.random() * 10) + 3}`,
        reply_markup: {
          inline_keyboard: [
            [{ text: '💸 Потратить бонусы', callback_data: 'spend_bonuses' }]
          ]
        }
      };

    case 'settings':
      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `⚙️ Настройки\n\n🔔 Уведомления: Включены\n🌍 Язык: Русский\n📱 Тема: Автоматическая`,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔔 Уведомления', callback_data: 'toggle_notifications' },
              { text: '🌍 Язык', callback_data: 'change_language' }
            ]
          ]
        }
      };

    default:
      return {
        method: 'sendMessage',
        chat_id: chatId,
        text: `Обработка действия: ${data}`
      };
  }
}

// Отправка ответа боту
async function sendTelegramResponse(response: any, projectId: string) {
  // В реальном проекте здесь была бы отправка через Telegram Bot API
  console.log('Sending telegram response:', {
    projectId,
    method: response.method
  });
}

// Ответ на callback query
async function answerCallbackQuery(callbackQueryId: string) {
  // В реальном проекте здесь был бы вызов answerCallbackQuery API
  console.log('Answering callback query:', callbackQueryId);
}
