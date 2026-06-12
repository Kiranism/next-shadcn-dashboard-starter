/**
 * @file: src/app/api/projects/[id]/workflows/[workflowId]/route.ts
 * @description: API endpoints для управления конкретным workflow
 * @project: SaaS Bonus System
 * @dependencies: Next.js, Prisma, Workflow types, WorkflowValidator
 * @created: 2025-01-11
 * @updated: 2026-01-06
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { UpdateWorkflowRequest } from '@/types/workflow';
import { WorkflowRuntimeService } from '@/lib/services/workflow-runtime.service';
import { validateWorkflowServer } from '@/lib/services/workflow/server-workflow-validator';
import { normalizeNodes } from '@/lib/services/workflow/utils/node-utils';
import { requireProjectAccess } from '@/lib/with-project-access';

// GET /api/projects/[id]/workflows/[workflowId] - Получить workflow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; workflowId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: projectId, workflowId } = resolvedParams;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;

    const workflow = await db.workflow.findFirst({
      where: {
        id: workflowId,
        projectId
      }
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { error: 'Ошибка получения workflow' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/workflows/[workflowId] - Обновить workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; workflowId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: projectId, workflowId } = resolvedParams;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;
    const data: UpdateWorkflowRequest = await request.json();

    // Проверяем существование workflow
    const existingWorkflow = await db.workflow.findFirst({
      where: {
        id: workflowId,
        projectId
      }
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow не найден' },
        { status: 404 }
      );
    }

    // Если активируем workflow, деактивируем все остальные
    if (data.isActive) {
      await db.workflow.updateMany({
        where: {
          projectId,
          isActive: true,
          id: { not: workflowId }
        },
        data: {
          isActive: false
        }
      });
    }

    // Проверяем, нужно ли создавать новую версию
    const hasWorkflowData =
      data.nodes !== undefined ||
      data.connections !== undefined ||
      data.variables !== undefined ||
      data.settings !== undefined;

    // ✨ НОВОЕ: Валидация workflow перед сохранением (включая goto_node)
    if (hasWorkflowData && data.nodes && data.connections) {
      const validationResult = await validateWorkflowServer(
        data.nodes,
        data.connections
      );

      // Возвращаем ошибки валидации (только критические)
      const criticalErrors = validationResult.errors.filter(
        (e) => e.type === 'error'
      );
      if (criticalErrors.length > 0) {
        console.error(
          'Workflow validation failed during PUT:',
          JSON.stringify(criticalErrors, null, 2)
        );
        return NextResponse.json(
          {
            error: 'Ошибка валидации workflow',
            validationErrors: criticalErrors
          },
          { status: 400 }
        );
      }

      // Логируем предупреждения
      const warnings = validationResult.errors.filter(
        (e) => e.type === 'warning'
      );
      if (warnings.length > 0) {
        logger.warn('Workflow validation warnings', {
          projectId,
          workflowId,
          warnings
        });
      }
    }

    // Если активируем workflow и нет активной версии, создаем версию на основе текущих данных
    const needsVersion = data.isActive && !hasWorkflowData;

    let version: any = null;

    if (hasWorkflowData || needsVersion) {
      // Определяем entry node (первый trigger node)
      const rawNodes = data.nodes || existingWorkflow.nodes || [];
      const normalizedNodes = normalizeNodes(rawNodes);
      const nodesArray = Object.values(normalizedNodes);

      console.log('Creating workflow version with nodes:', {
        hasWorkflowData,
        needsVersion,
        dataNodesCount: data.nodes?.length,
        nodesLength: nodesArray.length
      });

      const entryNode = nodesArray.find((node: any) =>
        node.type?.startsWith('trigger.')
      );

      if (!entryNode) {
        console.error('No entry node found in workflow', {
          nodes: nodesArray.map((n: any) => ({ id: n.id, type: n.type }))
        });
        return NextResponse.json(
          { error: 'Workflow должен содержать хотя бы один trigger node' },
          { status: 400 }
        );
      }

      console.log('Entry node found:', {
        id: entryNode.id,
        type: entryNode.type
      });

      // Создаем новую версию workflow

      // Получаем текущую активную версию для деактивации
      const currentVersion = await db.workflowVersion.findFirst({
        where: { workflowId, isActive: true },
        orderBy: { version: 'desc' }
      });

      // Fix: Ищем максимальную версию среди ВСЕХ версий, чтобы избежать конфликтов уникальности
      const latestVersion = await db.workflowVersion.findFirst({
        where: { workflowId },
        orderBy: { version: 'desc' }
      });

      const newVersionNumber = (latestVersion?.version || 0) + 1;

      version = await db.workflowVersion.create({
        data: {
          workflowId,
          version: newVersionNumber,
          nodes: JSON.parse(
            JSON.stringify(data.nodes || existingWorkflow.nodes)
          ) as any,
          variables: JSON.parse(
            JSON.stringify(data.variables || existingWorkflow.variables)
          ) as any,
          settings: JSON.parse(
            JSON.stringify(data.settings || existingWorkflow.settings)
          ) as any,
          entryNodeId: entryNode.id,
          isActive: true
        }
      });

      console.log(
        'New workflow version created:',
        version.id,
        'version:',
        newVersionNumber
      );

      // Деактивируем предыдущую активную версию
      if (currentVersion) {
        await db.workflowVersion.update({
          where: { id: currentVersion.id },
          data: { isActive: false }
        });
      }
    }

    // Обновляем workflow
    const updateData: any = {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      updatedAt: new Date()
    };

    // Обновляем данные workflow только если они пришли
    if (data.nodes !== undefined) {
      updateData.nodes = JSON.parse(JSON.stringify(data.nodes)) as any;
    }
    if (data.connections !== undefined) {
      updateData.connections = JSON.parse(
        JSON.stringify(data.connections)
      ) as any;
    }
    if (data.variables !== undefined) {
      updateData.variables = JSON.parse(JSON.stringify(data.variables)) as any;
    }
    if (data.settings !== undefined) {
      updateData.settings = JSON.parse(JSON.stringify(data.settings)) as any;
    }

    // Версии управляются отдельно, currentVersionId не нужен

    const workflow = await db.workflow.update({
      where: { id: workflowId },
      data: updateData
    });

    // Инвалидируем кэш workflow для проекта
    await WorkflowRuntimeService.invalidateCache(projectId);

    // ✅ КРИТИЧНО: Если workflow активен и бот запущен, перезапускаем бота
    // чтобы он загрузил актуальную версию workflow
    if (workflow.isActive) {
      try {
        const { botManager } = await import('@/lib/telegram/bot-manager');
        const botInstance = botManager.getBot(projectId);

        if (botInstance && botInstance.isActive) {
          logger.info(
            '🔄 Перезапускаем активный бот для загрузки обновленного workflow',
            {
              projectId,
              workflowId
            }
          );

          // Получаем настройки бота
          const project = await db.project.findUnique({
            where: { id: projectId },
            include: { botSettings: true }
          });

          if (project?.botSettings) {
            // Останавливаем текущий бот
            await botManager.stopBot(projectId);
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Запускаем бот заново с новым workflow
            await botManager.createBot(projectId, project.botSettings as any);

            logger.info('✅ Бот перезапущен с обновленным workflow', {
              projectId,
              workflowId
            });
          }
        }
      } catch (botError) {
        // Не критично, если бот не запущен - просто логируем
        logger.warn('⚠️ Не удалось перезапустить бот при обновлении workflow', {
          projectId,
          workflowId,
          error: botError instanceof Error ? botError.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления workflow' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/workflows/[workflowId] - Удалить workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; workflowId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: projectId, workflowId } = resolvedParams;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;

    // Проверяем существование workflow
    const existingWorkflow = await db.workflow.findFirst({
      where: {
        id: workflowId,
        projectId
      }
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow не найден' },
        { status: 404 }
      );
    }

    // Удаляем workflow
    await db.workflow.delete({
      where: { id: workflowId }
    });

    // Инвалидируем кэш workflow для проекта
    await WorkflowRuntimeService.invalidateCache(projectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления workflow' },
      { status: 500 }
    );
  }
}
