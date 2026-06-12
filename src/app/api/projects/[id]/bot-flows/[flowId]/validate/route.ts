/**
 * @file: src/app/api/projects/[id]/bot-flows/[flowId]/validate/route.ts
 * @description: API для валидации потока бота
 * @project: SaaS Bonus System
 * @dependencies: Next.js, BotFlowService
 * @created: 2025-10-02
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { BotFlowService } from '@/lib/services/bot-flow.service';
import { logger } from '@/lib/logger';
import { requireProjectAccess } from '@/lib/with-project-access';

// POST /api/projects/[id]/bot-flows/[flowId]/validate - Валидация потока
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { flowId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    logger.info('Валидация потока бота', { flowId });

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

    const validation = BotFlowService.validateFlow(
      flow.nodes,
      flow.connections
    );

    return NextResponse.json({
      success: true,
      data: validation
    });
  } catch (error) {
    logger.error('Ошибка валидации потока бота', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка валидации потока бота'
      },
      { status: 500 }
    );
  }
}
