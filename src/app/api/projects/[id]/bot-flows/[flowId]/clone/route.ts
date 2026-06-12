/**
 * @file: src/app/api/projects/[id]/bot-flows/[flowId]/clone/route.ts
 * @description: API для клонирования потока бота
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

const cloneFlowSchema = z.object({
  name: z.string().min(1).max(255)
});

// POST /api/projects/[id]/bot-flows/[flowId]/clone - Клонирование потока
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { flowId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;
    const body = await request.json();

    // Валидация
    const { name } = cloneFlowSchema.parse(body);

    logger.info('Клонирование потока бота', { flowId, newName: name });

    const clonedFlow = await BotFlowService.cloneFlow(flowId, name);

    return NextResponse.json(
      {
        success: true,
        data: clonedFlow
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

    logger.error('Ошибка клонирования потока бота', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка клонирования потока бота'
      },
      { status: 500 }
    );
  }
}
