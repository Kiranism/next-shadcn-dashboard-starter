/**
 * @file: src/app/api/projects/[id]/route.ts
 * @description: API для работы с отдельным проектом (GET, PUT, DELETE)
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, Prisma, ProjectService
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Получаем проект без связанных данных
    const project = await db.project.findUnique({
      where: { id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Подсчитываем количество пользователей отдельно
    const userCount = await db.user.count({
      where: { projectId: id }
    });

    // Возвращаем проект с подсчетом пользователей
    const response = {
      ...project,
      _count: {
        users: userCount
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    const { id } = await params;
    logger.error('Ошибка получения проекта', {
      projectId: id,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedProject = await db.project.update({
      where: { id },
      data: {
        name: body.name,
        domain: body.domain,
        bonusPercentage: body.bonusPercentage,
        bonusExpiryDays: body.bonusExpiryDays,
        isActive: body.isActive
      }
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    const { id } = await params;
    logger.error('Ошибка обновления проекта', { projectId: id, error });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Удаляем проект (каскадное удаление настроено в схеме)
    await db.project.delete({
      where: { id }
    });

    logger.info('Проект удален', { projectId: id, projectName: project.name });

    return NextResponse.json(
      { message: 'Проект успешно удален' },
      { status: 200 }
    );
  } catch (error) {
    const { id } = await params;
    logger.error('Ошибка удаления проекта', { projectId: id, error });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
