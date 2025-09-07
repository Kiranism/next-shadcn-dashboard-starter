/**
 * @file: bonus-levels/route.ts
 * @description: API endpoints для управления уровнями бонусной программы
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Получаем список уровней
    const bonusLevels = await BonusLevelService.getBonusLevels(projectId);

    logger.info('Bonus levels retrieved', {
      projectId,
      levelsCount: bonusLevels.length
    });

    return NextResponse.json({
      success: true,
      data: bonusLevels
    });
  } catch (error: any) {
    const { id: projectId } = await params;
    logger.error('Error retrieving bonus levels', {
      projectId,
      error: error.message
    });

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const raw = await request.json();
    // Коэрция типов и нормализация null/undefined
    const body = {
      name: raw?.name,
      minAmount:
        raw?.minAmount !== undefined ? Number(raw.minAmount) : undefined,
      maxAmount:
        raw?.maxAmount === null
          ? null
          : raw?.maxAmount !== undefined
            ? Number(raw.maxAmount)
            : undefined,
      bonusPercent:
        raw?.bonusPercent !== undefined ? Number(raw.bonusPercent) : undefined,
      paymentPercent:
        raw?.paymentPercent !== undefined
          ? Number(raw.paymentPercent)
          : undefined,
      order: raw?.order !== undefined ? Number(raw.order) : undefined,
      isActive: raw?.isActive
    } as any;

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Валидация обязательных полей
    const { name, minAmount, bonusPercent, paymentPercent } = body;

    if (
      !name ||
      minAmount === undefined ||
      bonusPercent === undefined ||
      paymentPercent === undefined
    ) {
      return NextResponse.json(
        {
          error:
            'Обязательные поля: name, minAmount, bonusPercent, paymentPercent'
        },
        { status: 400 }
      );
    }

    // Валидация значений
    if (minAmount < 0 || !Number.isFinite(minAmount)) {
      return NextResponse.json(
        { error: 'Минимальная сумма не может быть отрицательной' },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(bonusPercent) ||
      bonusPercent < 0 ||
      bonusPercent > 100
    ) {
      return NextResponse.json(
        { error: 'Процент бонусов должен быть от 0 до 100' },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(paymentPercent) ||
      paymentPercent < 0 ||
      paymentPercent > 100
    ) {
      return NextResponse.json(
        { error: 'Процент оплаты должен быть от 0 до 100' },
        { status: 400 }
      );
    }

    // maxAmount=null означает "без ограничений"
    if (
      body.maxAmount !== undefined &&
      body.maxAmount !== null &&
      Number(body.maxAmount) <= minAmount
    ) {
      return NextResponse.json(
        { error: 'Максимальная сумма должна быть больше минимальной' },
        { status: 400 }
      );
    }

    // Создаем новый уровень
    const newLevel = await BonusLevelService.createBonusLevel({
      projectId,
      name,
      minAmount,
      maxAmount: body.maxAmount === null ? undefined : body.maxAmount,
      bonusPercent,
      paymentPercent,
      order: body.order,
      isActive: body.isActive !== false // По умолчанию активный
    });

    logger.info('Bonus level created', {
      projectId,
      levelId: newLevel.id,
      levelName: newLevel.name
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Уровень бонусной программы создан',
        data: newLevel
      },
      { status: 201 }
    );
  } catch (error: any) {
    const { id: projectId } = await params;
    logger.error('Error creating bonus level', {
      projectId,
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
