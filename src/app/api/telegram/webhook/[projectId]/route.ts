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

type WebhookRuntimeStats = {
  totalRequests: number;
  parseErrors: number;
  handlerErrors: number;
  lastReceivedAt?: string;
  lastHandledAt?: string;
  lastChatId?: number;
  lastUpdateId?: number;
  lastUserAgent?: string | null;
  lastSourceIp?: string | null;
  lastCfRay?: string | null;
  lastResponseStatus?: number;
  lastError?: string;
};

const globalForWebhookStats = globalThis as typeof globalThis & {
  telegramWebhookStats?: Map<string, WebhookRuntimeStats>;
};

const webhookStats =
  globalForWebhookStats.telegramWebhookStats ??
  new Map<string, WebhookRuntimeStats>();
globalForWebhookStats.telegramWebhookStats = webhookStats;

function getOrCreateWebhookStats(projectId: string): WebhookRuntimeStats {
  const existing = webhookStats.get(projectId);
  if (existing) return existing;

  const created: WebhookRuntimeStats = {
    totalRequests: 0,
    parseErrors: 0,
    handlerErrors: 0
  };
  webhookStats.set(projectId, created);
  return created;
}

// POST /api/telegram/webhook/[projectId] - Webhook для обработки сообщений
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const startedAt = Date.now();
  const forwardedFor = request.headers.get('x-forwarded-for');
  const sourceIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    (forwardedFor ? forwardedFor.split(',')[0]?.trim() : null);
  const runtimeStats = getOrCreateWebhookStats(projectId);

  try {
    runtimeStats.totalRequests += 1;
    runtimeStats.lastReceivedAt = new Date().toISOString();
    runtimeStats.lastUserAgent = request.headers.get('user-agent');
    runtimeStats.lastSourceIp = sourceIp || null;
    runtimeStats.lastCfRay = request.headers.get('cf-ray');

    logger.info(
      `📥 Получен webhook запрос`,
      {
        projectId,
        url: request.url,
        method: request.method,
        userAgent: runtimeStats.lastUserAgent,
        sourceIp,
        cfRay: runtimeStats.lastCfRay,
        contentType: request.headers.get('content-type'),
        contentLength: request.headers.get('content-length')
      },
      'telegram-webhook'
    );

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
      runtimeStats.lastUpdateId = u.update_id;
      runtimeStats.lastChatId = u.message?.chat?.id;
    } catch {
      updateSummary.parseError = true;
      runtimeStats.parseErrors += 1;
      logger.warn(
        'telegram-webhook: не удалось распарсить JSON body',
        {
          projectId,
          rawLength: body.length,
          bodyPreview: body.slice(0, 220)
        },
        'telegram-webhook'
      );
    }

    const webhookHandler = await botManager.getWebhookHandler(projectId);

    logger.info(
      'telegram-webhook: update summary',
      {
        projectId,
        ...updateSummary,
        hasWebhookHandler: !!webhookHandler
      },
      'telegram-webhook'
    );

    if (!webhookHandler) {
      logger.error(
        `❌ Webhook handler не найден для проекта`,
        {
          projectId,
          ...updateSummary
        },
        'telegram-webhook'
      );
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

    runtimeStats.lastHandledAt = new Date().toISOString();
    runtimeStats.lastResponseStatus = response.status;
    runtimeStats.lastError = undefined;

    // Логируем обработку сообщения
    logger.info(
      `📨 Webhook обработан для проекта`,
      {
        projectId,
        status: response.status,
        durationMs: Date.now() - startedAt
      },
      'telegram-webhook'
    );

    // Возвращаем ответ
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    runtimeStats.handlerErrors += 1;
    runtimeStats.lastError =
      error instanceof Error ? error.message : 'Unknown error';

    logger.error(
      'Ошибка обработки webhook',
      {
        projectId,
        error: runtimeStats.lastError,
        durationMs: Date.now() - startedAt
      },
      'telegram-webhook'
    );

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
    const runtimeStats = webhookStats.get(projectId) ?? null;

    // Проверяем состояние бота
    const botHealth = await botManager.checkBotHealth(projectId);
    const pendingUpdates = botHealth.webhookInfo?.pending_update_count ?? 0;

    const diagnostics: Record<string, unknown> = {
      hasRecentWebhookRequests: !!runtimeStats?.lastReceivedAt
    };

    if (runtimeStats?.lastReceivedAt) {
      const secondsSinceLastWebhook = Math.floor(
        (Date.now() - new Date(runtimeStats.lastReceivedAt).getTime()) / 1000
      );
      diagnostics.secondsSinceLastWebhook = secondsSinceLastWebhook;
      diagnostics.pendingUpdates = pendingUpdates;
      diagnostics.deliveryLikelyBlocked =
        pendingUpdates > 0 && secondsSinceLastWebhook > 120;
    } else if (pendingUpdates > 0) {
      diagnostics.pendingUpdates = pendingUpdates;
      diagnostics.deliveryLikelyBlocked = true;
    }

    return NextResponse.json({
      projectId,
      ...botHealth,
      runtimeStats,
      diagnostics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(
      'Ошибка проверки состояния бота',
      {
        projectId: (await context.params).projectId,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'telegram-webhook'
    );
    return NextResponse.json(
      { error: 'Ошибка проверки состояния бота' },
      { status: 500 }
    );
  }
}
