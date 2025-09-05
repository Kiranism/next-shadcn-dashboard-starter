/**
 * @file: reorder/route.ts
 * @description: API endpoint для переупорядочивания уровней бонусной программы
 * @project: SaaS Bonus System
 * @dependencies: BonusLevelService, Prisma
 * @created: 2024-12-10
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { levelOrders } = body;

    if (!Array.isArray(levelOrders)) {
      return NextResponse.json(
        { error: 'levelOrders должен быть массивом' },
        { status: 400 }
      );
    }

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Валидация структуры данных
    for (const item of levelOrders) {
      if (!item.id || typeof item.order !== 'number') {
        return NextResponse.json(
          { error: 'Каждый элемент должен содержать id и order' },
          { status: 400 }
        );
      }
    }

    // Проверяем, что все уровни принадлежат данному проекту
    const levelIds = levelOrders.map((item: any) => item.id);
    const existingLevels = await db.bonusLevel.findMany({
      where: {
        id: { in: levelIds },
        projectId: projectId
      }
    });

    if (existingLevels.length !== levelIds.length) {
      return NextResponse.json(
        {
          error:
            'Некоторые уровни не найдены или не принадлежат данному проекту'
        },
        { status: 404 }
      );
    }

    // Обновляем порядок уровней
    const updatePromises = levelOrders.map(
      (item: { id: string; order: number }) =>
        db.bonusLevel.update({
          where: { id: item.id },
          data: { order: item.order }
        })
    );

    await Promise.all(updatePromises);

    // Получаем обновленные уровни
    const updatedLevels = await db.bonusLevel.findMany({
      where: {
        projectId: projectId,
        isActive: true
      },
      orderBy: { order: 'asc' }
    });

    logger.info('Bonus levels reordered', {
      projectId,
      levelsCount: levelOrders.length,
      newOrder: levelOrders.map((item: { id: string; order: number }) => ({
        id: item.id,
        order: item.order
      }))
    });

    return NextResponse.json({
      success: true,
      message: 'Порядок уровней обновлен',
      data: updatedLevels.map((level: any) => ({
        ...level,
        minAmount: Number(level.minAmount),
        maxAmount: level.maxAmount ? Number(level.maxAmount) : null,
        bonusPercent: Number(level.bonusPercent),
        paymentPercent: Number(level.paymentPercent)
      }))
    });
  } catch (error: any) {
    const { id: projectId } = await params;
    logger.error('Error reordering bonus levels', {
      projectId,
      error: error.message
    });

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
