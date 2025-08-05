/**
 * @file: middleware.ts
 * @description: Middleware для валидации в API routes
 * @project: SaaS Bonus System
 * @dependencies: zod, NextRequest, NextResponse
 * @created: 2025-01-27
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '../logger';
import {
  createErrorResponse,
  CommonErrors,
  BusinessError,
  ErrorType
} from '../error-handler';

interface ValidationOptions {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  skipValidation?: boolean;
}

interface ValidatedRequest extends NextRequest {
  validatedBody?: any;
  validatedQuery?: any;
  validatedParams?: any;
}

/**
 * Middleware для валидации входящих данных в API routes
 */
export function withValidation(
  handler: (request: ValidatedRequest, context?: any) => Promise<NextResponse>,
  options: ValidationOptions = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const {
      body: bodySchema,
      query: querySchema,
      params: paramsSchema,
      skipValidation
    } = options;

    if (skipValidation) {
      return handler(request as ValidatedRequest, context);
    }

    const validatedRequest = request as ValidatedRequest;
    const requestId =
      request.headers.get('x-request-id') || crypto.randomUUID();
    const requestLogger = logger.withContext(requestId);

    try {
      // Валидация параметров URL
      if (paramsSchema && context?.params) {
        try {
          const paramsData = await context.params;
          validatedRequest.validatedParams = paramsSchema.parse(paramsData);
          requestLogger.debug(
            'Params validation passed',
            { params: validatedRequest.validatedParams },
            'validation'
          );
        } catch (error) {
          if (error instanceof z.ZodError) {
            const errorMessage = formatZodError(error);
            requestLogger.warn(
              'Params validation failed',
              { error: errorMessage },
              'validation'
            );
            throw new BusinessError(
              ErrorType.API,
              `Неверные параметры URL: ${errorMessage}`,
              400,
              'INVALID_PARAMS'
            );
          }
          throw error;
        }
      }

      // Валидация query параметров
      if (querySchema) {
        try {
          const url = new URL(request.url);
          const queryParams = Object.fromEntries(url.searchParams);

          // Преобразуем строковые значения в нужные типы
          const processedQuery = processQueryParams(queryParams);

          validatedRequest.validatedQuery = querySchema.parse(processedQuery);
          requestLogger.debug(
            'Query validation passed',
            { query: validatedRequest.validatedQuery },
            'validation'
          );
        } catch (error) {
          if (error instanceof z.ZodError) {
            const errorMessage = formatZodError(error);
            requestLogger.warn(
              'Query validation failed',
              { error: errorMessage },
              'validation'
            );
            throw new BusinessError(
              ErrorType.API,
              `Неверные параметры запроса: ${errorMessage}`,
              400,
              'INVALID_QUERY'
            );
          }
          throw error;
        }
      }

      // Валидация тела запроса
      if (bodySchema && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.json();
          validatedRequest.validatedBody = bodySchema.parse(body);
          requestLogger.debug(
            'Body validation passed',
            {
              bodySize: JSON.stringify(body).length
            },
            'validation'
          );
        } catch (error) {
          if (error instanceof z.ZodError) {
            const errorMessage = formatZodError(error);
            requestLogger.warn(
              'Body validation failed',
              { error: errorMessage },
              'validation'
            );
            throw new BusinessError(
              ErrorType.API,
              `Неверные данные запроса: ${errorMessage}`,
              400,
              'INVALID_BODY'
            );
          } else if (error instanceof SyntaxError) {
            requestLogger.warn(
              'JSON parsing failed',
              { error: error.message },
              'validation'
            );
            throw new BusinessError(
              ErrorType.API,
              'Неверный формат JSON',
              400,
              'INVALID_JSON'
            );
          }
          throw error;
        }
      }

      // Выполняем оригинальный handler
      return await handler(validatedRequest, context);
    } catch (error) {
      if (error instanceof BusinessError) {
        return createErrorResponse(error);
      }

      // Неожиданная ошибка
      requestLogger.error(
        'Unexpected validation error',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        },
        'validation'
      );

      throw error;
    }
  };
}

/**
 * Форматирует ошибки Zod в читаемый вид
 */
function formatZodError(error: z.ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
      return `${path}${err.message}`;
    })
    .join('; ');
}

/**
 * Обрабатывает query параметры для правильной типизации
 */
