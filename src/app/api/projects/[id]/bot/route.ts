/**
 * @file: src/app/api/projects/[id]/bot/route.ts
 * @description: API для управления настройками Telegram бота проекта
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, Prisma, Grammy
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ProjectService } from '@/lib/services/project.service';
import { botManager } from '@/lib/telegram/bot-manager';
import { logger } from '@/lib/logger';
import { TelegramBotValidationService } from '@/lib/services/telegram-bot-validation.service';
import { requireProjectAccess } from '@/lib/with-project-access';

// Функция для создания CORS заголовков - разрешаем все origins для виджета
function createCorsHeaders(request: NextRequest) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma',
    'Access-Control-Allow-Credentials': 'false',
    'Access-Control-Max-Age': '86400' // 24 hours
  };
}

// OPTIONS handler для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: createCorsHeaders(request)
  });
}

// GET /api/projects/[id]/bot - Получение настроек бота (публичный endpoint для виджета)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    logger.info('GET /api/projects/[id]/bot запрос', {
      projectId: id,
      origin: request.headers.get('origin')
    });

    // Проверяем существование проекта
    const project = await ProjectService.getProjectById(id);
    if (!project) {
      logger.warn('Проект не найден', { projectId: id });
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404, headers: createCorsHeaders(request) }
      );
    }

    // Получаем настройки бота
    const botSettings = await db.botSettings.findUnique({
      where: { projectId: id }
    });

    // Получаем настройки приветственного вознаграждения из Project
    const projectData = (await db.project.findUnique({
      where: { id },
      select: {
        welcomeBonus: true,
        welcomeRewardType: true,
        firstPurchaseDiscountPercent: true,
        botToken: true,
        botUsername: true,
        operationMode: true
      }
    })) as {
      welcomeBonus: { toNumber: () => number } | number;
      welcomeRewardType: 'BONUS' | 'DISCOUNT';
      firstPurchaseDiscountPercent: number;
      botToken: string | null;
      botUsername: string | null;
      operationMode: string;
    } | null;

    const welcomeBonusAmount =
      typeof projectData?.welcomeBonus === 'object'
        ? projectData.welcomeBonus.toNumber()
        : Number(projectData?.welcomeBonus || 0);
    const welcomeRewardType = projectData?.welcomeRewardType || 'BONUS';
    const firstPurchaseDiscountPercent =
      projectData?.firstPurchaseDiscountPercent || 0;
    let botUsername = projectData?.botUsername || null;

    if (botSettings) {
      if (botSettings.botUsername) {
        botUsername = botSettings.botUsername;
      }
    }

    logger.info('Bot settings loaded', {
      projectId: id,
      welcomeBonusAmount,
      welcomeRewardType,
      firstPurchaseDiscountPercent,
      botUsername,
      hasBotSettings: !!botSettings
    });

    // Извлекаем настройки виджета из functionalSettings
    let widgetSettings = null;
    if (botSettings?.functionalSettings) {
      try {
        const functionalSettings = botSettings.functionalSettings as any;
        widgetSettings = functionalSettings.widgetSettings || null;
        logger.info('Widget settings extracted', {
          projectId: id,
          hasWidgetSettings: !!widgetSettings,
          widgetSettingsKeys: widgetSettings ? Object.keys(widgetSettings) : []
        });
      } catch (e) {
        logger.warn('Ошибка извлечения widgetSettings', { error: e });
      }
    } else {
      logger.info('No functionalSettings found', {
        projectId: id,
        hasBotSettings: !!botSettings
      });
    }

    // Получаем botToken из проекта (если он там есть)
    const projectBotToken = (project as any)?.botToken || null;
    const botSettingsToken = botSettings?.botToken || null;
    // Используем токен из botSettings или проекта
    const finalBotToken = botSettingsToken || projectBotToken || null;
    const operationMode = (project as any)?.operationMode || 'WITH_BOT';

    logger.info('Bot token resolution', {
      projectId: id,
      hasBotSettings: !!botSettings,
      botSettingsToken: botSettingsToken
        ? '***' + botSettingsToken.slice(-4)
        : 'null',
      projectBotToken: projectBotToken
        ? '***' + projectBotToken.slice(-4)
        : 'null',
      finalBotToken: finalBotToken ? '***' + finalBotToken.slice(-4) : 'null'
    });

    // Формируем ответ - botToken должен быть явно указан после spread, чтобы перезаписать null
    const response = {
      ...(botSettings || {}),
      botToken: finalBotToken, // Явно устанавливаем botToken после spread
      welcomeBonusAmount,
      welcomeRewardType,
      firstPurchaseDiscountPercent,
      botUsername:
        botUsername ||
        (project as unknown as { botUsername?: string })?.botUsername ||
        null,
      widgetSettings,
      operationMode
    };

    logger.info('API response structure', {
      projectId: id,
      hasBotToken: !!response.botToken,
      botTokenLength: response.botToken?.length || 0,
      responseKeys: Object.keys(response),
      operationMode: response.operationMode
    });

    return NextResponse.json(response, { headers: createCorsHeaders(request) });
  } catch (error) {
    logger.error(
      'Ошибка получения настроек бота',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'bot-api'
    );
    return NextResponse.json(
      { error: 'Ошибка получения настроек бота' },
      { status: 500, headers: createCorsHeaders(request) }
    );
  }
}

// POST /api/projects/[id]/bot - Создание/обновление настроек бота
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;
    const body = await request.json();

    logger.info('🚀 POST /api/projects/[id]/bot - СОЗДАНИЕ НАСТРОЕК БОТА', {
      projectId: id,
      bodyKeys: Object.keys(body),
      botToken: body.botToken ? '***' + body.botToken.slice(-4) : 'none',
      botUsername: body.botUsername || 'none',
      allBotsInManager: botManager.getAllBotsStatus(),
      component: 'bot-api'
    });

    // Проверяем существование проекта
    const project = await ProjectService.getProjectById(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404, headers: createCorsHeaders(request) }
      );
    }

    // Валидация данных
    if (!body.botToken) {
      return NextResponse.json(
        { error: 'Токен бота обязателен' },
        { status: 400, headers: createCorsHeaders(request) }
      );
    }

    // Проверяем валидность токена бота (базовая проверка формата)
    // Telegram bot tokens format: <bot_id>:<token>
    // Example: 123456789:AAHmCIAAIfasYFQQB_3fSqcP_BB0_YykG7Y
    const tokenParts = body.botToken.split(':');
    if (
      tokenParts.length !== 2 ||
      !/^\d+$/.test(tokenParts[0]) || // bot ID should be numeric
      !tokenParts[1].startsWith('AA') || // token should start with AA
      tokenParts[1].length < 35 // minimum token length
    ) {
      return NextResponse.json(
        {
          error:
            'Неверный формат токена бота. Ожидается формат: <bot_id>:<token>'
        },
        { status: 400, headers: createCorsHeaders(request) }
      );
    }

    // Проверяем, не существует ли уже настройки для этого проекта
    const existingSettings = await db.botSettings.findUnique({
      where: { projectId: id }
    });

    if (existingSettings) {
      return NextResponse.json(
        {
          error:
            'Настройки бота для этого проекта уже существуют. Используйте PUT для обновления.'
        },
        { status: 409, headers: createCorsHeaders(request) }
      );
    }

    // Проверка лимита ботов
    const { getCurrentAdmin } = await import('@/lib/auth');
    const admin = await getCurrentAdmin();
    if (admin) {
      const { BillingService } = await import('@/lib/services/billing.service');
      const limitCheck = await BillingService.checkLimit(admin.sub, 'bots');

      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: `Лимит ботов исчерпан (${limitCheck.used}/${limitCheck.limit}). Обновите тарифный план для увеличения лимита.`,
            limitReached: true,
            currentUsage: limitCheck.used,
            limit: limitCheck.limit,
            planId: limitCheck.planId
          },
          { status: 402, headers: createCorsHeaders(request) }
        );
      }
    }

    // Если botUsername не передан, получаем его из Telegram API
    let botUsernameToSave = body.botUsername || '';
    if (!botUsernameToSave && body.botToken) {
      try {
        const botInfo = await TelegramBotValidationService.getBotInfo(
          body.botToken
        );
        if (botInfo.username) {
          botUsernameToSave = botInfo.username;
          logger.info('✅ Получен botUsername из Telegram API (POST)', {
            projectId: id,
            botUsername: botUsernameToSave,
            component: 'bot-api'
          });
        }
      } catch (error) {
        logger.warn('Не удалось получить botUsername из Telegram API (POST)', {
          projectId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
          component: 'bot-api'
        });
      }
    }

    // Создаем настройки бота
    const botSettings = await db.botSettings.create({
      data: {
        projectId: id,
        botToken: body.botToken,
        botUsername: botUsernameToSave,
        functionalSettings: body.functionalSettings || {}
      }
    });

    // Инициализируем бота
    try {
      await botManager.createBot(id, {
        id: body.id,
        projectId: id,
        botToken: body.botToken,
        botUsername: botUsernameToSave,
        functionalSettings: body.functionalSettings || {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      logger.info('Бот успешно инициализирован', { projectId: id }, 'bot-api');
    } catch (botError) {
      logger.warn(
        'Не удалось инициализировать бота, но настройки сохранены',
        {
          projectId: id,
          error: botError instanceof Error ? botError.message : 'Unknown error'
        },
        'bot-api'
      );
    }

    logger.info('Настройки бота созданы', { projectId: id }, 'bot-api');

    return NextResponse.json(
      {
        ...botSettings,
        message: 'Настройки бота успешно созданы'
      },
      { headers: createCorsHeaders(request) }
    );
  } catch (error) {
    logger.error(
      'Ошибка создания настроек бота',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'bot-api'
    );
    return NextResponse.json(
      { error: 'Ошибка создания настроек бота' },
      { status: 500, headers: createCorsHeaders(request) }
    );
  }
}

// PUT /api/projects/[id]/bot - Обновление настроек бота
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;
    const body = await request.json();

    logger.info('🔄 PUT /api/projects/[id]/bot - ОБНОВЛЕНИЕ НАСТРОЕК БОТА', {
      projectId: id,
      bodyKeys: Object.keys(body),
      botToken: body.botToken ? '***' + body.botToken.slice(-4) : 'none',
      botUsername: body.botUsername || 'none',
      allBotsInManager: botManager.getAllBotsStatus(),
      component: 'bot-api'
    });

    // Проверяем существование проекта
    const project = await ProjectService.getProjectById(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404, headers: createCorsHeaders(request) }
      );
    }

    const existingSettings = await db.botSettings.findUnique({
      where: { projectId: id }
    });

    // Если передан только functionalSettings, обновляем только их (мержим с существующими)
    if (body.functionalSettings && !body.botToken && !body.botUsername) {
      logger.info('Обновляем только функциональные настройки бота', {
        projectId: id,
        newSettingsKeys: Object.keys(body.functionalSettings)
      });

      if (!existingSettings) {
        return NextResponse.json(
          {
            error:
              'Настройки бота не найдены. Сначала создайте бота через POST.'
          },
          { status: 404, headers: createCorsHeaders(request) }
        );
      }

      // Мержим существующие functionalSettings с новыми (глубокий мерж для widgetSettings)
      const existingFunctionalSettings =
        (existingSettings.functionalSettings as Record<string, unknown>) || {};
      const newFunctionalSettings = body.functionalSettings || {};

      const mergedFunctionalSettings = {
        ...existingFunctionalSettings,
        ...newFunctionalSettings,
        // Глубокий мерж для widgetSettings если они есть в обоих объектах
        ...(newFunctionalSettings.widgetSettings
          ? {
              widgetSettings: {
                ...((existingFunctionalSettings.widgetSettings as Record<
                  string,
                  unknown
                >) || {}),
                ...(newFunctionalSettings.widgetSettings as Record<
                  string,
                  unknown
                >)
              }
            }
          : {})
      };

      logger.info('Мержим functionalSettings', {
        projectId: id,
        existingKeys: Object.keys(existingFunctionalSettings),
        newKeys: Object.keys(newFunctionalSettings),
        mergedKeys: Object.keys(mergedFunctionalSettings)
      });

      // Обновляем functionalSettings с мержем
      const updatedSettings = await db.botSettings.update({
        where: { projectId: id },
        data: {
          functionalSettings: mergedFunctionalSettings
        }
      });

      return NextResponse.json(
        {
          ...updatedSettings,
          message: 'Функциональные настройки бота успешно обновлены'
        },
        { headers: createCorsHeaders(request) }
      );
    }

    // Если не передан botToken и нет существующих настроек - создаем базовые настройки
    if (!body.botToken && !existingSettings) {
      logger.info(
        'Создаем базовые настройки бота с функциональными настройками',
        {
          projectId: id
        }
      );

      // Создаем базовые настройки бота с пустым токеном (можно будет обновить позже)
      const newSettings = await db.botSettings.create({
        data: {
          projectId: id,
          botToken: '', // Пустой токен, будет обновлен позже
          botUsername: '',
          isActive: false,
          functionalSettings: body.functionalSettings || {}
        }
      });

      return NextResponse.json(
        {
          ...newSettings,
          message: 'Базовые настройки бота созданы'
        },
        { headers: createCorsHeaders(request) }
      );
    }

    // Валидация данных для полного обновления
    if (!body.botToken) {
      return NextResponse.json(
        { error: 'Токен бота обязателен для создания/полного обновления' },
        { status: 400, headers: createCorsHeaders(request) }
      );
    }

    // Проверяем валидность токена бота (базовая проверка формата)
    // Telegram bot tokens format: <bot_id>:<token>
    // Example: 123456789:AAHmCIAAIfasYFQQB_3fSqcP_BB0_YykG7Y
    const tokenParts = body.botToken.split(':');
    if (
      tokenParts.length !== 2 ||
      !/^\d+$/.test(tokenParts[0]) || // bot ID should be numeric
      !tokenParts[1].startsWith('AA') || // token should start with AA
      body.botToken.length < 45
    ) {
      return NextResponse.json(
        {
          error:
            'Неверный формат токена бота. Токен должен быть в формате: <bot_id>:<token>'
        },
        { status: 400, headers: createCorsHeaders(request) }
      );
    }

    // Обновляем или создаем настройки бота (upsert)
    // Если запись существует - обновляем, если нет - создаем
    let botUsernameToSave = body.botUsername || '';

    // Если botUsername не передан или пустой, пытаемся получить его из Telegram API
    if (!botUsernameToSave && body.botToken) {
      try {
        const botInfo = await TelegramBotValidationService.getBotInfo(
          body.botToken
        );
        if (botInfo.username) {
          botUsernameToSave = botInfo.username;
          logger.info('✅ Получен botUsername из Telegram API', {
            projectId: id,
            botUsername: botUsernameToSave,
            component: 'bot-api'
          });
        }
      } catch (error) {
        logger.warn('Не удалось получить botUsername из Telegram API', {
          projectId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
          component: 'bot-api'
        });
        // Продолжаем без username, можно будет обновить позже
      }
    }

    const botSettings = await db.botSettings.upsert({
      where: { projectId: id },
      update: {
        botToken: body.botToken,
        botUsername: botUsernameToSave,
        functionalSettings: body.functionalSettings || {},
        updatedAt: new Date()
      },
      create: {
        projectId: id,
        botToken: body.botToken,
        botUsername: botUsernameToSave,
        functionalSettings: body.functionalSettings || {},
        isActive: true
      }
    });

    // Проверяем, изменился ли токен
    const existingBot = botManager.getBot(id);
    const existingBotToken =
      existingBot && typeof (existingBot.bot as any)?.token === 'string'
        ? ((existingBot.bot as any).token as string)
        : undefined;
    const tokenChanged = !!existingBot && existingBotToken !== body.botToken;

    logger.info('🔍 ПРОВЕРКА ИЗМЕНЕНИЯ ТОКЕНА', {
      projectId: id,
      existingBot: existingBot
        ? {
            token:
              existingBotToken && existingBotToken.length
                ? '***' + existingBotToken.slice(-4)
                : 'unknown',
            isActive: existingBot.isActive,
            isPolling: existingBot.isPolling
          }
        : null,
      newToken: '***' + body.botToken.slice(-4),
      tokenChanged,
      allBotsInManager: botManager.getAllBotsStatus(),
      component: 'bot-api'
    });

    // Проверяем, есть ли бот в менеджере
    if (!existingBot) {
      logger.info('Бот не найден в менеджере, создаем новый', {
        projectId: id,
        component: 'bot-api'
      });

      try {
        // Простое создание бота без сложной логики
        await botManager.createBot(id, {
          ...botSettings,
          botToken: body.botToken,
          botUsername: botUsernameToSave,
          functionalSettings: body.functionalSettings || {}
        });
        logger.info('Бот успешно создан в менеджере', {
          projectId: id,
          component: 'bot-api'
        });
      } catch (botError) {
        const errorMessage =
          botError instanceof Error ? botError.message : 'Unknown error';
        logger.warn('Не удалось создать бота в менеджере, продолжаем', {
          projectId: id,
          error: errorMessage,
          component: 'bot-api'
        });
        // Не прерываем выполнение, если не удается создать бота
        // Настройки в БД уже обновлены
      }
    } else {
      logger.info('Бот найден в менеджере, обновляем', {
        projectId: id,
        tokenChanged,
        component: 'bot-api'
      });

      if (tokenChanged) {
        // Если токен изменился, пересоздаем бота
        try {
          // Сначала останавливаем старый бот
          await botManager.stopBot(id);

          // Ждем немного
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Создаем новый бот
          await botManager.createBot(id, {
            ...botSettings,
            botToken: body.botToken,
            botUsername: botUsernameToSave,
            functionalSettings: body.functionalSettings || {}
          });
          logger.info('Бот успешно пересоздан с новым токеном', {
            projectId: id,
            component: 'bot-api'
          });
        } catch (botError) {
          const errorMessage =
            botError instanceof Error ? botError.message : 'Unknown error';
          logger.warn('Не удалось пересоздать бота с новым токеном', {
            projectId: id,
            error: errorMessage,
            component: 'bot-api'
          });
        }
      } else {
        // Если токен не изменился, достаточно обновить метаданные
        if (existingBot) {
          existingBot.isActive = true;
          existingBot.lastUpdated = new Date();
          existingBot.isPolling = existingBot.isPolling ?? false;
          logger.info(
            'Настройки бота обновлены в менеджере (без перезапуска)',
            {
              projectId: id,
              component: 'bot-api'
            }
          );
        }
      }
    }
    logger.info('Настройки бота обновлены', { projectId: id }, 'bot-api');

    return NextResponse.json(
      {
        ...botSettings,
        message: 'Настройки бота успешно обновлены'
      },
      { headers: createCorsHeaders(request) }
    );
  } catch (error) {
    const { id: projectId } = await context.params;
    logger.error('Ошибка обновления настроек бота', {
      projectId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      component: 'bot-api'
    });
    return NextResponse.json(
      { error: 'Ошибка обновления настроек бота' },
      { status: 500, headers: createCorsHeaders(request) }
    );
  }
}

// DELETE /api/projects/[id]/bot - Удаление настроек бота
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    // Проверяем существование проекта
    const project = await ProjectService.getProjectById(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404, headers: createCorsHeaders(request) }
      );
    }

    // Проверяем существование настроек
    const existingSettings = await db.botSettings.findUnique({
      where: { projectId: id }
    });

    if (!existingSettings) {
      return NextResponse.json(
        { error: 'Настройки бота не найдены' },
        { status: 404, headers: createCorsHeaders(request) }
      );
    }

    // Удаляем настройки бота
    await db.botSettings.delete({
      where: { projectId: id }
    });

    // Останавливаем бота
    try {
      await botManager.stopBot(id);
      logger.info('Бот успешно остановлен', { projectId: id }, 'bot-api');
    } catch (botError) {
      logger.warn(
        'Не удалось остановить бота',
        {
          projectId: id,
          error: botError instanceof Error ? botError.message : 'Unknown error'
        },
        'bot-api'
      );
    }

    logger.info('Настройки бота удалены', { projectId: id }, 'bot-api');

    return NextResponse.json(
      { message: 'Настройки бота успешно удалены' },
      { headers: createCorsHeaders(request) }
    );
  } catch (error) {
    logger.error(
      'Ошибка удаления настроек бота',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'bot-api'
    );
    return NextResponse.json(
      { error: 'Ошибка удаления настроек бота' },
      { status: 500, headers: createCorsHeaders(request) }
    );
  }
}
