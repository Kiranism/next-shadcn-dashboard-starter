/**
 * @file: src/app/api/projects/[id]/route.ts
 * @description: API для работы с отдельным проектом (GET, PUT, DELETE)
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, Prisma, ProjectService
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/project.service';
import type { UpdateProjectInput } from '@/types/bonus';

// GET /api/projects/[id] - Получение проекта по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await ProjectService.getProjectById(id);

    if (!project) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Ошибка получения проекта:', error);
    return NextResponse.json(
      { error: 'Ошибка получения проекта' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Обновление проекта
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Проверяем существование проекта
    const existingProject = await ProjectService.getProjectById(id);
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404 }
      );
    }

    const updateData: UpdateProjectInput = {
      name: body.name,
      domain: body.domain,
      bonusPercentage: body.bonusPercentage,
      bonusExpiryDays: body.bonusExpiryDays,
      isActive: body.isActive,
    };

    // Удаляем undefined значения
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const updatedProject = await ProjectService.updateProject(id, updateData);

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Ошибка обновления проекта:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Проект с таким доменом уже существует' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Ошибка обновления проекта' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Деактивация проекта
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await ProjectService.getProjectById(id);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404 }
      );
    }

    // Деактивируем проект вместо полного удаления
    const deactivatedProject = await ProjectService.updateProject(id, {
      isActive: false,
    });

    return NextResponse.json({
      message: 'Проект успешно деактивирован',
      project: deactivatedProject,
    });
  } catch (error) {
    console.error('Ошибка деактивации проекта:', error);
    return NextResponse.json(
      { error: 'Ошибка деактивации проекта' },
      { status: 500 }
    );
  }
}
