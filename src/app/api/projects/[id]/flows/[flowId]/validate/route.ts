/**
 * @file: src/app/api/projects/[id]/flows/[flowId]/validate/route.ts
 * @description: API для валидации и компиляции потока бота
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, BotFlowService
 * @created: 2025-09-30
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { BotFlowService } from '@/lib/services/bot-flow.service';
import { logger } from '@/lib/logger';
import { requireProjectAccess } from '@/lib/with-project-access';

// POST /api/projects/[id]/flows/[flowId]/validate - Валидация и компиляция потока
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { id: projectId, flowId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    logger.info('POST /api/projects/[id]/flows/[flowId]/validate', {
      projectId,
      flowId
    });

    // Получаем поток
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

    // Валидируем поток
    const validation = BotFlowService.validateFlow(
      flow.nodes,
      flow.connections
    );

    // Компилируем поток
    const compilation = BotFlowService.compileFlow(flow);

    return NextResponse.json({
      success: true,
      validation,
      compilation
    });
  } catch (error) {
    const { id: projectId, flowId } = await context.params;
    logger.error('Failed to validate flow', {
      projectId,
      flowId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось выполнить валидацию'
      },
      { status: 500 }
    );
  }
}
