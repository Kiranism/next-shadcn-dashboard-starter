/**
 * @file: referral-program/route.ts
 * @description: API endpoints для управления настройками реферальной программы
 * @project: SaaS Bonus System
 * @dependencies: ReferralService, Prisma
 * @created: 2024-12-10
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ReferralService } from '@/lib/services/referral.service';
import { requireProjectAccess } from '@/lib/with-project-access';

const ReferralLevelSchema = z.object({
  level: z
    .number()
    .int()
    .min(1, 'Минимальный уровень — 1')
    .max(3, 'Максимум 3 уровня'),
  percent: z
    .number()
    .min(0, 'Процент не может быть отрицательным')
    .max(100, 'Процент не может быть больше 100'),
  isActive: z.boolean().optional()
});

const ReferralProgramPayloadSchema = z.object({
  isActive: z.boolean().optional(),
  referrerBonus: z
    .number()
    .min(0, 'Процент реферера не может быть отрицательным')
    .max(100, 'Максимум 100%'),
  refereeBonus: z
    .number()
    .min(0, 'Процент новому пользователю не может быть отрицательным')
    .max(100, 'Максимум 100%'),
  minPurchaseAmount: z.number().min(0).optional(),
  cookieLifetime: z.number().int().min(1).max(365).optional(),
  welcomeBonus: z.number().min(0).optional(),
  description: z.string().max(500).optional(),
  levels: z
    .array(ReferralLevelSchema)
    .max(3, 'Можно создать максимум 3 уровня')
    .optional()
});

type ReferralProgramPayload = z.infer<typeof ReferralProgramPayloadSchema>;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, operationMode: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем режим работы проекта
    if (project.operationMode === 'WITHOUT_BOT') {
      return NextResponse.json(
        {
          error:
            'Реферальная программа недоступна в режиме "Без Telegram бота"',
          code: 'REFERRAL_DISABLED_WITHOUT_BOT'
        },
        { status: 403 }
      );
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
    const { id: projectId } = await context.params;
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;

    const access = await requireProjectAccess(context.params);
    if (access instanceof NextResponse) return access;
    const payload: ReferralProgramPayload = ReferralProgramPayloadSchema.parse(
      await request.json()
    );

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, operationMode: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем режим работы проекта
    if (project.operationMode === 'WITHOUT_BOT') {
      return NextResponse.json(
        {
          error:
            'Реферальная программа недоступна в режиме "Без Telegram бота"',
          code: 'REFERRAL_DISABLED_WITHOUT_BOT'
        },
        { status: 403 }
      );
    }

    const updatedProgram = await ReferralService.createOrUpdateReferralProgram({
      projectId,
      isActive: payload.isActive ?? true,
      referrerBonus: payload.referrerBonus,
      refereeBonus: payload.refereeBonus,
      minPurchaseAmount: payload.minPurchaseAmount ?? 0,
      cookieLifetime: payload.cookieLifetime ?? 30,
      welcomeBonus: payload.welcomeBonus ?? 0,
      description: payload.description ?? null,
      levels: payload.levels?.map((level) => ({
        level: level.level,
        percent: level.percent,
        isActive: level.isActive
      }))
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
      data: updatedProgram
    });
  } catch (error: any) {
    const { id: projectId } = await context.params;
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }
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
