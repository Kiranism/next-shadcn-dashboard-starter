/**
 * @file: src/app/api/projects/[id]/flows/import/route.ts
 * @description: API для импорта потоков бота
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, BotFlowService
 * @created: 2025-10-01
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { BotFlowService } from '@/lib/services/bot-flow.service';
import { logger } from '@/lib/logger';
import { requireProjectAccess } from '@/lib/with-project-access';
import type { CreateFlowRequest } from '@/types/bot-constructor';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;
    const body = await request.json();

    logger.info('POST /api/projects/[id]/flows/import', {
      projectId,
      importType: body.type
    });

    // Валидируем формат импорта
    if (!body.type || body.type !== 'bot-flow') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Неверный формат файла импорта. Ожидается файл экспорта потока бота.'
        },
        { status: 400 }
      );
    }

    if (!body.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Данные потока отсутствуют в файле импорта'
        },
        { status: 400 }
      );
    }

    const importData = body.data;

    // Валидируем обязательные поля
    if (!importData.name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Название потока обязательно'
        },
        { status: 400 }
      );
    }

    // Проверяем, что поток с таким именем не существует в проекте
    const existingFlows = await BotFlowService.getFlowsByProject(projectId);
    const nameExists = existingFlows.some(
      (flow) => flow.name === importData.name
    );

    let finalName = importData.name;
    if (nameExists) {
      // Добавляем суффикс для избежания конфликта
      let counter = 1;
      while (
        existingFlows.some(
          (flow) => flow.name === `${importData.name} (${counter})`
        )
      ) {
        counter++;
      }
      finalName = `${importData.name} (${counter})`;
    }

    // Создаем поток на основе импортированных данных
    const createData: CreateFlowRequest = {
      name: finalName,
      description:
        importData.description ||
        `Импортирован ${new Date().toLocaleDateString('ru-RU')}`,
      nodes: importData.nodes || [],
      connections: importData.connections || [],
      variables: importData.variables || [],
      settings: importData.settings || {}
    };

    const newFlow = await BotFlowService.createFlow(projectId, createData);

    logger.info('Flow imported successfully', {
      projectId,
      originalFlowId: importData.id,
      newFlowId: newFlow.id,
      newFlowName: newFlow.name
    });

    return NextResponse.json({
      success: true,
      flow: newFlow,
      message: nameExists
        ? `Поток импортирован как "${finalName}" (имя было изменено для избежания конфликта)`
        : 'Поток успешно импортирован'
    });
  } catch (error) {
    logger.error('Failed to import flow', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Не удалось импортировать поток'
      },
      { status: 500 }
    );
  }
}
