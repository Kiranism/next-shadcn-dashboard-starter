/**
 * @file: reset-defaults/route.ts
 * @description: API endpoint для сброса уровней бонусной программы к дефолтным значениям
 * @project: SaaS Bonus System
 * @dependencies: BonusLevelService, Prisma
 * @created: 2024-12-10
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { BonusLevelService } from '@/lib/services/bonus-level.service';

export async function POST(
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

    // Получаем текущие уровни для логирования
    const currentLevels = await BonusLevelService.getBonusLevels(projectId);

    // Деактивируем все существующие уровни
    await db.bonusLevel.updateMany({
      where: { projectId: projectId },
      data: { isActive: false }
    });

    // Создаем дефолтные уровни
    const defaultLevels =
      await BonusLevelService.createDefaultLevels(projectId);

    logger.info('Bonus levels reset to defaults', {
      projectId,
      previousLevelsCount: currentLevels.length,
      newLevelsCount: defaultLevels.length
    });

    return NextResponse.json({
      success: true,
      message: 'Уровни бонусной программы сброшены к дефолтным значениям',
      data: {
        deactivatedLevels: currentLevels.length,
        createdLevels: defaultLevels.length,
        levels: defaultLevels
      }
    });
  } catch (error: any) {
    const { id: projectId } = await params;
    logger.error('Error resetting bonus levels to defaults', {
      projectId,
      error: error.message
    });

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
