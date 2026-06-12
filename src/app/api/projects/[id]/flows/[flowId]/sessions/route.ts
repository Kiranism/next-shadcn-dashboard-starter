/**
 * @file: src/app/api/projects/[id]/flows/[flowId]/sessions/route.ts
 * @description: API для управления сессиями потока бота
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, BotFlowService
 * @created: 2025-09-30
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { BotFlowService } from '@/lib/services/bot-flow.service';
import { logger } from '@/lib/logger';
import { requireProjectAccess } from '@/lib/with-project-access';

// GET /api/projects/[id]/flows/[flowId]/sessions - Получение активных сессий потока
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { id: projectId, flowId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    logger.info('GET /api/projects/[id]/flows/[flowId]/sessions', {
      projectId,
      flowId
    });

    // Получаем поток для проверки существования
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

    // В будущем здесь будет логика получения сессий
    // Пока возвращаем пустой массив
    const sessions = [];

    return NextResponse.json({
      success: true,
      sessions,
      total: 0
    });
  } catch (error) {
    const { id: projectId, flowId } = await context.params;
    logger.error('Failed to get flow sessions', {
      projectId,
      flowId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось получить сессии'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/flows/[flowId]/sessions - Очистка всех сессий потока
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { id: projectId, flowId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    logger.info('DELETE /api/projects/[id]/flows/[flowId]/sessions', {
      projectId,
      flowId
    });

    // Получаем поток для проверки существования
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

    // В будущем здесь будет логика очистки сессий
    // Пока просто возвращаем успех
    const cleanedCount = 0;

    return NextResponse.json({
      success: true,
      message: `Очищено ${cleanedCount} сессий`
    });
  } catch (error) {
    const { id: projectId, flowId } = await context.params;
    logger.error('Failed to cleanup flow sessions', {
      projectId,
      flowId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось очистить сессии'
      },
      { status: 500 }
    );
  }
}
