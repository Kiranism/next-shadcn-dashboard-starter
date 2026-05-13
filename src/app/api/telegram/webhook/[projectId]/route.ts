/**
 * @file: src/app/api/telegram/webhook/[projectId]/route.ts
 * @description: Webhook endpoint для обработки сообщений Telegram ботов
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, Grammy, BotManager
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { botManager, ensureBotsInitialized } from '@/lib/telegram/bot-manager';
import { logger } from '@/lib/logger';

// POST /api/telegram/webhook/[projectId] - Webhook для обработки сообщений
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;

    logger.info(`📥 Получен webhook запрос`, {
      projectId,
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      component: 'telegram-webhook'
    });

    // ✅ КРИТИЧНО: Убеждаемся что боты инициализированы
    await ensureBotsInitialized();

    const body = await request.text();

    let updateSummary: Record<string, unknown> = { rawLength: body.length };
    try {
      const u = JSON.parse(body) as {
        update_id?: number;
        message?: {
          text?: string;
          contact?: unknown;
          chat?: { id?: number };
        };
        callback_query?: { data?: string; id?: string };
      };
      updateSummary = {
        update_id: u.update_id,
        chatId: u.message?.chat?.id,
        hasMessageText: !!u.message?.text,
        messageTextPreview: u.message?.text?.slice(0, 120),
        hasContact: !!u.message?.contact,
        hasCallback: !!u.callback_query,
        callbackData: u.callback_query?.data
      };
    } catch {
      updateSummary.parseError = true;
    }

    const webhookHandler = await botManager.getWebhookHandler(projectId);

    logger.info('telegram-webhook: update summary', {
      projectId,
      ...updateSummary,
      hasWebhookHandler: !!webhookHandler,
      component: 'telegram-webhook'
    });

    if (!webhookHandler) {
      logger.error(`❌ Webhook handler не найден для проекта`, {
        projectId,
        ...updateSummary,
        component: 'telegram-webhook'
      });
      return NextResponse.json(
        { error: 'Bot not found or inactive' },
        { status: 404 }
      );
    }

    // Создаем объект Request для Grammy
    const gramRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: body
    });

    // Обрабатываем запрос через Grammy webhook handler
    const response = await webhookHandler(gramRequest);

    // Логируем обработку сообщения
    logger.info(`📨 Webhook обработан для проекта`, {
      projectId,
      status: response.status,
      component: 'telegram-webhook'
    });

    // Возвращаем ответ
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    logger.error('Ошибка обработки webhook', {
      projectId: (await context.params).projectId,
      error: error instanceof Error ? error.message : 'Unknown error',
      component: 'telegram-webhook'
    });

    // Возвращаем 200 для Telegram, чтобы избежать повторных отправок
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

// GET /api/telegram/webhook/[projectId] - Проверка состояния webhook
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;

    // Проверяем состояние бота
    const botHealth = await botManager.checkBotHealth(projectId);

    return NextResponse.json({
      projectId,
      ...botHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Ошибка проверки состояния бота', {
      projectId: (await context.params).projectId,
      error: error instanceof Error ? error.message : 'Unknown error',
      component: 'telegram-webhook'
    });
    return NextResponse.json(
      { error: 'Ошибка проверки состояния бота' },
      { status: 500 }
    );
  }
}
