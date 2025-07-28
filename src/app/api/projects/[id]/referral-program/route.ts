/**
 * @file: referral-program/route.ts
 * @description: API endpoints для управления настройками реферальной программы
 * @project: SaaS Bonus System
 * @dependencies: ReferralService, Prisma
 * @created: 2024-12-10
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ReferralService } from '@/lib/services/referral.service';

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

    // Получаем настройки реферальной программы
    const referralProgram = await ReferralService.getReferralProgram(projectId);

    logger.info('Referral program settings retrieved', {
      projectId,
      isActive: referralProgram?.isActive || false
    });

    return NextResponse.json({
      success: true,
      data: referralProgram
    });
  } catch (error: any) {
    const { id: projectId } = await params;
    logger.error('Error retrieving referral program settings', {
      projectId,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Валидация данных
    if (
      body.bonusPercent !== undefined &&
      (body.bonusPercent < 0 || body.bonusPercent > 100)
    ) {
      return NextResponse.json(
        { error: 'Процент бонуса должен быть от 0 до 100' },
        { status: 400 }
      );
    }

    if (body.referrerBonus !== undefined && body.referrerBonus < 0) {
      return NextResponse.json(
        { error: 'Размер бонуса реферера не может быть отрицательным' },
        { status: 400 }
      );
    }

    // Обновляем или создаем настройки реферальной программы
    const updatedProgram = await ReferralService.createOrUpdateReferralProgram({
      projectId,
      isActive: body.isActive !== undefined ? body.isActive : true,
      referrerBonus: body.referrerBonus || 10,
      refereeBonus: body.refereeBonus || 5,
      minPurchaseAmount: body.minPurchaseAmount || 0,
      cookieLifetime: body.cookieLifetime || 30,
      description: body.description || null
    });

    logger.info('Referral program settings updated', {
      projectId,
      isActive: updatedProgram.isActive,
      referrerBonus: updatedProgram.referrerBonus,
      refereeBonus: updatedProgram.refereeBonus
    });

    return NextResponse.json({
      success: true,
      message: 'Настройки реферальной программы обновлены',
      data: {
        ...updatedProgram,
        referrerBonus: Number(updatedProgram.referrerBonus),
        refereeBonus: Number(updatedProgram.refereeBonus),
        minPurchaseAmount: Number(updatedProgram.minPurchaseAmount),
        cookieLifetime: Number(updatedProgram.cookieLifetime)
      }
    });
  } catch (error: any) {
    const { id: projectId } = await params;
    logger.error('Error updating referral program settings', {
      projectId,
      error: error.message
    });

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
