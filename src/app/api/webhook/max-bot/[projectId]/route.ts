/**
 * @file: src/app/api/webhook/max-bot/[projectId]/route.ts
 * @description: Webhook endpoint для обработки обновлений MAX Bot
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, MaxBotManager
 * @created: 2026-06-13
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { maxBotManager } from '@/lib/max-bot/bot-manager';
import { logger } from '@/lib/logger';

type WebhookRuntimeStats = {
  totalRequests: number;
  parseErrors: number;
  handlerErrors: number;
  lastReceivedAt?: string;
  lastHandledAt?: string;
  lastUpdateType?: string;
  lastResponseStatus?: number;
  lastError?: string;
};

const globalForWebhookStats = globalThis as typeof globalThis & {
  maxWebhookStats?: Map<string, WebhookRuntimeStats>;
};

const webhookStats =
  globalForWebhookStats.maxWebhookStats ??
  new Map<string, WebhookRuntimeStats>();
globalForWebhookStats.maxWebhookStats = webhookStats;

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

// POST /api/webhook/max-bot/[projectId] - Webhook для обработки сообщений MAX
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const startedAt = Date.now();
  const runtimeStats = getOrCreateWebhookStats(projectId);

  try {
    runtimeStats.totalRequests += 1;
    runtimeStats.lastReceivedAt = new Date().toISOString();

    const bodyText = await request.text();
    let update: any;
    try {
      update = JSON.parse(bodyText);
      runtimeStats.lastUpdateType = update.update_type;
    } catch (parseError) {
      runtimeStats.parseErrors += 1;
      logger.warn('[MAX-Webhook] Не удалось распарсить JSON тела вебхука', {
        projectId,
        bodyPreview: bodyText.slice(0, 200)
      });
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    logger.info('[MAX-Webhook] Получен вебхук', {
      projectId,
      updateType: update.update_type,
      timestamp: update.timestamp
    });

    const bot = await maxBotManager.getBotForWebhook(projectId);
    if (!bot) {
      logger.error('[MAX-Webhook] Бот не найден или не активен для проекта', {
        projectId
      });
      return NextResponse.json({ error: 'Bot not found or inactive' }, { status: 404 });
    }

    // Обрабатываем обновление через встроенный handleUpdate бота
    await (bot as any).handleUpdate(update);

    runtimeStats.lastHandledAt = new Date().toISOString();
    runtimeStats.lastResponseStatus = 200;

    return NextResponse.json({ ok: true });
  } catch (error) {
    runtimeStats.handlerErrors += 1;
    runtimeStats.lastError = error instanceof Error ? error.message : 'Unknown error';

    logger.error('[MAX-Webhook] Ошибка при обработке вебхука', {
      projectId,
      error: runtimeStats.lastError,
      durationMs: Date.now() - startedAt
    });

    // Возвращаем 200 на платформу MAX даже при ошибках обработки, чтобы избежать бесконечного повтора
    return NextResponse.json({ ok: true });
  }
}

// GET /api/webhook/max-bot/[projectId] - Проверка состояния webhook
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const runtimeStats = webhookStats.get(projectId) ?? null;
    
    // Получаем бота
    const bot = await maxBotManager.getBotForWebhook(projectId);
    if (!bot) {
      return NextResponse.json({
        projectId,
        isRunning: false,
        error: 'Бот не найден или не настроен'
      });
    }

    let webhookSubscription: any = null;
    let error: string | undefined;

    try {
      // Получаем список активных подписок бота
      const response = await (bot.api.raw as any).client.call({
        method: 'subscriptions',
        options: {
          method: 'GET'
        }
      });
      webhookSubscription = response.data;
    } catch (apiError) {
      error = apiError instanceof Error ? apiError.message : 'Unknown API error';
    }

    return NextResponse.json({
      projectId,
      isRunning: true,
      runtimeStats,
      webhookSubscription,
      error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('[MAX-Webhook] Ошибка при получении статуса вебхука', {
      projectId: (await context.params).projectId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
