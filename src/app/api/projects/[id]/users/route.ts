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
import { normalizePhone, isValidNormalizedPhone } from '@/lib/phone';
import { getCurrentAdmin } from '@/lib/auth';
import { ProjectService } from '@/lib/services/project.service';

const getQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(20).optional(),
  search: z.string().max(200).optional()
});

async function getHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; validatedQuery?: any }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Проверяем доступ к проекту
    await ProjectService.verifyProjectAccess(id, admin.sub);

    // Парсим параметры напрямую из URL
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1),
      1000
    );
    const search = url.searchParams.get('search') || undefined;

    // Парсим фильтр по партнёрской роли: ?role=TRAINER,MANAGER
    // Только валидные значения PartnerRole принимаем; неизвестные игнорируем.
    const VALID_PARTNER_ROLES = new Set([
      'CLIENT',
      'TRAINER',
      'MANAGER',
      'DIRECTOR'
    ]);
    const roleParam = url.searchParams.get('role');
    const roles = roleParam
      ? roleParam
          .split(',')
          .map((r) => r.trim().toUpperCase())
          .filter((r) => VALID_PARTNER_ROLES.has(r))
      : [];

    // Базовый фильтр с поиском
    const where: any = { projectId: id };
    if (search && search.trim().length > 0) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { telegramUsername: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (roles.length > 0) {
      where.partnerRole = { in: roles };
    }

    const { users: enrichedUsers, total } = await UserService.getProjectUsers(
      id,
      page,
      limit,
      where
    );

    // Форматируем под ожидаемый UI
    const formattedUsers = enrichedUsers.map((user, index) => {
      const currentBalance =
        Number(user.totalEarned || 0) - Number(user.totalSpent || 0);
      const roundedBalance = Number(currentBalance.toFixed(2));
      const isLinkedToBot = Boolean(user.telegramId);
      // Пользователь активен, если:
      // 1. Явно установлен isActive === true ИЛИ
      // 2. Привязан к Telegram (telegramId не null)
      // Примечание: пользователи без Telegram должны быть неактивными по умолчанию
      const computedActive = user.isActive === true || Boolean(user.telegramId);

      // Логируем для отладки статуса пользователя
      if (index === 0) {
        logger.debug('User status check (first user)', {
          userId: user.id,
          userIsActive: user.isActive,
          hasTelegramId: !!user.telegramId,
          telegramId: user.telegramId?.toString(),
          computedActive,
          email: user.email
        });
      }

      return {
        id: user.id,
        name:
          `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
          user.email ||
          'Без имени',
        email: user.email,
        phone: user.phone,
        bonusBalance: roundedBalance,
        totalEarned: Number(Number(user.totalEarned || 0).toFixed(2)),
        createdAt: user.registeredAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        avatar: `https://api.slingacademy.com/public/sample-users/${(index % 10) + 1}.png`,
        isActive: computedActive,
        // Дополнительные поля для project-users-view
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate ? user.birthDate.toISOString() : null,
        registeredAt: user.registeredAt.toISOString(),
        totalBonuses: Number(Number(user.totalEarned || 0).toFixed(2)),
        activeBonuses: roundedBalance,
        lastActivity: user.updatedAt.toISOString(),
        currentLevel: user.currentLevel || user.level?.name || undefined,
        // Telegram данные
        telegramId: user.telegramId ? user.telegramId.toString() : null,
        telegramUsername: user.telegramUsername || null,
        // Партнёрская иерархия (Phase 2 b2b-referral-hierarchy)
        partnerRole: (user as any).partnerRole || 'CLIENT',
        outboundReferralPlanId: (user as any).outboundReferralPlanId ?? null
      };
    });

    // Получаем статистику проекта
    const stats = await db.$transaction(async (tx) => {
      // Общее количество пользователей
      const totalUsersCount = await tx.user.count({
        where: { projectId: id }
      });

      // Активные пользователи (с бонусами > 0)
      const activeUsersCount = await tx.user.count({
        where: {
          projectId: id,
          bonuses: {
            some: {
              isUsed: false,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
            }
          }
        }
      });

      // Общий баланс бонусов
      const totalBonusesResult = await tx.bonus.aggregate({
        where: {
          user: { projectId: id },
          isUsed: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
        },
        _sum: { amount: true }
      });

      return {
        totalUsers: totalUsersCount,
        activeUsers: activeUsersCount,
        totalBonuses: Number(totalBonusesResult._sum.amount || 0)
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
      },
      stats
    });
  } catch (error) {
    const { id } = await context.params;

    // Обработка ошибок доступа
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    logger.error('Ошибка получения пользователей', {
      projectId: id,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
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
  let id: string | undefined;
  try {
    logger.info('Начало создания пользователя', {});

    const admin = await getCurrentAdmin();
    if (!admin) {
      logger.warn('Попытка создания пользователя без авторизации');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    id = (await context.params).id;
    logger.info('Параметры получены', { projectId: id, adminId: admin.sub });

    // Проверяем доступ к проекту
    await ProjectService.verifyProjectAccess(id, admin.sub);
    logger.info('Доступ к проекту подтвержден', { projectId: id });

    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.error('Ошибка парсинга тела запроса', {
        projectId: id,
        error:
          parseError instanceof Error ? parseError.message : String(parseError)
      });
      return NextResponse.json(
        { error: 'Неверный формат данных запроса' },
        { status: 400 }
      );
    }

    // Проверяем существование проекта
    logger.info('Проверка существования проекта', { projectId: id });
    const project = await db.project.findUnique({
      where: { id }
    });

    if (!project) {
      logger.warn('Проект не найден', { projectId: id });
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }
    logger.info('Проект найден', { projectId: id, projectName: project.name });

    // Проверка лимита пользователей
    try {
      const { BillingService } = await import('@/lib/services/billing.service');
      const limitCheck = await BillingService.checkLimit(admin.sub, 'users', {
        projectId: id
      });

      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: `Лимит пользователей исчерпан (${limitCheck.used}/${limitCheck.limit}). Обновите тарифный план для увеличения лимита.`,
            limitReached: true,
            currentUsage: limitCheck.used,
            limit: limitCheck.limit,
            planId: limitCheck.planId
          },
          { status: 402 }
        );
      }
    } catch (billingError) {
      logger.warn('Ошибка при проверке лимита пользователей', {
        projectId: id,
        adminId: admin.sub,
        error:
          billingError instanceof Error
            ? billingError.message
            : String(billingError),
        stack: billingError instanceof Error ? billingError.stack : undefined
      });
      // Продолжаем выполнение, если проверка лимита не удалась
    }

    // Очищаем пустые строки и null значения
    // Преобразуем пустые строки в undefined для корректной валидации опциональных полей
    const cleanedBody = {
      firstName:
        body.firstName && body.firstName.trim()
          ? body.firstName.trim()
          : undefined,
      lastName:
        body.lastName && body.lastName.trim()
          ? body.lastName.trim()
          : undefined,
      email: body.email && body.email.trim() ? body.email.trim() : undefined,
      phone: body.phone && body.phone.trim() ? body.phone.trim() : undefined,
      birthDate:
        body.birthDate && body.birthDate.trim()
          ? body.birthDate.trim()
          : undefined
    };

    // Валидация входных данных (с нормализацией телефона)
    let normalizedPhone: string | undefined = undefined;
    try {
      normalizedPhone = cleanedBody.phone
        ? normalizePhone(cleanedBody.phone)
        : undefined;
    } catch (phoneError) {
      logger.warn('Ошибка нормализации телефона', {
        projectId: id,
        phone: cleanedBody.phone,
        error:
          phoneError instanceof Error ? phoneError.message : String(phoneError)
      });
      // Продолжаем без нормализации, валидация схемы покажет ошибку
    }

    // Валидируем дату рождения
    // Поддерживаем форматы: YYYY-MM-DD, ISO datetime, Date объект
    let validatedBirthDate: Date | undefined = undefined;
    if (cleanedBody.birthDate) {
      try {
        // Если это строка в формате YYYY-MM-DD, добавляем время для валидации
        const dateStr = cleanedBody.birthDate;
        const date = dateStr.includes('T')
          ? new Date(dateStr)
          : new Date(dateStr + 'T00:00:00.000Z');

        if (isNaN(date.getTime())) {
          return NextResponse.json(
            { error: 'Неверный формат даты рождения' },
            { status: 400 }
          );
        }
        validatedBirthDate = date;
      } catch (e) {
        return NextResponse.json(
          { error: 'Неверный формат даты рождения' },
          { status: 400 }
        );
      }
    }

    let validated: any;
    try {
      validated = validateWithSchema(createUserSchema, {
        ...cleanedBody,
        phone: normalizedPhone || undefined,
        projectId: id,
        birthDate: validatedBirthDate
      });
    } catch (validationError) {
      logger.error('Ошибка валидации данных пользователя', {
        projectId: id,
        cleanedBody,
        error:
          validationError instanceof Error
            ? validationError.message
            : String(validationError),
        stack:
          validationError instanceof Error ? validationError.stack : undefined
      });
      throw validationError;
    }

    if (validated.phone && !isValidNormalizedPhone(validated.phone)) {
      return NextResponse.json(
        { error: 'Неверный формат телефона' },
        { status: 400 }
      );
    }

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

    // Создаем пользователя неактивным по умолчанию
    // Пользователь станет активным только после взаимодействия с ботом
    logger.info('Создание пользователя в БД', {
      projectId: id,
      email: validated.email,
      phone: validated.phone,
      firstName: validated.firstName
    });
    const newUser = await db.user.create({
      data: {
        projectId: id,
        firstName: validated.firstName || null,
        lastName: validated.lastName || null,
        email: validated.email || null,
        phone: validated.phone || null,
        birthDate: validated.birthDate || null,
        isActive: project?.operationMode === 'WITHOUT_BOT'
      }
    });
    logger.info('Пользователь создан в БД', {
      projectId: id,
      userId: newUser.id
    });

    // Приветственный бонус (фиксированная сумма), срок действия — как у проекта
    try {
      const [settings, referralProgram] = await Promise.all([
        db.botSettings.findUnique({
          where: { projectId: id }
        }),
        db.referralProgram.findUnique({
          where: { projectId: id },
          select: { welcomeBonus: true }
        })
      ]);
      const meta = (settings?.functionalSettings as any) || {};
      const welcomeAmount = Number(
        meta.welcomeBonusAmount ?? referralProgram?.welcomeBonus ?? 0
      );
      if (welcomeAmount > 0) {
        const expiresAt = new Date();
        expiresAt.setDate(
          expiresAt.getDate() + Number(project.bonusExpiryDays || 365)
        );

        const bonus = await db.bonus.create({
          data: {
            userId: newUser.id,
            amount: welcomeAmount,
            type: 'MANUAL',
            description: 'Приветственный бонус при регистрации',
            expiresAt
          }
        });

        await db.transaction.create({
          data: {
            userId: newUser.id,
            bonusId: bonus.id,
            amount: welcomeAmount,
            type: 'EARN',
            description: 'Приветственный бонус при регистрации'
          }
        });
      }
    } catch (e) {
      logger.warn('Не удалось начислить приветственный бонус', {
        projectId: id,
        userId: newUser.id,
        error: e instanceof Error ? e.message : String(e)
      });
    }

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
    let projectId: string | undefined = id;
    if (!projectId) {
      try {
        projectId = (await context.params).id;
      } catch (e) {
        projectId = 'unknown';
      }
    }

    // Обрабатываем ошибки валидации отдельно
    if (error instanceof Error && error.message.includes('Ошибка валидации')) {
      logger.warn('Ошибка валидации при создании пользователя', {
        projectId,
        error: error.message
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Обрабатываем ошибки доступа
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    logger.error('Ошибка создания пользователя', {
      projectId,
      error:
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      cause: error instanceof Error ? error.cause : undefined
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
    // Авторизация и проверка доступа к проекту (как в GET/POST).
    // Без этого любой авторизованный админ мог изменять бонусы и слать
    // рассылки в ЧУЖИЕ проекты (cross-tenant IDOR).
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await context.params;
    await ProjectService.verifyProjectAccess(projectId, admin.sub);

    const body = await request.json();
    const { operation, userIds, data } = body;

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Все операции работают по списку userIds — убеждаемся, что эти
    // пользователи принадлежат текущему проекту (нельзя начислять/списывать
    // бонусы и слать уведомления чужим пользователям).
    if (Array.isArray(userIds) && userIds.length > 0) {
      const validCount = await db.user.count({
        where: { projectId, id: { in: userIds } }
      });
      if (validCount !== userIds.length) {
        return NextResponse.json(
          { error: 'Некоторые пользователи не принадлежат проекту' },
          { status: 400 }
        );
      }
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
            const deductAmount = Number(data.amount);
            if (!Number.isFinite(deductAmount) || deductAmount <= 0) {
              results.push({
                userId,
                success: false,
                error: 'Некорректная сумма списания'
              });
              continue;
            }

            // Списываем по нескольким записям бонусов (FIFO): баланс
            // пользователя может складываться из нескольких начислений.
            await db.$transaction(async (tx) => {
              const activeBonuses = await tx.bonus.findMany({
                where: {
                  userId,
                  isUsed: false,
                  OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
                },
                orderBy: { createdAt: 'asc' }
              });

              const totalAvailable = activeBonuses.reduce(
                (sum, b) => sum + Number(b.amount),
                0
              );

              if (totalAvailable < deductAmount) {
                throw new Error('Недостаточно бонусов для списания');
              }

              let remaining = deductAmount;
              let firstBonusId: string | null = null;
              for (const b of activeBonuses) {
                if (remaining <= 0) break;
                const available = Number(b.amount);
                const take = Math.min(remaining, available);
                if (firstBonusId === null) firstBonusId = b.id;

                if (take >= available) {
                  await tx.bonus.update({
                    where: { id: b.id },
                    data: { isUsed: true }
                  });
                } else {
                  await tx.bonus.update({
                    where: { id: b.id },
                    data: { amount: available - take }
                  });
                }
                remaining -= take;
              }

              // Одна суммарная запись в истории транзакций.
              await tx.transaction.create({
                data: {
                  userId,
                  bonusId: firstBonusId,
                  amount: deductAmount,
                  type: 'SPEND',
                  description: data.description || 'Массовое списание бонусов'
                }
              });
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

          // sendRichBroadcastMessage возвращает только агрегатные счётчики
          // (sent/failed), без привязки к конкретным userId. Поэтому не
          // выдумываем сопоставление с userIds[i] — фиксируем агрегат честно.
          for (let i = 0; i < result.sent; i++) {
            results.push({ success: true });
          }
          for (let i = 0; i < result.failed; i++) {
            results.push({
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

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

export const GET = withApiRateLimit(getHandler);
export const POST = withApiRateLimit(postHandler);
export const PUT = withApiRateLimit(putHandler);
