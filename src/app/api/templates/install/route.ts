/**
 * @file: src/app/api/templates/install/route.ts
 * @description: API для установки шаблонов ботов в проекты
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, BotTemplatesService
 * @created: 2025-10-01
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { botTemplates } from '@/lib/services/bot-templates/bot-templates.service';
import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// POST /api/templates/install - Установка шаблона в проект
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, projectId, userId, customName } = body;

    if (!templateId || !projectId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Не указаны обязательные параметры: templateId, projectId'
        },
        { status: 400 }
      );
    }

    logger.info(
      'POST /api/templates/install',
      {
        templateId,
        projectId,
        userId,
        customName
      },
      'templates-install'
    );

    // Проверяем аутентификацию
    const admin = await getCurrentAdmin();
    if (!admin?.sub) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Получаем шаблон
    const template = await botTemplates.getTemplateById(templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Шаблон не найден' },
        { status: 404 }
      );
    }

    // Создаем workflow напрямую в БД
    const workflowData = {
      ...template.workflowConfig,
      projectId,
      isActive: false // По умолчанию неактивен
    };

    // Применяем кастомизации
    if (customName) {
      workflowData.name = customName;
    }

    logger.info(
      'Creating workflow directly in DB',
      {
        projectId,
        workflowData: JSON.stringify(workflowData, null, 2)
      },
      'templates-install'
    );

    const workflow = await db.workflow.create({
      data: {
        projectId,
        name: workflowData.name,
        description: workflowData.description,
        nodes: workflowData.nodes || [],
        connections: workflowData.connections || [],
        variables: workflowData.variables || [],
        settings: workflowData.settings || {}
      }
    });

    logger.info(
      'Workflow created successfully',
      { workflowId: workflow.id },
      'templates-install'
    );

    // Деактивируем все существующие активные workflow для проекта
    await db.workflow.updateMany({
      where: {
        projectId,
        isActive: true,
        id: { not: workflow.id } // Не деактивируем только что созданный
      },
      data: { isActive: false }
    });

    // Деактивируем все существующие активные версии
    await db.workflowVersion.updateMany({
      where: {
        workflow: { projectId },
        isActive: true
      },
      data: { isActive: false }
    });

    // Создаем первую версию workflow
    const nodes = workflowData.nodes || [];
    const entryNode = nodes.find((node: any) =>
      node.type?.startsWith('trigger.')
    );

    if (entryNode) {
      const workflowVersion = await db.workflowVersion.create({
        data: {
          workflowId: workflow.id,
          version: 1,
          nodes: JSON.parse(JSON.stringify(nodes)) as any,
          variables: JSON.parse(
            JSON.stringify(workflowData.variables || [])
          ) as any,
          settings: JSON.parse(
            JSON.stringify(workflowData.settings || {})
          ) as any,
          entryNodeId: entryNode.id,
          isActive: true
        }
      });

      logger.info(
        'Workflow version created successfully',
        { versionId: workflowVersion.id },
        'templates-install'
      );

      // КРИТИЧНО: WorkflowRuntime ищет версии только у workflow с isActive=true.
      // Без этого шаг hasActiveWorkflow = false, бот уходит в fallback и может не отвечать.
      await db.workflow.update({
        where: { id: workflow.id },
        data: { isActive: true }
      });

      const { WorkflowRuntimeService } = await import(
        '@/lib/services/workflow-runtime.service'
      );
      await WorkflowRuntimeService.invalidateCache(projectId);
    } else {
      logger.warn(
        'No entry node found in template, version not created',
        { workflowId: workflow.id },
        'templates-install'
      );
    }

    const result = {
      success: true,
      workflowId: workflow.id
    };

    logger.info(
      'Template installation result',
      { result },
      'templates-install'
    );

    if (!result.success) {
      logger.error(
        'Template installation failed',
        {
          templateId,
          projectId,
          userId
        },
        'templates-install'
      );
      return NextResponse.json(
        { success: false, error: 'Не удалось установить шаблон' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      workflowId: result.workflowId,
      message: 'Шаблон успешно установлен'
    });
  } catch (error) {
    logger.error(
      'Failed to install template',
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'templates-install'
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Не удалось установить шаблон'
      },
      { status: 500 }
    );
  }
}
