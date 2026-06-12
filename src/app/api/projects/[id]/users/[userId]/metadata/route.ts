/**
 * @file: src/app/api/projects/[id]/users/[userId]/metadata/route.ts
 * @description: API endpoint для работы с metadata пользователя
 * @project: SaaS Bonus System
 * @dependencies: Prisma, UserService
 * @created: 2025-12-04
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireProjectAccess } from '@/lib/with-project-access';

interface RouteParams {
  params: Promise<{
    id: string;
    userId: string;
  }>;
}

/**
 * GET /api/projects/[id]/users/[userId]/metadata
 * Получить metadata пользователя
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId, userId } = await params;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;

    // Проверяем существование пользователя в проекте
    const user = await db.user.findFirst({
      where: {
        id: userId,
        projectId
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      userId: user.id,
      metadata: ((user as any).metadata as Record<string, any>) || {}
    });
  } catch (error) {
    logger.error('Failed to get user metadata', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Ошибка получения данных' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]/users/[userId]/metadata
 * Обновить metadata пользователя (merge с существующими данными)
 * Body: { key1: value1, key2: value2, ... }
 * Значение null удаляет ключ
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId, userId } = await params;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;
    const body = await request.json();

    // Проверяем существование пользователя в проекте
    const user = await db.user.findFirst({
      where: {
        id: userId,
        projectId
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Обновляем metadata через UserService
    const updatedMetadata = await UserService.updateMetadata(userId, body);

    logger.info('User metadata updated', {
      userId,
      projectId,
      keysUpdated: Object.keys(body)
    });

    return NextResponse.json({
      userId,
      metadata: updatedMetadata,
      success: true
    });
  } catch (error) {
    logger.error('Failed to update user metadata', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Ошибка обновления данных' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]/users/[userId]/metadata
 * Полностью заменить metadata пользователя
 * Body: { key1: value1, key2: value2, ... }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId, userId } = await params;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;
    const body = await request.json();

    // Проверяем существование пользователя в проекте
    const user = await db.user.findFirst({
      where: {
        id: userId,
        projectId
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Полностью заменяем metadata
    await (db.user as any).update({
      where: { id: userId },
      data: { metadata: body }
    });

    logger.info('User metadata replaced', {
      userId,
      projectId,
      keysSet: Object.keys(body)
    });

    return NextResponse.json({
      userId,
      metadata: body,
      success: true
    });
  } catch (error) {
    logger.error('Failed to replace user metadata', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Ошибка обновления данных' },
      { status: 500 }
    );
  }
}
