/**
 * @file: src/app/api/projects/[id]/flows/[flowId]/clone/route.ts
 * @description: API для клонирования потока бота
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, BotFlowService
 * @created: 2025-09-30
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { BotFlowService } from '@/lib/services/bot-flow.service';
import { logger } from '@/lib/logger';
import { requireProjectAccess } from '@/lib/with-project-access';

// POST /api/projects/[id]/flows/[flowId]/clone - Клонирование потока
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { id: projectId, flowId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;
    const body = await request.json();
    const { name } = body;

    logger.info('POST /api/projects/[id]/flows/[flowId]/clone', {
      projectId,
      flowId,
      newName: name
    });

    // Проверяем существование оригинального потока
    const originalFlow = await BotFlowService.getFlowById(flowId);
    if (!originalFlow || originalFlow.projectId !== projectId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Исходный поток не найден'
        },
        { status: 404 }
      );
    }

    // Валидируем новое имя
    if (!name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Название нового потока обязательно'
        },
        { status: 400 }
      );
    }

    const clonedFlow = await BotFlowService.cloneFlow(flowId, name.trim());

    return NextResponse.json({
      success: true,
      flow: clonedFlow
    });
  } catch (error) {
    const { id: projectId, flowId } = await context.params;
    logger.error('Failed to clone flow', {
      projectId,
      flowId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось клонировать поток'
      },
      { status: 500 }
    );
  }
}
