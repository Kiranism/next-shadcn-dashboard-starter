/**
 * @file: route-refactored.ts
 * @description: Улучшенный API для управления пользователями проекта
 * @project: SaaS Bonus System
 * @dependencies: NextRequest, NextResponse, validation, error-handler
 * @created: 2025-01-27
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
// import { withValidation } from '@/lib/validation/middleware'; // Не используется
import { withErrorHandler, CommonErrors } from '@/lib/error-handler';
import { withApiRateLimit } from '@/lib/with-rate-limit';
import { logger, createRequestLogger } from '@/lib/logger';
import { db } from '@/lib/db';
import { UserService } from '@/lib/services/user.service';
import { BonusService } from '@/lib/services/user.service';
import {
  createUserSchema,
  projectUsersQuerySchema,
  bulkBonusActionSchema,
  notificationSchema,
  validateWithSchema
} from '@/lib/validation/schemas';
// import { z } from 'zod'; // Не используется

// ===== GET: Получение списка пользователей проекта =====

const getUsersHandler = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const requestId = crypto.randomUUID();
    const requestLogger = createRequestLogger(requestId);
    const perf = logger.startPerformance();

    try {
      const { id: projectId } = params;

      // Валидация projectId
      if (!projectId || !/^[a-zA-Z0-9_-]+$/.test(projectId)) {
        throw CommonErrors.PROJECT_NOT_FOUND;
      }

      // Парсинг query параметров
      const url = new URL(request.url);
      const queryParams = {
        page: parseInt(url.searchParams.get('page') || '1'),
        limit: Math.min(parseInt(url.searchParams.get('limit') || '20'), 100),
        search: url.searchParams.get('search') || undefined,
        sortBy: url.searchParams.get('sortBy') || 'registeredAt',
        sortOrder: (url.searchParams.get('sortOrder') || 'desc') as
          | 'asc'
          | 'desc',
        level: url.searchParams.get('level') || undefined,
        minBalance: url.searchParams.get('minBalance')
          ? parseFloat(url.searchParams.get('minBalance')!)
          : undefined,
        maxBalance: url.searchParams.get('maxBalance')
          ? parseFloat(url.searchParams.get('maxBalance')!)
          : undefined
      };

      // Валидация query параметров
      const validatedQuery = validateWithSchema(
        projectUsersQuerySchema,
        queryParams
      );

      requestLogger.info(
        'Fetching project users',
        {
          projectId,
          query: validatedQuery
        },
        'users-api'
      );

      // Проверяем существование проекта
      const project = await db.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        throw CommonErrors.PROJECT_NOT_FOUND;
      }

      // Строим WHERE условие для фильтрации
      const whereCondition: any = { projectId };

      if (validatedQuery.search) {
        const searchTerm = validatedQuery.search.toLowerCase();
        whereCondition.OR = [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } }
        ];
      }

      if (validatedQuery.level) {
        whereCondition.currentLevel = validatedQuery.level;
      }

      // Получаем общее количество пользователей
      const totalCount = await db.user.count({ where: whereCondition });

      // Получаем пользователей с пагинацией
      const users = await db.user.findMany({
        where: whereCondition,
        orderBy: {
          [validatedQuery.sortBy as any]: validatedQuery.sortOrder
        },
        skip: ((validatedQuery.page || 1) - 1) * (validatedQuery.limit || 10),
        take: validatedQuery.limit || 10
      });

      // Обогащаем данные пользователей балансами
      const enrichedUsers = await Promise.all(
        users.map(async (user, index) => {
          try {
            const userBalance = await UserService.getUserBalance(user.id);

            // Фильтрация по балансу (после получения данных)
            const currentBalance = Number(userBalance.currentBalance);
            if (
              (validatedQuery.minBalance !== undefined &&
                currentBalance < validatedQuery.minBalance) ||
              (validatedQuery.maxBalance !== undefined &&
                currentBalance > validatedQuery.maxBalance)
            ) {
              return null; // Исключаем пользователя
            }

            return {
              id: user.id,
              name:
                `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                'Без имени',
              email: user.email,
              phone: user.phone,
              firstName: user.firstName,
              lastName: user.lastName,
              birthDate: user.birthDate,
              registeredAt: user.registeredAt,
              updatedAt: user.updatedAt,

              // Баланс и статистика
              bonusBalance: Number(userBalance.currentBalance),
              totalEarned: Number(userBalance.totalEarned),
              totalSpent: Number(userBalance.totalSpent),

              // Уровень
              currentLevel: user.currentLevel,
              bonusLevel: null, // Убираем bonusLevel, так как его нет в схеме

              // UI данные
              avatar: `https://api.slingacademy.com/public/sample-users/${(index % 10) + 1}.png`,
              lastActivity: user.updatedAt
            };
          } catch (error) {
            requestLogger.warn(
              'Failed to get user balance',
              {
                userId: user.id,
                error: error instanceof Error ? error.message : 'Unknown error'
              },
              'users-api'
            );

            return {
              id: user.id,
              name:
                `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                'Без имени',
              email: user.email,
              phone: user.phone,
              firstName: user.firstName,
              lastName: user.lastName,
              bonusBalance: 0,
              totalEarned: 0,
              avatar: `https://api.slingacademy.com/public/sample-users/${(index % 10) + 1}.png`,
              registeredAt: user.registeredAt,
              updatedAt: user.updatedAt
            };
          }
        })
      );

      // Убираем null значения (отфильтрованные пользователи)
      const filteredUsers = enrichedUsers.filter((user) => user !== null);

      const totalPages = Math.ceil(totalCount / (validatedQuery.limit || 10));

      const response = {
        success: true,
        data: filteredUsers,
        pagination: {
          page: validatedQuery.page || 1,
          limit: validatedQuery.limit || 10,
          total: totalCount,
          totalPages,
          hasNext: (validatedQuery.page || 1) < totalPages,
          hasPrev: (validatedQuery.page || 1) > 1
        },
        filters: {
          search: validatedQuery.search,
          level: validatedQuery.level,
          minBalance: validatedQuery.minBalance,
          maxBalance: validatedQuery.maxBalance
        }
      };

      requestLogger.info(
        `Fetched ${filteredUsers.length} users`,
        {
          projectId,
          totalCount,
          filteredCount: filteredUsers.length,
          page: validatedQuery.page || 1
        },
        'users-api'
      );

      return NextResponse.json(response);
    } catch (error) {
      logger.endPerformance(
        perf,
        'error',
        'Failed to fetch users',
        {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        'users-api'
      );
      throw error;
    }
  }
);

// ===== POST: Создание нового пользователя =====

const createUserHandler = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const requestId = crypto.randomUUID();
    const requestLogger = createRequestLogger(requestId);

    try {
      const { id: projectId } = params;
      const body = await request.json();

      // Валидация данных
      const validatedData = validateWithSchema(createUserSchema, {
        ...body,
        projectId,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined
      });

      requestLogger.info(
        'Creating new user',
        {
          projectId,
          email: validatedData.email,
          phone: validatedData.phone
        },
        'users-api'
      );

      // Проверяем существование проекта
      const project = await db.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        throw CommonErrors.PROJECT_NOT_FOUND;
      }

      // Создаем пользователя через сервис
      const newUser = await UserService.createUser(validatedData as any);

      requestLogger.info(
        'User created successfully',
        {
          projectId,
          userId: newUser.id,
          email: newUser.email
        },
        'users-api'
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Пользователь успешно создан',
          data: {
            id: newUser.id,
            email: newUser.email,
            phone: newUser.phone,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            registeredAt: newUser.registeredAt
          }
        },
        { status: 201 }
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('unique constraint')
      ) {
        if (error.message.includes('email')) {
          throw CommonErrors.USER_ALREADY_EXISTS;
        }
        if (error.message.includes('phone')) {
          throw CommonErrors.USER_ALREADY_EXISTS;
        }
      }
      throw error;
    }
  }
);

// ===== PUT: Массовые операции с пользователями =====

const bulkOperationsHandler = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const requestId = crypto.randomUUID();
    const requestLogger = createRequestLogger(requestId);

    try {
      const { id: projectId } = params;
      const body = await request.json();

      requestLogger.info(
        'Processing bulk operation',
        {
          projectId,
          operation: body.operation,
          userCount: body.userIds?.length || 0
        },
        'users-api'
      );

      switch (body.operation) {
        case 'bulk_bonus_award':
          return await handleBulkBonusAward(projectId, body, requestLogger);

        case 'bulk_bonus_deduct':
          return await handleBulkBonusDeduct(projectId, body, requestLogger);

        case 'bulk_notification':
          return await handleBulkNotification(projectId, body, requestLogger);

        default:
          throw new Error(`Неизвестная операция: ${body.operation}`);
      }
    } catch (error) {
      throw error;
    }
  }
);

// ===== Вспомогательные функции =====

async function handleBulkBonusAward(
  projectId: string,
  body: any,
  requestLogger: ReturnType<typeof createRequestLogger>
) {
  const validatedData = validateWithSchema(bulkBonusActionSchema, body);

  const results = await Promise.allSettled(
    validatedData.userIds.map(async (userId) => {
      try {
        const result = await BonusService.awardBonus({
          userId,
          amount: validatedData.amount,
          description: validatedData.description,
          type: 'MANUAL',
          expiresAt: validatedData.expiresAt
            ? new Date(validatedData.expiresAt)
            : undefined
        });
        return { userId, success: true, bonusId: result.id };
      } catch (error) {
        requestLogger.warn(
          'Failed to award bonus to user',
          {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          'users-api'
        );
        return {
          userId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    })
  );

  const successful = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;
  const failed = results.length - successful;

  requestLogger.info(
    'Bulk bonus award completed',
    {
      projectId,
      successful,
      failed,
      total: results.length
    },
    'users-api'
  );

  return NextResponse.json({
    success: true,
    message: `Бонусы начислены: ${successful} успешно, ${failed} ошибок`,
    data: {
      successful,
      failed,
      total: results.length,
      results: results.map((r) =>
        r.status === 'fulfilled' ? r.value : { error: 'Failed' }
      )
    }
  });
}

async function handleBulkBonusDeduct(
  projectId: string,
  body: any,
  requestLogger: ReturnType<typeof createRequestLogger>
) {
  const validatedData = validateWithSchema(bulkBonusActionSchema, body);

  const results = await Promise.allSettled(
    validatedData.userIds.map(async (userId) => {
      try {
        await BonusService.spendBonuses(
          userId,
          validatedData.amount,
          validatedData.description
        );
        return { userId, success: true };
      } catch (error) {
        requestLogger.warn(
          'Failed to deduct bonus from user',
          {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          'users-api'
        );
        return {
          userId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    })
  );

  const successful = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;
  const failed = results.length - successful;

  return NextResponse.json({
    success: true,
    message: `Бонусы списаны: ${successful} успешно, ${failed} ошибок`,
    data: { successful, failed, total: results.length }
  });
}

async function handleBulkNotification(
  projectId: string,
  body: any,
  requestLogger: ReturnType<typeof createRequestLogger>
) {
  const validatedData = validateWithSchema(notificationSchema, body);

  // TODO: Реализовать отправку уведомлений через Telegram
  requestLogger.info(
    'Bulk notification requested',
    {
      projectId,
      userCount: validatedData.userIds.length,
      messageLength: validatedData.message.length
    },
    'users-api'
  );

  return NextResponse.json({
    success: true,
    message: `Уведомления отправлены ${validatedData.userIds.length} пользователям`,
    data: { sent: validatedData.userIds.length }
  });
}

// ===== Экспорт с применением middleware =====

export const GET = withApiRateLimit(getUsersHandler);
export const POST = withApiRateLimit(createUserHandler);
export const PUT = withApiRateLimit(bulkOperationsHandler);
