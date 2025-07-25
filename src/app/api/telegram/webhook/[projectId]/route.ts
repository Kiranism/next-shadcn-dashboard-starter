/**
 * @file: src/app/api/telegram/webhook/[projectId]/route.ts
 * @description: Webhook endpoint для обработки сообщений Telegram ботов
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, Grammy, BotManager
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { botManager } from '@/lib/telegram/bot-manager';

// POST /api/telegram/webhook/[projectId] - Webhook для обработки сообщений
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Получаем webhook handler для проекта
    const webhookHandler = botManager.getWebhookHandler(projectId);
    
    if (!webhookHandler) {
      console.error(`❌ Webhook handler не найден для проекта: ${projectId}`);
      return NextResponse.json(
        { error: 'Bot not found or inactive' },
        { status: 404 }
      );
    }

    // Получаем тело запроса
    const body = await request.text();
    
    // Создаем объект Request для Grammy
    const gramRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: body
    });

    // Обрабатываем запрос через Grammy webhook handler
    const response = await webhookHandler(gramRequest);
    
    // Логируем обработку сообщения
    console.log(`📨 Webhook обработан для проекта ${projectId}`);

    // Возвращаем ответ
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers
    });

  } catch (error) {
    console.error('Ошибка обработки webhook:', error);
    
    // Возвращаем 200 для Telegram, чтобы избежать повторных отправок
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

// GET /api/telegram/webhook/[projectId] - Проверка состояния webhook
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Проверяем состояние бота
    const botHealth = await botManager.checkBotHealth(projectId);
    
    return NextResponse.json({
      projectId,
      ...botHealth,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Ошибка проверки состояния бота:', error);
    return NextResponse.json(
      { error: 'Ошибка проверки состояния бота' },
      { status: 500 }
    );
  }
}
