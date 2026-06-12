/**
 * @file: src/app/api/projects/[id]/bot-flows/[flowId]/route.ts
 * @description: API для управления конкретным потоком бота
 * @project: SaaS Bonus System
 * @dependencies: Next.js, BotFlowService
 * @created: 2025-10-02
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { BotFlowService } from '@/lib/services/bot-flow.service';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { requireProjectAccess } from '@/lib/with-project-access';

// Схема валидации для обновления потока
const updateFlowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  nodes: z.array(z.any()).optional(),
  connections: z.array(z.any()).optional(),
  variables: z.array(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  isActive: z.boolean().optional()
});

// GET /api/projects/[id]/bot-flows/[flowId] - Получение конкретного потока
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { flowId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    logger.info('Получение потока бота', { flowId });

    const flow = await BotFlowService.getFlowById(flowId);

    if (!flow) {
      return NextResponse.json(
        {
          success: false,
          error: 'Поток не найден'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: flow
    });
  } catch (error) {
    logger.error('Ошибка получения потока бота', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка получения потока бота'
      },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/bot-flows/[flowId] - Обновление потока
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { flowId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;
    const body = await request.json();

    // Валидация
    const data = updateFlowSchema.parse(body);

    logger.info('Обновление потока бота', { flowId });

    const flow = await BotFlowService.updateFlow(flowId, data);

    return NextResponse.json({
      success: true,
      data: flow
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ошибка валидации',
          details: error.errors
        },
        { status: 400 }
      );
    }

    logger.error('Ошибка обновления потока бота', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка обновления потока бота'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/bot-flows/[flowId] - Удаление потока
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { flowId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    logger.info('Удаление потока бота', { flowId });

    await BotFlowService.deleteFlow(flowId);

    return NextResponse.json({
      success: true,
      message: 'Поток успешно удален'
    });
  } catch (error) {
    logger.error('Ошибка удаления потока бота', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка удаления потока бота'
      },
      { status: 500 }
    );
  }
}
