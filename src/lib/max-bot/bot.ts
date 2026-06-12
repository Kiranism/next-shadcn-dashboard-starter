/**
 * @file: src/lib/max-bot/bot.ts
 * @description: Фабрика создания MAX ботов с поддержкой Workflow
 * @project: SaaS Bonus System
 * @dependencies: @maxhub/max-bot-api, WorkflowRuntimeService
 * @created: 2026-03-22
 * @author: AI Assistant + User
 */

import { Bot, Context } from '@maxhub/max-bot-api';
import { logger } from '@/lib/logger';
import { WorkflowRuntimeService } from '@/lib/services/workflow-runtime.service';

/**
 * Создание экземпляра MAX бота с поддержкой Workflow
 */
export function createMaxBot(token: string, projectId: string) {
  logger.info(`🤖 [MAX] СОЗДАНИЕ ЭКЗЕМПЛЯРА БОТА`, {
    projectId,
    token: '***' + token.slice(-4),
    component: 'max-bot-factory'
  });

  const bot = new Bot(token);

  // Middleware для логирования всех обновлений
  bot.use(async (ctx: Context, next: () => Promise<void>) => {
    const updateType = ctx.updateType;

    logger.info(`📨 [MAX] Получено обновление`, {
      fromId: ctx.user?.user_id,
      username: ctx.user?.username,
      updateType,
      chatId: ctx.chatId,
      projectId,
      component: 'max-bot'
    });

    await next();
  });

  // Middleware для обработки через Workflow
  bot.use(async (ctx: Context, next: () => Promise<void>) => {
    try {
      const hasActiveWorkflow =
        await WorkflowRuntimeService.hasActiveWorkflow(projectId);

      if (!hasActiveWorkflow) {
        logger.debug('[MAX] Активный workflow не найден, используем fallback', {
          projectId
        });
        await next();
        return;
      }

      // Определяем тип триггера
      let trigger: 'start' | 'message' | 'callback' = 'message';

      if (
        ctx.updateType === 'bot_started' ||
        ctx.message?.body?.text?.startsWith('/start')
      ) {
        trigger = 'start';
      } else if (ctx.updateType === 'message_callback') {
        trigger = 'callback';
      }

      logger.info('[MAX] 🚀 Выполнение workflow', {
        trigger,
        projectId,
        userId: ctx.user?.user_id
      });

      // Адаптируем контекст MAX под формат, совместимый с executeWorkflow
      const adaptedContext = adaptMaxContextForWorkflow(ctx, projectId);

      const processed = await WorkflowRuntimeService.executeWorkflow(
        projectId,
        trigger,
        adaptedContext
      );

      if (!processed) {
        await next();
      }
      return;
    } catch (error) {
      logger.error('[MAX] 💥 Критическая ошибка при обработке workflow', {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }
  });

  // FALLBACK обработчики
  bot.on('bot_started', async (ctx: any) => {
    logger.info('[MAX] Обработка bot_started (fallback)', { projectId });

    await ctx.reply(
      '👋 Добро пожаловать!\n\n' +
        '⚠️ Для этого бота не настроен активный сценарий (workflow).\n\n' +
        '📝 Администратор должен настроить workflow в панели управления.'
    );
  });

  bot.on('message_created', async (ctx: any) => {
    logger.info('[MAX] Обработка message_created (fallback)', { projectId });
    await ctx.reply(
      '⚠️ Бот работает в режиме fallback.\n\nНеобходимо настроить workflow в панели управления.'
    );
  });

  bot.on('message_callback', async (ctx: any) => {
    logger.info('[MAX] Обработка message_callback (fallback)', { projectId });
    await ctx.answerOnCallback({
      notification: '⚠️ Workflow не настроен'
    });
  });

  logger.info(`✅ [MAX] Бот создан успешно`, {
    projectId,
    component: 'max-bot-factory'
  });

  return bot;
}

/**
 * Адаптирует контекст MAX под формат, ожидаемый WorkflowRuntimeService.executeWorkflow.
 * Маппинг повторяет структуру Grammy контекста (Telegram), чтобы workflow engine
 * мог работать прозрачно с обеими платформами.
 */
function adaptMaxContextForWorkflow(ctx: Context, projectId: string) {
  const chatId = ctx.chatId;
  const userId = ctx.user?.user_id;
  const username = ctx.user?.username;
  const firstName = ctx.user?.name; // MAX: user.name, не first_name
  const messageText = ctx.message?.body?.text;
  const callbackPayload = ctx.callback?.payload;

  // MAX contactInfo: { tel?: string, fullName?: string }
  // Telegram contact: { phone_number, first_name, last_name, user_id, vcard }
  const contactInfo = (ctx as any).contactInfo;
  const telegramStyleContact = contactInfo
    ? {
        phone_number: contactInfo.tel,
        first_name: contactInfo.fullName || firstName,
        user_id: userId ? String(userId) : undefined
      }
    : null;

  return {
    // Имитируем структуру Grammy контекста
    chat: chatId ? { id: chatId } : undefined,
    from: userId ? { id: userId, username, first_name: firstName } : undefined,
    message:
      messageText || telegramStyleContact
        ? {
            text: messageText || undefined,
            chat: chatId ? { id: chatId } : undefined,
            contact: telegramStyleContact
          }
        : undefined,
    callbackQuery: callbackPayload
      ? {
          data: callbackPayload,
          from: userId
            ? { id: userId, username, first_name: firstName }
            : undefined,
          message: chatId ? { chat: { id: chatId } } : undefined
        }
      : undefined,
    // Дополнительные поля для platform-aware обработки
    _platform: 'max' as const,
    _maxContext: ctx,
    _projectId: projectId
  };
}
