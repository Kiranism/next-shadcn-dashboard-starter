/**
 * @file: [levelId]/route.ts
 * @description: API endpoints для операций с конкретным уровнем бонусной программы
 * @project: SaaS Bonus System
 * @dependencies: BonusLevelService, Prisma
 * @created: 2024-12-10
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { BonusLevelService } from '@/lib/services/bonus-level.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; levelId: string }> }
) {
  try {
    const { id: projectId, levelId } = await params;

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Получаем конкретный уровень
    const bonusLevel = await db.bonusLevel.findUnique({
      where: {
        id: levelId,
        projectId: projectId
      }
    });

    if (!bonusLevel) {
      return NextResponse.json(
        { error: 'Уровень бонусной программы не найден' },
        { status: 404 }
      );
    }

    logger.info('Bonus level retrieved', {
      projectId,
      levelId,
      levelName: bonusLevel.name
    });

    return NextResponse.json({
      success: true,
      data: {
        ...bonusLevel,
        minAmount: Number(bonusLevel.minAmount),
        maxAmount: bonusLevel.maxAmount ? Number(bonusLevel.maxAmount) : null,
        bonusPercent: Number(bonusLevel.bonusPercent),
        paymentPercent: Number(bonusLevel.paymentPercent)
      }
    });
  } catch (error: any) {
    const { id: projectId, levelId } = await params;
    logger.error('Error retrieving bonus level', {
      projectId,
      levelId,
      error: error.message
    });

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; levelId: string }> }
) {
  try {
    const { id: projectId, levelId } = await params;
    const body = await request.json();

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем существование уровня
    const existingLevel = await db.bonusLevel.findUnique({
      where: {
        id: levelId,
        projectId: projectId
      }
    });

    if (!existingLevel) {
      return NextResponse.json(
        { error: 'Уровень бонусной программы не найден' },
        { status: 404 }
      );
    }

    // Валидация значений (если они переданы)
    if (body.minAmount !== undefined && body.minAmount < 0) {
      return NextResponse.json(
        { error: 'Минимальная сумма не может быть отрицательной' },
        { status: 400 }
      );
    }

    if (
      body.bonusPercent !== undefined &&
      (body.bonusPercent < 0 || body.bonusPercent > 100)
    ) {
      return NextResponse.json(
        { error: 'Процент бонусов должен быть от 0 до 100' },
        { status: 400 }
      );
    }

    if (
      body.paymentPercent !== undefined &&
      (body.paymentPercent < 0 || body.paymentPercent > 100)
    ) {
      return NextResponse.json(
        { error: 'Процент оплаты должен быть от 0 до 100' },
        { status: 400 }
      );
    }

    if (
      body.maxAmount !== undefined &&
      body.minAmount !== undefined &&
      body.maxAmount <= body.minAmount
    ) {
      return NextResponse.json(
        { error: 'Максимальная сумма должна быть больше минимальной' },
        { status: 400 }
      );
    }

    // Обновляем уровень
    const updatedLevel = await BonusLevelService.updateBonusLevel(
      levelId,
      body
    );

    logger.info('Bonus level updated', {
      projectId,
      levelId,
      levelName: updatedLevel.name
    });

    return NextResponse.json({
      success: true,
      message: 'Уровень бонусной программы обновлен',
      data: updatedLevel
    });
  } catch (error: any) {
    const { id: projectId, levelId } = await params;
    logger.error('Error updating bonus level', {
      projectId,
      levelId,
      error: error.message
    });

    // Обработка ошибок валидации от сервиса
    if (
      error.message?.includes('пересекаются') ||
      error.message?.includes('перекрываются')
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; levelId: string }> }
) {
  try {
    const { id: projectId, levelId } = await params;

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем существование уровня
    const existingLevel = await db.bonusLevel.findUnique({
      where: {
        id: levelId,
        projectId: projectId
      }
    });

    if (!existingLevel) {
      return NextResponse.json(
        { error: 'Уровень бонусной программы не найден' },
        { status: 404 }
      );
    }

    // Проверяем, не последний ли это уровень
    const levelsCount = await db.bonusLevel.count({
      where: {
        projectId: projectId,
        isActive: true
      }
    });

    if (levelsCount <= 1) {
      return NextResponse.json(
        { error: 'Нельзя удалить последний активный уровень' },
        { status: 400 }
      );
    }

    // Удаляем уровень (мягкое удаление)
    await BonusLevelService.deleteBonusLevel(levelId);

    logger.info('Bonus level deleted', {
      projectId,
      levelId,
      levelName: existingLevel.name
    });

    return NextResponse.json({
      success: true,
      message: 'Уровень бонусной программы удален'
    });
  } catch (error: any) {
    const { id: projectId, levelId } = await params;
    logger.error('Error deleting bonus level', {
      projectId,
      levelId,
      error: error.message
    });

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
