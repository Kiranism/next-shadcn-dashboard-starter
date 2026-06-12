/**
 * @file: src/app/api/projects/[id]/variables/route.ts
 * @description: API endpoints для управления переменными проекта
 * @project: SaaS Bonus System
 * @dependencies: Next.js, ProjectVariablesService
 * @created: 2025-10-14
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProjectVariablesService } from '@/lib/services/project-variables.service';
import { requireProjectAccess } from '@/lib/with-project-access';

// GET /api/projects/[id]/variables - Получить все переменные проекта
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: projectId } = resolvedParams;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;

    const variables =
      await ProjectVariablesService.getAvailableVariables(projectId);

    return NextResponse.json({ variables });
  } catch (error) {
    console.error('Error fetching project variables:', error);
    return NextResponse.json(
      { error: 'Ошибка получения переменных проекта' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/variables - Создать новую переменную
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: projectId } = resolvedParams;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;
    const body = await request.json();

    const { key, value, description } = body;

    if (!key || !value) {
      return NextResponse.json(
        { error: 'Ключ и значение переменной обязательны' },
        { status: 400 }
      );
    }

    const variable = await ProjectVariablesService.createVariable({
      projectId,
      key,
      value,
      description
    });

    return NextResponse.json({ variable }, { status: 201 });
  } catch (error) {
    console.error('Error creating project variable:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Ошибка создания переменной' },
      { status: 500 }
    );
  }
}
