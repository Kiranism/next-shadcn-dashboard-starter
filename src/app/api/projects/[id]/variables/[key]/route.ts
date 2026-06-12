/**
 * @file: src/app/api/projects/[id]/variables/[key]/route.ts
 * @description: API endpoints для управления конкретной переменной проекта
 * @project: SaaS Bonus System
 * @dependencies: Next.js, ProjectVariablesService
 * @created: 2025-10-14
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProjectVariablesService } from '@/lib/services/project-variables.service';
import { requireProjectAccess } from '@/lib/with-project-access';

// PUT /api/projects/[id]/variables/[key] - Обновить переменную
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; key: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: projectId, key } = resolvedParams;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;
    const body = await request.json();

    const { value, description } = body;

    const variable = await ProjectVariablesService.updateVariable(
      projectId,
      key,
      { value, description }
    );

    return NextResponse.json({ variable });
  } catch (error) {
    console.error('Error updating project variable:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Ошибка обновления переменной' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/variables/[key] - Удалить переменную
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; key: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: projectId, key } = resolvedParams;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;

    await ProjectVariablesService.deleteVariable(projectId, key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project variable:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Ошибка удаления переменной' },
      { status: 500 }
    );
  }
}
