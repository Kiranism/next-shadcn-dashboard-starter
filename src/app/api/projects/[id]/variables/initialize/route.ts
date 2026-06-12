/**
 * @file: src/app/api/projects/[id]/variables/initialize/route.ts
 * @description: API endpoint для инициализации системных переменных проекта
 * @project: SaaS Bonus System
 * @dependencies: Next.js, ProjectVariablesService
 * @created: 2025-10-14
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProjectVariablesService } from '@/lib/services/project-variables.service';
import { requireProjectAccess } from '@/lib/with-project-access';

// POST /api/projects/[id]/variables/initialize - Инициализировать системные переменные
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: projectId } = resolvedParams;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;

    await ProjectVariablesService.initializeSystemVariables(projectId);

    const variables =
      await ProjectVariablesService.getAvailableVariables(projectId);

    return NextResponse.json({
      success: true,
      variables
    });
  } catch (error) {
    console.error('Error initializing project variables:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Ошибка инициализации переменных' },
      { status: 500 }
    );
  }
}
