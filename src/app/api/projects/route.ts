/**
 * @file: src/app/api/projects/route.ts
 * @description: API для управления проектами (CRUD операции)
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, Prisma, ProjectService
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/project.service';
import { logger } from '@/lib/logger';
// import { db } from '@/lib/db'; // удалено как неиспользуемое
import type { CreateProjectInput } from '@/types/bonus';

// GET /api/projects - Получение списка проектов
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await ProjectService.getProjects(page, limit);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Ошибка получения списка проектов', {
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      component: 'projects-api',
      action: 'GET'
    });
    return NextResponse.json(
      { error: 'Ошибка получения проектов' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Создание нового проекта
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Валидация входных данных
    const projectData: CreateProjectInput = {
      name: body.name,
      domain: body.domain || undefined,
      bonusPercentage: body.bonusPercentage || 1.0,
      bonusExpiryDays: body.bonusExpiryDays || 365
    };

    if (!projectData.name) {
      return NextResponse.json(
        { error: 'Название проекта обязательно' },
        { status: 400 }
      );
    }

    const project = await ProjectService.createProject(projectData);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    logger.error('Ошибка создания проекта', {
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      component: 'projects-api',
      action: 'POST'
    });

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Проект с таким доменом уже существует' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Ошибка создания проекта' },
      { status: 500 }
    );
  }
}
