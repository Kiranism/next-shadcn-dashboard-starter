/**
 * @file: src/app/api/projects/[id]/flows/[flowId]/export/route.ts
 * @description: API для экспорта потоков бота
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, BotFlowService
 * @created: 2025-10-01
 * @author: AI Assistant + User
 */

import { NextResponse } from 'next/server';
import { BotFlowService } from '@/lib/services/bot-flow.service';
import { logger } from '@/lib/logger';
import { requireProjectAccess } from '@/lib/with-project-access';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; flowId: string }> }
) {
  try {
    const { id: projectId, flowId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    logger.info('GET /api/projects/[id]/flows/[flowId]/export', {
      projectId,
      flowId
    });

    // Получаем поток
    const flow = await BotFlowService.getFlowById(flowId);
    if (!flow || flow.projectId !== projectId) {
      return NextResponse.json(
        { success: false, error: 'Поток не найден' },
        { status: 404 }
      );
    }

    // Создаем объект для экспорта
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      type: 'bot-flow',
      data: {
        id: flow.id,
        name: flow.name,
        description: flow.description,
        version: flow.version,
        nodes: flow.nodes,
        connections: flow.connections,
        variables: flow.variables,
        settings: flow.settings,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt
      },
      metadata: {
        projectId: flow.projectId,
        nodeCount: flow.nodes.length,
        connectionCount: flow.connections.length,
        variableCount: flow.variables?.length || 0
      }
    };

    // Устанавливаем заголовки для скачивания файла
    const fileName = `bot-flow-${flow.name.replace(/[^a-zA-Z0-9]/g, '-')}-${flowId.slice(-8)}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (error) {
    logger.error('Failed to export flow', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось экспортировать поток'
      },
      { status: 500 }
    );
  }
}
