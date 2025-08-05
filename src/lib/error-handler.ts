/**
 * @file: error-handler.ts
 * @description: Централизованная обработка ошибок с русскими сообщениями
 * @project: SaaS Bonus System
 * @dependencies: logger
 * @created: 2025-01-27
 * @author: AI Assistant + User
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  API = 'API',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL = 'INTERNAL',
  BAD_REQUEST = 'BAD_REQUEST',
  FORBIDDEN = 'FORBIDDEN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  statusCode: number;
}

export class BusinessError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number,
    code?: string,
    details?: any
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'BusinessError';
  }
}

// Предопределенные ошибки с русскими сообщениями
export const CommonErrors = {
  // Аутентификация
  INVALID_TOKEN: new BusinessError(
    ErrorType.AUTHENTICATION,
    'Недействительный токен авторизации',
    401,
    'INVALID_TOKEN'
  ),
  TOKEN_EXPIRED: new BusinessError(
    ErrorType.AUTHENTICATION,
    'Срок действия токена истек',
    401,
    'TOKEN_EXPIRED'
  ),
  UNAUTHORIZED: new BusinessError(
    ErrorType.AUTHENTICATION,
    'Необходима авторизация',
    401,
    'UNAUTHORIZED'
  ),

  // Авторизация
  INSUFFICIENT_PERMISSIONS: new BusinessError(
    ErrorType.AUTHORIZATION,
    'Недостаточно прав для выполнения операции',
    403,
    'INSUFFICIENT_PERMISSIONS'
  ),
  PROJECT_ACCESS_DENIED: new BusinessError(
    ErrorType.AUTHORIZATION,
    'Нет доступа к данному проекту',
    403,
    'PROJECT_ACCESS_DENIED'
  ),

  // Валидация
  INVALID_EMAIL: new BusinessError(
    ErrorType.VALIDATION,
    'Некорректный email адрес',
    400,
    'INVALID_EMAIL'
  ),
  INVALID_PHONE: new BusinessError(
    ErrorType.VALIDATION,
    'Некорректный номер телефона',
    400,
    'INVALID_PHONE'
  ),
  REQUIRED_FIELD_MISSING: (field: string) =>
    new BusinessError(
      ErrorType.VALIDATION,
      `Обязательное поле "${field}" не заполнено`,
      400,
      'REQUIRED_FIELD_MISSING',
      { field }
    ),
  INVALID_AMOUNT: new BusinessError(
    ErrorType.VALIDATION,
    'Сумма должна быть положительным числом',
    400,
    'INVALID_AMOUNT'
  ),

  // Не найдено
  PROJECT_NOT_FOUND: new BusinessError(
    ErrorType.NOT_FOUND,
    'Проект не найден',
    404,
    'PROJECT_NOT_FOUND'
  ),
  USER_NOT_FOUND: new BusinessError(
    ErrorType.NOT_FOUND,
    'Пользователь не найден',
    404,
    'USER_NOT_FOUND'
  ),
  BONUS_NOT_FOUND: new BusinessError(
    ErrorType.NOT_FOUND,
    'Бонус не найден',
    404,
    'BONUS_NOT_FOUND'
  ),

  // Конфликты
  USER_ALREADY_EXISTS: new BusinessError(
    ErrorType.CONFLICT,
    'Пользователь с таким email или телефоном уже существует',
    409,
    'USER_ALREADY_EXISTS'
  ),
  PROJECT_ALREADY_EXISTS: new BusinessError(
    ErrorType.CONFLICT,
    'Проект с таким названием уже существует',
    409,
    'PROJECT_ALREADY_EXISTS'
  ),
  INSUFFICIENT_BONUSES: new BusinessError(
    ErrorType.CONFLICT,
    'Недостаточно бонусов на счету',
    409,
    'INSUFFICIENT_BONUSES'
  ),

  // Rate limiting
  RATE_LIMIT_EXCEEDED: new BusinessError(
    ErrorType.RATE_LIMIT,
    'Превышен лимит запросов. Попробуйте позже',
    429,
    'RATE_LIMIT_EXCEEDED'
  ),

  // Внутренние ошибки
  DATABASE_ERROR: new BusinessError(
    ErrorType.INTERNAL,
    'Ошибка базы данных',
    500,
    'DATABASE_ERROR'
  ),
  EXTERNAL_API_ERROR: new BusinessError(
    ErrorType.INTERNAL,
    'Ошибка внешнего API',
    500,
    'EXTERNAL_API_ERROR'
  ),
  BOT_ERROR: new BusinessError(
    ErrorType.INTERNAL,
    'Ошибка Telegram бота',
    500,
    'BOT_ERROR'
  ),

  // Webhook ошибки
  INVALID_WEBHOOK_SECRET: new BusinessError(
    ErrorType.AUTHENTICATION,
    'Неверный webhook secret',
    401,
    'INVALID_WEBHOOK_SECRET'
  ),
  PROJECT_INACTIVE: new BusinessError(
    ErrorType.FORBIDDEN,
    'Проект деактивирован',
    403,
    'PROJECT_INACTIVE'
  ),
  INVALID_WEBHOOK_DATA: new BusinessError(
    ErrorType.BAD_REQUEST,
    'Некорректные данные webhook',
    400,
    'INVALID_WEBHOOK_DATA'
  )
};

// Функция для обработки неизвестных ошибок
export function handleUnknownError(error: unknown): BusinessError {
  if (error instanceof BusinessError) {
    return error;
  }

  if (error instanceof Error) {
    // Попытка мапинга известных ошибок
    if (error.message.includes('unique constraint')) {
      if (error.message.includes('email')) {
        return new BusinessError(
          ErrorType.CONFLICT,
          'Пользователь с таким email уже существует',
          409,
          'EMAIL_CONFLICT'
        );
      }
      if (error.message.includes('phone')) {
        return new BusinessError(
          ErrorType.CONFLICT,
          'Пользователь с таким телефоном уже существует',
          409,
          'PHONE_CONFLICT'
        );
      }
      return new BusinessError(
        ErrorType.CONFLICT,
        'Нарушение уникальности данных',
        409,
        'UNIQUE_CONSTRAINT'
      );
    }

    if (error.message.includes('foreign key constraint')) {
      return new BusinessError(
        ErrorType.BAD_REQUEST,
        'Ссылка на несуществующий объект',
        400,
        'FOREIGN_KEY_CONSTRAINT'
      );
    }

    if (error.message.includes('not found')) {
      return new BusinessError(
        ErrorType.NOT_FOUND,
        'Запрашиваемый ресурс не найден',
        404,
        'RESOURCE_NOT_FOUND'
      );
    }

    // Общая ошибка с сообщением
    return new BusinessError(
      ErrorType.INTERNAL,
      `Внутренняя ошибка: ${error.message}`,
      500,
      'INTERNAL_ERROR',
      { originalMessage: error.message }
    );
  }

  // Неизвестная ошибка
  return new BusinessError(
    ErrorType.INTERNAL,
    'Произошла неизвестная ошибка',
    500,
    'UNKNOWN_ERROR',
    { originalError: error }
  );
}

// Функция для создания ответа с ошибкой
export function createErrorResponse(
  error: BusinessError,
  includeDetails = false
): NextResponse {
  const responseBody: any = {
    success: false,
    error: {
      type: error.type,
      message: error.message,
      code: error.code
    }
  };

  // В development режиме или при специальном флаге добавляем детали
  if (includeDetails || process.env.NODE_ENV === 'development') {
    responseBody.error.details = error.details;
    responseBody.error.stack = error.stack;
  }

  // Логируем ошибку
  if (error.statusCode >= 500) {
    logger.error('Internal server error', {
      type: error.type,
      message: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack
    });
  } else {
    logger.warn('Client error', {
      type: error.type,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode
    });
  }

  return NextResponse.json(responseBody, { status: error.statusCode });
}

// Middleware для обработки ошибок в API routes
export function withErrorHandler(
  handler: (...args: any[]) => Promise<NextResponse>
) {
  return async (...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      const businessError = handleUnknownError(error);
      return createErrorResponse(businessError);
    }
  };
}

// Утилиты для валидации
export const Validators = {
  email: (email: string): void => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw CommonErrors.INVALID_EMAIL;
    }
  },

  phone: (phone: string): void => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
      throw CommonErrors.INVALID_PHONE;
    }
  },

  required: (value: any, fieldName: string): void => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw CommonErrors.REQUIRED_FIELD_MISSING(fieldName);
    }
  },

  positiveNumber: (value: number): void => {
    if (typeof value !== 'number' || value <= 0) {
      throw CommonErrors.INVALID_AMOUNT;
    }
  },

  uuid: (value: string, fieldName: string): void => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new BusinessError(
        ErrorType.VALIDATION,
        `Поле "${fieldName}" должно быть корректным UUID`,
        400,
        'INVALID_UUID',
        { field: fieldName }
      );
    }
  }
};

export default {
  BusinessError,
  CommonErrors,
  handleUnknownError,
  createErrorResponse,
  withErrorHandler,
  Validators
};
