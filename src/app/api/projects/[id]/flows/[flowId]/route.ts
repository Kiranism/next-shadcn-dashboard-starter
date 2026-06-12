/**
 * @file: src/app/api/projects/[id]/flows/[flowId]/route.ts
 * @description: API для управления конкретным потоком бота
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, BotFlowService
 * @created: 2025-09-30
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { BotFlowService } from '@/lib/services/bot-flow.service';
import { logger } from '@/lib/logger';
import { requireProjectAccess } from '@/lib/with-project-access';
import type { UpdateFlowRequest } from '@/types/bot-constructor';

// GET /api/projects/[id]/flows/[flowId] - Получение потока по ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { id: projectId, flowId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    logger.info('GET /api/projects/[id]/flows/[flowId]', { projectId, flowId });

    const flow = await BotFlowService.getFlowById(flowId);

    if (!flow || flow.projectId !== projectId) {
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
      flow
    });
  } catch (error) {
    const { id: projectId, flowId } = await context.params;
    logger.error('Failed to get flow', {
      projectId,
      flowId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось получить поток'
      },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/flows/[flowId] - Обновление потока
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { id: projectId, flowId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;
    const body: UpdateFlowRequest = await request.json();

    logger.info('PUT /api/projects/[id]/flows/[flowId]', { projectId, flowId });

    // Проверяем существование потока
    const existingFlow = await BotFlowService.getFlowById(flowId);
    if (!existingFlow || existingFlow.projectId !== projectId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Поток не найден'
        },
        { status: 404 }
      );
    }

    // Валидируем входные данные
    if (body.name !== undefined && !body.name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Название потока не может быть пустым'
        },
        { status: 400 }
      );
    }

    const flow = await BotFlowService.updateFlow(flowId, body);

    return NextResponse.json({
      success: true,
      flow
    });
  } catch (error) {
    const { id: projectId, flowId } = await context.params;
    logger.error('Failed to update flow', {
      projectId,
      flowId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось обновить поток'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/flows/[flowId] - Удаление потока
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { id: projectId, flowId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    logger.info('DELETE /api/projects/[id]/flows/[flowId]', {
      projectId,
      flowId
    });

    // Проверяем существование потока
    const existingFlow = await BotFlowService.getFlowById(flowId);
    if (!existingFlow || existingFlow.projectId !== projectId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Поток не найден'
        },
        { status: 404 }
      );
    }

    await BotFlowService.deleteFlow(flowId);

    return NextResponse.json({
      success: true,
      message: 'Поток успешно удален'
    });
  } catch (error) {
    const { id: projectId, flowId } = await context.params;
    logger.error('Failed to delete flow', {
      projectId,
      flowId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось удалить поток'
      },
      { status: 500 }
    );
  }
}
