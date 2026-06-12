/**
 * @file: src/app/api/projects/[id]/flows/route.ts
 * @description: API для управления потоками бота в конструкторе
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, BotFlowService
 * @created: 2025-09-30
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { BotFlowService } from '@/lib/services/bot-flow.service';
import { logger } from '@/lib/logger';
import { requireProjectAccess } from '@/lib/with-project-access';
import type {
  CreateFlowRequest,
  UpdateFlowRequest
} from '@/types/bot-constructor';

// GET /api/projects/[id]/flows - Получение всех потоков проекта
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    logger.info('GET /api/projects/[id]/flows', { projectId });

    // Проверяем существование проекта
    const { db } = await import('@/lib/db');
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      logger.warn('Project not found', { projectId });
      return NextResponse.json(
        { success: false, error: 'Проект не найден' },
        { status: 404 }
      );
    }

    const flows = await BotFlowService.getFlowsByProject(projectId);

    return NextResponse.json({
      success: true,
      flows
    });
  } catch (error) {
    const { id: projectId } = await context.params;
    logger.error('Failed to get flows', {
      projectId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось получить список потоков'
      },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/flows - Создание нового потока
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;
    const body = await request.json();

    logger.info('POST /api/projects/[id]/flows', {
      projectId,
      bodyKeys: Object.keys(body),
      flowName: body.name
    });

    // Валидируем входные данные
    if (!body.name?.trim()) {
      logger.warn('Flow creation failed: name is required', {
        projectId,
        body
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Название потока обязательно'
        },
        { status: 400 }
      );
    }

    // Проверяем структуру данных
    if (body.nodes && !Array.isArray(body.nodes)) {
      logger.warn('Flow creation failed: nodes must be array', {
        projectId,
        nodesType: typeof body.nodes
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Неверный формат данных: nodes должен быть массивом'
        },
        { status: 400 }
      );
    }

    if (body.connections && !Array.isArray(body.connections)) {
      logger.warn('Flow creation failed: connections must be array', {
        projectId,
        connectionsType: typeof body.connections
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Неверный формат данных: connections должен быть массивом'
        },
        { status: 400 }
      );
    }

    logger.info('Creating flow with data', {
      projectId,
      name: body.name,
      nodesCount: body.nodes?.length || 0,
      connectionsCount: body.connections?.length || 0
    });

    const flow = await BotFlowService.createFlow(projectId, body);

    logger.info('Flow created successfully', {
      projectId,
      flowId: flow.id,
      flowName: flow.name
    });

    return NextResponse.json({
      success: true,
      flow
    });
  } catch (error) {
    const { id: projectId } = await context.params;
    logger.error('Failed to create flow', {
      projectId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось создать поток'
      },
      { status: 500 }
    );
  }
}
