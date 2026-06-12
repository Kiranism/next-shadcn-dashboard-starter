/**
 * @file: src/app/api/projects/[id]/bot-flows/route.ts
 * @description: API для управления потоками бота (конструктор)
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

// Схема валидации для создания потока
const createFlowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  nodes: z.array(z.any()).optional(),
  connections: z.array(z.any()).optional(),
  variables: z.array(z.any()).optional(),
  settings: z.record(z.any()).optional()
});

// GET /api/projects/[id]/bot-flows - Получение всех потоков проекта
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    logger.info('Получение потоков бота', { projectId });

    const flows = await BotFlowService.getFlowsByProject(projectId);

    return NextResponse.json({
      success: true,
      data: flows
    });
  } catch (error) {
    logger.error('Ошибка получения потоков бота', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка получения потоков бота'
      },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/bot-flows - Создание нового потока
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;
    const body = await request.json();

    // Валидация
    const data = createFlowSchema.parse(body);

    logger.info('Создание нового потока бота', {
      projectId,
      flowName: data.name
    });

    const flow = await BotFlowService.createFlow(projectId, {
      name: data.name,
      description: data.description,
      nodes: data.nodes || [],
      connections: data.connections || [],
      variables: data.variables || [],
      settings: data.settings || {}
    });

    return NextResponse.json(
      {
        success: true,
        data: flow
      },
      { status: 201 }
    );
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

    logger.error('Ошибка создания потока бота', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка создания потока бота'
      },
      { status: 500 }
    );
  }
}
