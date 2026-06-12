/**
 * @file: route.ts
 * @description: API для управления конкретным пользователем проекта (GET, PATCH, DELETE)
 * @project: SaaS Bonus System
 * @dependencies: Next.js, Prisma
 * @created: 2025-09-10
 * @updated: 2025-12-04
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { normalizePhone, isValidNormalizedPhone } from '@/lib/phone';
import { requireProjectAccess } from '@/lib/with-project-access';

/**
 * Zod-схема для PATCH-полей пользователя.
 * Только phone/email/birthDate имеют отдельную пред-обработку выше по коду
 * (нормализация, проверки уникальности), поэтому здесь даём только enum-роль —
 * остальные поля обрабатываются как раньше.
 */
const PatchUserSchema = z
  .object({
    partnerRole: z
      .enum(['CLIENT', 'TRAINER', 'MANAGER', 'DIRECTOR'])
      .optional(),
    organizationId: z.string().nullable().optional(),
    referredBy: z.string().nullable().optional()
  })
  .passthrough();

/**
 * GET - Получить данные пользователя
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  const { id: projectId, userId } = await context.params;

  const access = await requireProjectAccess(context.params);
  if (access instanceof NextResponse) return access;

  try {
    const user = await db.user.findFirst({
      where: { id: userId, projectId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Получаем бонусы и транзакции отдельно
    const [bonuses, transactions] = await Promise.all([
      db.bonus.findMany({
        where: {
          userId,
          isUsed: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
        },
        select: { amount: true }
      }),
      db.transaction.findMany({
        where: { userId },
        select: { amount: true, type: true }
      })
    ]);

    // Вычисляем баланс и статистику
    const bonusBalance = bonuses.reduce((sum, b) => sum + Number(b.amount), 0);
    const totalEarned = transactions
      .filter((t) => t.type === 'EARN')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalSpent = transactions
      .filter((t) => t.type === 'SPEND')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const formattedUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      birthDate: user.birthDate ? user.birthDate.toISOString() : null,
      telegramId: user.telegramId ? user.telegramId.toString() : null,
      telegramUsername: user.telegramUsername,
      isActive: user.isActive,
      referralCode: user.referralCode,
      partnerRole: user.partnerRole,
      organizationId: user.organizationId ?? null,
      referredBy: user.referredBy ?? null,
      outboundReferralPlanId: (user as any).outboundReferralPlanId ?? null,
      currentLevel: user.currentLevel || null,
      bonusBalance,
      totalEarned,
      totalSpent,
      totalPurchases: Number(user.totalPurchases || 0),
      metadata: (user as any).metadata || {},
      createdAt: user.registeredAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };

    return NextResponse.json({ user: formattedUser });
  } catch (error) {
    logger.error('Ошибка получения пользователя', {
      projectId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Обновить данные пользователя
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  const { id: projectId, userId } = await context.params;

  const access = await requireProjectAccess(context.params);
  if (access instanceof NextResponse) return access;

  try {
    const user = await db.user.findFirst({ where: { id: userId, projectId } });
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Zod-валидация partnerRole (остальные поля обрабатываются императивно ниже).
    const parsed = PatchUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: any = {};

    // Обновляем только переданные поля
    if (body.firstName !== undefined) {
      updateData.firstName = body.firstName?.trim() || null;
    }
    if (body.lastName !== undefined) {
      updateData.lastName = body.lastName?.trim() || null;
    }
    if (body.email !== undefined) {
      const email = body.email?.trim() || null;
      // Проверяем уникальность email
      if (email) {
        const existingUser = await db.user.findFirst({
          where: { projectId, email, NOT: { id: userId } }
        });
        if (existingUser) {
          return NextResponse.json(
            { error: 'Пользователь с таким email уже существует' },
            { status: 409 }
          );
        }
      }
      updateData.email = email;
    }
    if (body.phone !== undefined) {
      let phone = body.phone?.trim() || null;
      // Нормализуем телефон
      if (phone) {
        try {
          phone = normalizePhone(phone);
          if (!isValidNormalizedPhone(phone)) {
            return NextResponse.json(
              { error: 'Неверный формат телефона' },
              { status: 400 }
            );
          }
        } catch (e) {
          return NextResponse.json(
            { error: 'Неверный формат телефона' },
            { status: 400 }
          );
        }
        // Проверяем уникальность телефона
        const existingUser = await db.user.findFirst({
          where: { projectId, phone, NOT: { id: userId } }
        });
        if (existingUser) {
          return NextResponse.json(
            { error: 'Пользователь с таким телефоном уже существует' },
            { status: 409 }
          );
        }
      }
      updateData.phone = phone;
    }
    if (body.birthDate !== undefined) {
      if (body.birthDate) {
        const date = new Date(body.birthDate);
        if (isNaN(date.getTime())) {
          return NextResponse.json(
            { error: 'Неверный формат даты рождения' },
            { status: 400 }
          );
        }
        updateData.birthDate = date;
      } else {
        updateData.birthDate = null;
      }
    }
    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }
    if (parsed.data.partnerRole !== undefined) {
      updateData.partnerRole = parsed.data.partnerRole;
    }
    if (parsed.data.organizationId !== undefined) {
      if (parsed.data.organizationId) {
        const org = await db.partnerOrganization.findFirst({
          where: { id: parsed.data.organizationId, projectId }
        });
        if (!org) {
          return NextResponse.json(
            { error: 'Организация не найдена' },
            { status: 404 }
          );
        }
      }
      updateData.organizationId = parsed.data.organizationId;
    }
    if (parsed.data.referredBy !== undefined) {
      if (parsed.data.referredBy) {
        if (parsed.data.referredBy === userId) {
          return NextResponse.json(
            { error: 'Пользователь не может быть реферером сам себе' },
            { status: 400 }
          );
        }
        const referrer = await db.user.findFirst({
          where: { id: parsed.data.referredBy, projectId }
        });
        if (!referrer) {
          return NextResponse.json(
            { error: 'Реферер не найден' },
            { status: 404 }
          );
        }
      }
      updateData.referredBy = parsed.data.referredBy;
    }

    // Обновляем пользователя
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData
    });

    logger.info('Пользователь обновлён', {
      projectId,
      userId,
      updatedFields: Object.keys(updateData)
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        birthDate: updatedUser.birthDate
          ? updatedUser.birthDate.toISOString()
          : null,
        telegramId: updatedUser.telegramId
          ? updatedUser.telegramId.toString()
          : null,
        telegramUsername: updatedUser.telegramUsername,
        isActive: updatedUser.isActive,
        partnerRole: updatedUser.partnerRole,
        organizationId: updatedUser.organizationId ?? null,
        referredBy: updatedUser.referredBy ?? null,
        currentLevel: updatedUser.currentLevel || null,
        updatedAt: updatedUser.updatedAt.toISOString()
      }
    });
  } catch (error) {
    logger.error('Ошибка обновления пользователя', {
      projectId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Удалить пользователя
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  const { id: projectId, userId } = await context.params;

  const access = await requireProjectAccess(context.params);
  if (access instanceof NextResponse) return access;

  try {
    const user = await db.user.findFirst({ where: { id: userId, projectId } });
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Каскад: сначала удаляем связанные записи
    await db.transaction.deleteMany({ where: { userId } });
    await db.bonus.deleteMany({ where: { userId } });

    await db.user.delete({ where: { id: userId } });

    logger.info('Пользователь удалён', { projectId, userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Ошибка удаления пользователя', {
      projectId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
