import { NextRequest, NextResponse } from 'next/server';

interface TestBotConfig {
  botToken?: string;
  webhookUrl?: string;
  commands: string[];
  testMode: boolean;
}

interface TestMessage {
  id: string;
  type: 'command' | 'text' | 'callback';
  content: string;
  timestamp: string;
  response?: any;
}

// Демо конфигурация для тестирования
const defaultTestConfig: TestBotConfig = {
  botToken: 'demo_bot_token',
  webhookUrl: 'https://example.com/api/telegram/webhook/test',
  commands: ['/start', '/help', '/status', '/bonus'],
  testMode: true
};

// История тестовых сообщений
let testMessages: TestMessage[] = [];

/**
 * GET /api/dev/bot-test
 * Получить конфигурацию и историю тестов
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log('Bot test configuration requested');

    return NextResponse.json({
      success: true,
      config: defaultTestConfig,
      messages: testMessages.slice(-limit),
      totalMessages: testMessages.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bot test config error:', error);
    return NextResponse.json(
      { error: 'Failed to get test configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dev/bot-test
 * Отправить тестовое сообщение боту
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, type = 'text', projectId = 'test' } = body;

    console.log('Test message received:', { message, type, projectId });

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Создаем тестовое сообщение
    const testMessage: TestMessage = {
      id: `test_${Date.now()}`,
      type,
      content: message,
      timestamp: new Date().toISOString()
    };

    // Симулируем обработку бота
    let botResponse: any = null;

    switch (type) {
      case 'command':
        botResponse = await simulateCommandResponse(message, projectId);
        break;

      case 'callback':
        botResponse = await simulateCallbackResponse(message, projectId);
        break;

      default:
        botResponse = await simulateTextResponse(message, projectId);
        break;
    }

    testMessage.response = botResponse;

    // Добавляем в историю
    testMessages.push(testMessage);

    // Ограничиваем историю 100 сообщениями
    if (testMessages.length > 100) {
      testMessages = testMessages.slice(-100);
    }

    console.log('Bot response generated:', botResponse);

    return NextResponse.json({
      success: true,
      message: testMessage,
      response: botResponse,
      processed: true
    });
  } catch (error) {
    console.error('Bot test error:', error);
    return NextResponse.json(
      { error: 'Failed to process test message' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dev/bot-test
 * Очистить историю тестов
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('Clearing test message history');

    const clearedCount = testMessages.length;
    testMessages = [];

    return NextResponse.json({
      success: true,
      message: 'Test history cleared',
      clearedMessages: clearedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear test history error:', error);
    return NextResponse.json(
      { error: 'Failed to clear test history' },
      { status: 500 }
    );
  }
}

// Симуляция ответа на команду
async function simulateCommandResponse(command: string, projectId: string) {
  console.log('Simulating command response:', command);

  switch (command) {
    case '/start':
      return {
        method: 'sendMessage',
        text: `🤖 Добро пожаловать в тестовый режим!\n\nПроект: ${projectId}\nВремя: ${new Date().toLocaleString('ru-RU')}\n\nДоступные команды:\n/help - Помощь\n/status - Статус\n/bonus - Бонусы`,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 Статистика', callback_data: 'stats' },
              { text: '🎁 Бонусы', callback_data: 'bonuses' }
            ]
          ]
        }
      };

    case '/help':
      return {
        method: 'sendMessage',
        text: `🔧 Режим разработки\n\n📋 Тестовые команды:\n/start - Начало\n/help - Справка\n/status - Статус\n/bonus - Бонусы\n\n⚠️ Это тестовая среда!`
      };

    case '/status':
      return {
        method: 'sendMessage',
        text: `📊 Тестовый статус\n\n🆔 Test User ID: 12345\n📱 Проект: ${projectId}\n🔧 Режим: Development\n⏰ Время: ${new Date().toLocaleTimeString('ru-RU')}`
      };

    case '/bonus':
      const randomBonus = Math.floor(Math.random() * 1000) + 100;
      return {
        method: 'sendMessage',
        text: `🎁 Тестовые бонусы\n\n💰 Баланс: ${randomBonus} бонусов\n⭐ Уровень: Test Level\n🏆 Достижений: ${Math.floor(Math.random() * 5) + 1}`
      };

    default:
      return {
        method: 'sendMessage',
        text: `❓ Неизвестная команда: ${command}\n\nИспользуйте /help для списка команд.`
      };
  }
}

// Симуляция ответа на callback
async function simulateCallbackResponse(
  callbackData: string,
  projectId: string
) {
  console.log('Simulating callback response:', callbackData);

  switch (callbackData) {
    case 'stats':
      return {
        method: 'sendMessage',
        text: `📊 Тестовая статистика\n\n👥 Пользователей: ${Math.floor(Math.random() * 100) + 50}\n📈 Активность: +${Math.floor(Math.random() * 20) + 5}%\n🎯 Тестов: ${Math.floor(Math.random() * 50) + 10}`
      };

    case 'bonuses':
      return {
        method: 'sendMessage',
        text: `🎁 Тестовые бонусы\n\n💰 Демо баланс: ${Math.floor(Math.random() * 500) + 100}\n🔧 Режим: Development\n⚠️ Данные не сохраняются`
      };

    default:
      return {
        method: 'sendMessage',
        text: `🔧 Обработка тестового действия: ${callbackData}`
      };
  }
}

// Симуляция ответа на текст
async function simulateTextResponse(text: string, projectId: string) {
  console.log('Simulating text response:', text);

  const responses = [
    `Получено сообщение: "${text}"`,
    `🤖 Тестовый ответ на: "${text}"`,
    `📝 Обрабатываю текст: "${text}"`,
    `💬 Echo: ${text}`
  ];

  const randomResponse =
    responses[Math.floor(Math.random() * responses.length)];

  return {
    method: 'sendMessage',
    text: `${randomResponse}\n\n🔧 Проект: ${projectId}\n⏰ ${new Date().toLocaleTimeString('ru-RU')}`
  };
}