function processQueryParams(
  params: Record<string, string>
): Record<string, any> {
  const processed: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    // Попытка преобразовать в число
    if (/^\d+$/.test(value)) {
      processed[key] = parseInt(value, 10);
    }
    // Попытка преобразовать в boolean
    else if (value === 'true' || value === 'false') {
      processed[key] = value === 'true';
    }
    // Попытка преобразовать в массив (разделенный запятыми)
    else if (value.includes(',')) {
      processed[key] = value.split(',').map((v) => v.trim());
    }
    // Оставляем как строку
    else {
      processed[key] = value;
    }
  }

  return processed;
}

/**
 * Специализированные валидаторы для частых случаев
 */
export const ValidationMiddleware = {
  /**
   * Валидация для создания проекта
   */
  createProject: (
    handler: (request: ValidatedRequest, context?: any) => Promise<NextResponse>
  ) =>
    withValidation(handler, {
      body: z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        domain: z.string().url().optional(),
        bonusPercentage: z.number().min(0).max(100).default(5),
        bonusExpiryDays: z.number().int().min(1).max(3650).default(365)
      })
    }),

  /**
   * Валидация для операций с пользователями
   */
  userOperation: (
    handler: (request: ValidatedRequest, context?: any) => Promise<NextResponse>
  ) =>
    withValidation(handler, {
      params: z.object({
        id: z.string().uuid()
      }),
      body: z
        .object({
          email: z.string().email().optional(),
          phone: z
            .string()
            .regex(/^\+?[\d\s\-\(\)]{10,}$/)
            .optional(),
          firstName: z.string().max(100).optional(),
          lastName: z.string().max(100).optional()
        })
        .refine((data) => data.email || data.phone, {
          message: 'Должен быть указан email или телефон'
        })
    }),

  /**
   * Валидация для операций с бонусами
   */
  bonusOperation: (
    handler: (request: ValidatedRequest, context?: any) => Promise<NextResponse>
  ) =>
    withValidation(handler, {
      body: z
        .object({
          amount: z.number().positive().max(1000000),
          description: z.string().min(1).max(500),
          userId: z.string().uuid().optional(),
          userIds: z.array(z.string().uuid()).optional()
        })
        .refine(
          (data) => data.userId || (data.userIds && data.userIds.length > 0),
          {
            message: 'Должен быть указан userId или userIds'
          }
        )
    }),

  /**
   * Валидация для webhook'ов
   */
  webhook: (
    handler: (request: ValidatedRequest, context?: any) => Promise<NextResponse>
  ) =>
    withValidation(handler, {
      params: z.object({
        webhookSecret: z.string().uuid()
      }),
      body: z.union([
        // Стандартный webhook
        z.object({
          action: z.enum(['register_user', 'purchase', 'spend_bonuses']),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          amount: z.number().positive().optional(),
          orderId: z.string().optional()
        }),
        // Tilda webhook
        z.array(
          z.object({
            name: z.string(),
            email: z.string().email().optional(),
            phone: z.string().optional(),
            payment: z.object({
              amount: z.string(),
              orderid: z.string()
            })
          })
        )
      ])
    }),

  /**
   * Валидация пагинации
   */
  pagination: (
    handler: (request: ValidatedRequest, context?: any) => Promise<NextResponse>
  ) =>
    withValidation(handler, {
      query: z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        search: z.string().optional()
      })
    }),

  /**
   * Валидация bot settings
   */
  botSettings: (
    handler: (request: ValidatedRequest, context?: any) => Promise<NextResponse>
  ) =>
    withValidation(handler, {
      body: z.object({
        botToken: z.string().regex(/^\d{8,10}:[A-Za-z0-9_-]{35}$/),
        botUsername: z
          .string()
          .regex(/^[a-zA-Z0-9_]{5,32}$/)
          .optional(),
        messageSettings: z
          .object({
            welcomeMessage: z.string().max(4096).optional(),
            balanceMessage: z.string().max(4096).optional(),
            helpMessage: z.string().max(4096).optional()
          })
          .optional(),
        functionalSettings: z
          .object({
            showBalance: z.boolean().default(true),
            showLevel: z.boolean().default(true),
            showReferral: z.boolean().default(true),
            showHistory: z.boolean().default(true),
            showHelp: z.boolean().default(true)
          })
          .optional()
      })
    })
};

/**
 * Утилита для быстрого создания валидированных route handlers
 */
export function createValidatedRoute<T>(
  schema: z.ZodSchema<T>,
  handler: (
    data: T,
    request: NextRequest,
    context?: any
  ) => Promise<NextResponse>
) {
  return withValidation(
    async (request: ValidatedRequest, context?: any) => {
      const data =
        request.validatedBody ||
        request.validatedQuery ||
        request.validatedParams;
      return handler(data, request, context);
    },
    { body: schema }
  );
}

export default ValidationMiddleware;
