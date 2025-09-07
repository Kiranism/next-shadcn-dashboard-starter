/**
 * @file: src/app/api/projects/[id]/users/route.ts
 * @description: API для управления пользователями проекта
 * @project: SaaS Bonus System
 * @dependencies: Next.js API Routes, Prisma, UserService
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { UserService } from '@/lib/services/user.service';
import { withApiRateLimit, withValidation } from '@/lib';
import { createUserSchema, validateWithSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

const getQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(20).optional(),
  search: z.string().max(200).optional()
});

async function getHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; validatedQuery?: any }
) {
  try {
    const { id } = await context.params;
    const page = context.validatedQuery?.page ?? 1;
    const limit = context.validatedQuery?.limit ?? 20;
    const search = context.validatedQuery?.search as string | undefined;

    // Базовый фильтр с поиском
    const where: any = { projectId: id };
    if (search && search.trim().length > 0) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const total = await db.user.count({ where });
    const { users: enrichedUsers } = await UserService.getProjectUsers(
      id,
      page,
      limit
    );

    // Форматируем под ожидаемый UI
    const formattedUsers = enrichedUsers.map((user, index) => {
      const currentBalance =
        Number(user.totalEarned || 0) - Number(user.totalSpent || 0);
      const botIsActive =
        (user as any).project?.botStatus === 'ACTIVE' ||
        (user as any).project?.botStatus === 'active';
      const isLinkedToBot = Boolean(user.telegramId);
      const computedActive =
        Boolean(user.isActive) && botIsActive && isLinkedToBot;
      return {
        id: user.id,
        name:
          `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
          user.email ||
          'Без имени',
        email: user.email,
        phone: user.phone,
        bonusBalance: currentBalance,
        totalEarned: Number(user.totalEarned || 0),
        createdAt: user.registeredAt,
        updatedAt: user.updatedAt,
        avatar: `https://api.slingacademy.com/public/sample-users/${(index % 10) + 1}.png`,
        isActive: computedActive,
        // Дополнительные поля для project-users-view
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
        registeredAt: user.registeredAt,
        totalBonuses: Number(user.totalEarned || 0),
        activeBonuses: currentBalance,
        lastActivity: user.updatedAt,
        currentLevel: user.currentLevel || user.level?.name || undefined
      };
    });

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (error) {
    const { id } = await context.params;
    logger.error('Ошибка получения пользователей', { projectId: id, error });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

async function postHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Валидация входных данных
    const validated = validateWithSchema(createUserSchema, {
      ...body,
      projectId: id,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined
    });

    // Проверяем уникальность email в рамках проекта
    if (validated.email) {
      const existingUser = await db.user.findFirst({
        where: {
          projectId: id,
          email: validated.email
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Пользователь с таким email уже существует' },
          { status: 409 }
        );
      }
    }

    // Проверяем уникальность телефона в рамках проекта
    if (validated.phone) {
      const existingUser = await db.user.findFirst({
        where: {
          projectId: id,
          phone: validated.phone
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Пользователь с таким телефоном уже существует' },
          { status: 409 }
        );
      }
    }

    // Создаем пользователя
    const newUser = await db.user.create({
      data: {
        projectId: id,
        firstName: validated.firstName || null,
        lastName: validated.lastName || null,
        email: validated.email || null,
        phone: validated.phone || null,
        birthDate: validated.birthDate ? new Date(validated.birthDate) : null
      }
    });

    // Форматируем пользователя для UI
    const formattedUser = {
      id: newUser.id,
      name:
        `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() ||
        newUser.email ||
        'Новый пользователь',
      email: newUser.email,
      phone: newUser.phone,
      avatar: `https://api.slingacademy.com/public/sample-users/${Math.floor(Math.random() * 5) + 1}.png`,
      bonusBalance: 0,
      totalEarned: 0,
      createdAt: newUser.registeredAt,
      updatedAt: newUser.updatedAt,
      // Дополнительные поля
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      birthDate: newUser.birthDate,
      registeredAt: newUser.registeredAt,
      totalBonuses: 0,
      activeBonuses: 0,
      lastActivity: newUser.updatedAt
    };

    logger.info('Пользователь создан', {
      projectId: id,
      userId: newUser.id,
      userEmail: newUser.email
    });

    return NextResponse.json(formattedUser, { status: 201 });
  } catch (error) {
    const { id } = await context.params;
    logger.error('Ошибка создания пользователя', {
      projectId: id,
      error:
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error)
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

async function putHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const body = await request.json();
    const { operation, userIds, data } = body;

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    let results = [];

    switch (operation) {
      case 'bulk_bonus_award':
        // Массовое начисление бонусов
        for (const userId of userIds) {
          try {
            const bonus = await db.bonus.create({
              data: {
                userId,
                amount: data.amount,
                type: 'MANUAL',
                description: data.description || 'Массовое начисление бонусов',
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
                isUsed: false
              }
            });

            // Создаем запись в истории транзакций
            await db.transaction.create({
              data: {
                userId,
                bonusId: bonus.id,
                amount: data.amount,
                type: 'EARN',
                description: data.description || 'Массовое начисление бонусов',
                userLevel: data.userLevel || null,
                appliedPercent: data.appliedPercent || null,
                isReferralBonus: false
              }
            });

            results.push({ userId, success: true, bonusId: bonus.id });
          } catch (error) {
            results.push({
              userId,
              success: false,
              error:
                error instanceof Error ? error.message : 'Неизвестная ошибка'
            });
          }
        }
        break;

      case 'bulk_bonus_deduct':
        // Массовое списание бонусов
        for (const userId of userIds) {
          try {
            // Получаем активные бонусы пользователя
            const activeBonus = await db.bonus.findFirst({
              where: {
                userId,
                isUsed: false,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
              },
              orderBy: { createdAt: 'asc' }
            });

            if (!activeBonus || Number(activeBonus.amount) < data.amount) {
              results.push({
                userId,
                success: false,
                error: 'Недостаточно бонусов для списания'
              });
              continue;
            }

            // Списываем бонусы
            const newAmount = Number(activeBonus.amount) - data.amount;
            if (newAmount <= 0) {
              await db.bonus.update({
                where: { id: activeBonus.id },
                data: { isUsed: true }
              });
            } else {
              await db.bonus.update({
                where: { id: activeBonus.id },
                data: { amount: newAmount }
              });
            }

            // Создаем запись в истории транзакций
            await db.transaction.create({
              data: {
                userId,
                bonusId: activeBonus.id,
                amount: data.amount,
                type: 'SPEND',
                description: data.description || 'Массовое списание бонусов'
              }
            });

            results.push({
              userId,
              success: true,
              deductedAmount: data.amount
            });
          } catch (error) {
            results.push({
              userId,
              success: false,
              error:
                error instanceof Error ? error.message : 'Неизвестная ошибка'
            });
          }
        }
        break;

      case 'bulk_notification':
        // Массовая отправка уведомлений через новую систему
        try {
          const { sendRichBroadcastMessage } = await import(
            '@/lib/telegram/notifications'
          );

          if (!data.message || data.message.trim().length === 0) {
            return NextResponse.json(
              { error: 'Сообщение не может быть пустым' },
              { status: 400 }
            );
          }

          const notification = {
            message: data.message.trim(),
            imageUrl: data.imageUrl,
            buttons: data.buttons,
            parseMode: data.parseMode || 'Markdown'
          };

          const result = await sendRichBroadcastMessage(
            projectId,
            notification,
            userIds
          );

          // Формируем результаты для каждого пользователя
          for (let i = 0; i < result.sent; i++) {
            results.push({
              userId: userIds[i] || `user_${i}`,
              success: true
            });
          }

          for (let i = result.sent; i < result.sent + result.failed; i++) {
            results.push({
              userId: userIds[i] || `user_${i}`,
              success: false,
              error: 'Ошибка отправки уведомления'
            });
          }
        } catch (error) {
          return NextResponse.json(
            { error: 'Ошибка отправки уведомлений' },
            { status: 500 }
          );
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Неизвестная операция' },
          { status: 400 }
        );
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Операция выполнена. Успешно: ${successCount}, с ошибками: ${failureCount}`,
      results,
      summary: {
        total: userIds.length,
        successful: successCount,
        failed: failureCount
      }
    });
  } catch (error: any) {
    const { id: projectId } = await context.params;
    logger.error('Error in bulk user operations', {
      projectId,
      error: error.message
    });

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export const GET = withApiRateLimit(
  withValidation(getHandler, { query: getQuerySchema })
);
export const POST = withApiRateLimit(postHandler);
export const PUT = withApiRateLimit(putHandler);
