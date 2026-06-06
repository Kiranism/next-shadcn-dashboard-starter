/**
 * @file: src/lib/telegram/bot.ts
 * @description: Фабрика создания Telegram ботов с поддержкой Workflow
 * @project: SaaS Bonus System
 * @dependencies: Grammy, FlowExecutor, WorkflowRuntime
 * @created: 2025-01-12
 * @updated: 2025-10-12
 * @author: AI Assistant + User
 */

import { Bot, Context, SessionFlavor } from 'grammy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { logger } from '@/lib/logger';
import {
  BotSessionService,
  BotConstructorSession
} from '@/lib/services/bot-session.service';
import { SimpleWorkflowProcessor } from '@/lib/services/simple-workflow-processor';
import { WorkflowRuntimeService } from '@/lib/services/workflow-runtime.service';
import { PartnerCabinetService } from '@/lib/services/partner-cabinet.service';

// Интерфейс для сессии (расширен для конструктора)
type MyContext = Context & SessionFlavor<BotConstructorSession>;

/**
 * Создание экземпляра бота с поддержкой Workflow
 */
export function createBot(token: string, projectId: string, botSettings?: any) {
  logger.info(`🤖 СОЗДАНИЕ ЭКЗЕМПЛЯРА БОТА`, {
    projectId,
    token: '***' + token.slice(-4),
    botSettings: botSettings
      ? {
          botUsername: botSettings.botUsername,
          isActive: botSettings.isActive
        }
      : null,
    component: 'bot-factory'
  });

  const proxyUrl = process.env.TELEGRAM_PROXY_URL;
  const apiRoot = process.env.TELEGRAM_API_ROOT;
  let bot: Bot<MyContext>;

  if (proxyUrl) {
    logger.info('Creating bot with proxy agent', {
      projectId,
      proxy: proxyUrl.replace(/:[^:]+@/, ':***@')
    });
    const agent = new HttpsProxyAgent(proxyUrl);
    bot = new Bot<MyContext>(token, {
      client: {
        apiRoot, // use custom apiRoot if provided
        baseFetchConfig: {
          agent
        }
      }
    });
  } else if (apiRoot) {
    logger.info('Creating bot with custom API root (Bridge)', {
      projectId,
      apiRoot
    });
    bot = new Bot<MyContext>(token, {
      client: {
        apiRoot
      }
    });
  } else {
    bot = new Bot<MyContext>(token);
  }

  // Настраиваем базовые middleware
  bot.use(BotSessionService.createSessionMiddleware(projectId));
  bot.use(BotSessionService.createActivityMiddleware());
  bot.use(BotSessionService.createTimeoutMiddleware());

  // Диагностический middleware для логирования всех сообщений
  bot.use(async (ctx, next) => {
    const updateType = ctx.update.message
      ? 'message'
      : ctx.update.callback_query
        ? 'callback_query'
        : ctx.update.inline_query
          ? 'inline_query'
          : 'other';

    logger.info(`📨 Получено обновление от пользователя`, {
      fromId: ctx.from?.id,
      username: ctx.from?.username,
      updateType,
      updateId: ctx.update.update_id,
      projectId,
      component: 'telegram-bot'
    });

    await next();
  });

  // ✨ Deduplication для callback queries - предотвращает повторную обработку
  const processedCallbacks = new Set<string>();

  // Очистка старых callback IDs каждые 5 минут
  setInterval(
    () => {
      processedCallbacks.clear();
      logger.debug('🧹 Cleared processed callbacks cache');
    },
    5 * 60 * 1000
  );

  // Middleware для обработки через Workflow
  bot.use(async (ctx, next) => {
    try {
      // Получаем projectId из сессии
      const projectId = ctx.session?.projectId;
      if (!projectId) {
        logger.warn('⚠️ НЕТ projectId В СЕССИИ ПРИ CALLBACK!', {
          hasSession: !!ctx.session,
          sessionKeys: ctx.session ? Object.keys(ctx.session) : [],
          hasCallbackQuery: !!ctx.callbackQuery,
          callbackData: ctx.callbackQuery?.data,
          chatId: ctx.chat?.id,
          userId: ctx.from?.id
        });
        await next();
        return;
      }

      // Определяем тип триггера
      let trigger: 'start' | 'message' | 'callback' = 'message';
      if (ctx.message?.text?.startsWith('/start')) {
        trigger = 'start';
      } else if (ctx.callbackQuery) {
        trigger = 'callback';

        // ✅ КРИТИЧНО: Deduplication для callback queries
        const callbackId = ctx.callbackQuery.id;
        if (processedCallbacks.has(callbackId)) {
          logger.warn('⚠️ Duplicate callback query detected, skipping', {
            callbackId,
            callbackData: ctx.callbackQuery.data,
            projectId
          });
          // Отвечаем на callback чтобы убрать "часики"
          await ctx.answerCallbackQuery().catch(() => {});
          return; // Прерываем обработку дубликата
        }

        // Помечаем как обработанный
        processedCallbacks.add(callbackId);

        // ✅ КРИТИЧНО: Немедленно отвечаем на callback query
        // Это предотвращает повторную отправку от Telegram
        ctx.answerCallbackQuery().catch((err) => {
          logger.error('Failed to answer callback query', {
            error: err.message,
            callbackId
          });
        });
      }

      logger.info('🔍 Проверка наличия активного workflow', {
        trigger,
        projectId,
        userId: ctx.from?.id
      });

      // Партнёрский кабинет: approve/reject, фильтры команды, заявки — до workflow
      if (trigger === 'callback' && ctx.callbackQuery?.data) {
        const data = ctx.callbackQuery.data;
        const isPartnerCabinet =
          data.startsWith('partner_join_') ||
          data.startsWith('partner_team_remove:') ||
          data.startsWith('partner_team_tab:') ||
          data.startsWith('partner_team_page:') ||
          data === 'partner_requests';

        if (isPartnerCabinet) {
          const handled = await PartnerCabinetService.tryHandleTelegramCallback(
            projectId,
            ctx
          );
          if (handled) return;
        }
      }

      // Проверяем наличие активного workflow ДО выполнения
      const hasActiveWorkflow =
        await WorkflowRuntimeService.hasActiveWorkflow(projectId);

      if (!hasActiveWorkflow) {
        logger.warn(
          'Активный workflow не найден — сообщение уйдёт в fallback (часто без ответа на /start)',
          {
            projectId,
            trigger,
            hint: 'Проверьте в БД: workflows.is_active=true и активная workflow_versions для проекта; сбросьте Redis-кэш workflow.',
            component: 'telegram-bot'
          }
        );
        // Только если workflow вообще не существует, идём к fallback
        await next();
        return;
      }

      // Выполняем workflow через новый сервис
      logger.info('🚀 Выполнение workflow', {
        trigger,
        projectId,
        userId: ctx.from?.id
      });
      const processed = await WorkflowRuntimeService.executeWorkflow(
        projectId,
        trigger,
        ctx
      );

      logger.info('📊 Результат выполнения workflow', {
        processed,
        processedType: typeof processed,
        processedBoolean: Boolean(processed),
        projectId,
        trigger,
        userId: ctx.from?.id
      });

      // 🔄 ДЛЯ CALLBACK QUERIES: Если workflow не обработал callback, позволяем fallback handler'у
      if (trigger === 'callback' && !processed) {
        logger.warn(
          '⚠️ Workflow вернул false для callback, но продолжаем обработку',
          {
            projectId,
            callbackData: ctx.callbackQuery?.data,
            trigger
          }
        );
        // НЕ передаем в fallback handler, чтобы не показывать ошибку пользователю
        // Просто отвечаем на callback query и завершаем
        if (ctx.callbackQuery) {
          await ctx.answerCallbackQuery({
            text: 'Обработка...'
          });
        }
        return;
      }

      // ✅ КРИТИЧНО: Для сообщений и успешно обработанных workflow - всегда останавливаем middleware
      // Это предотвращает дублирование сообщений
      return;
    } catch (error) {
      logger.error('💥 Критическая ошибка при обработке workflow', {
        projectId: ctx.session?.projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // ✅ При критической ошибке тоже НЕ вызываем fallback
      // Workflow уже мог отправить сообщения
      return;
    }
  });

  // ==========================================
  // FALLBACK ОБРАБОТЧИКИ (если нет workflow)
  // ==========================================

  // Диагностическая команда для проверки работы бота
  bot.command('test', async (ctx) => {
    logger.info('Обработка команды /test (fallback)', { projectId });
    await ctx.reply(
      '✅ Бот работает! Команда /test получена и обработана.\n\n⚠️ Активный workflow не найден, используется fallback режим.'
    );
  });

  // Fallback для команды /start
  bot.command('start', async (ctx) => {
    logger.info('Обработка команды /start (fallback)', { projectId });

    await ctx.reply(
      '👋 Добро пожаловать!\n\n' +
        '⚠️ Для этого бота не настроен активный сценарий (workflow).\n\n' +
        '📝 Администратор должен:\n' +
        '1. Перейти в раздел "Шаблоны ботов"\n' +
        '2. Выбрать шаблон \n' +
        '3. Установить его для этого проекта\n' +
        '4. Активировать workflow\n\n' +
        '💡 После этого бот будет работать по настроенному сценарию.'
    );
  });

  // Fallback для всех остальных сообщений
  bot.on('message', async (ctx) => {
    logger.info('Обработка сообщения (fallback)', {
      projectId,
      messageType: ctx.message.text ? 'text' : 'other'
    });

    await ctx.reply(
      '⚠️ Бот работает в режиме fallback.\n\n' +
        'Для полноценной работы необходимо настроить и активировать workflow в панели управления.'
    );
  });

  // Fallback для callback queries
  bot.on('callback_query', async (ctx) => {
    // 🔥 ДИАГНОСТИКА: Этот handler НЕ должен срабатывать, если есть активный workflow!
    logger.warn('⚠️ CALLBACK QUERY INTERCEPTED BY FALLBACK HANDLER!', {
      projectId,
      callbackData: ctx.callbackQuery.data,
      sessionProjectId: ctx.session?.projectId,
      userId: ctx.from?.id,
      chatId: ctx.chat?.id
    });

    logger.info('Обработка callback (fallback)', {
      projectId,
      data: ctx.callbackQuery.data
    });

    await ctx.answerCallbackQuery({
      text: '⚠️ Workflow не настроен'
    });

    await ctx.reply(
      '⚠️ Для обработки действий необходимо настроить workflow в панели управления.'
    );
  });

  logger.info(`✅ Бот создан успешно`, {
    projectId,
    component: 'bot-factory'
  });

  return bot;
}
