/**
 * @file: with-rate-limit-redis.ts
 * @description: Rate limiting middleware с использованием Redis
 * @project: SaaS Bonus System
 * @dependencies: Redis
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/redis';
import { logger } from '@/lib/logger';

interface RateLimitOptions {
  limit?: number;
  window?: number; // в секундах
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Rate limiting middleware для API endpoints с Redis
 */
export function withRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: RateLimitOptions = {}
) {
  const {
    limit = 100,
    window = 60,
    keyGenerator = (req) => {
      // По умолчанию используем IP адрес
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
      return ip;
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      const identifier = keyGenerator(req);
      const rateLimitKey = `api:${identifier}`;

      // Проверяем rate limit
      const rateLimitResult = await RateLimiter.middleware(identifier, {
        limit,
        window,
        keyPrefix: 'api'
      });

      // Добавляем заголовки rate limit в ответ
      const headers = new Headers(rateLimitResult.headers);

      // Если превышен лимит
      if (!rateLimitResult.success) {
        logger.warn('Rate limit exceeded', {
          identifier,
          limit,
          window,
          path: req.url
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Too many requests',
            message: 'Превышен лимит запросов. Попробуйте позже.'
          },
          {
            status: 429,
            headers
          }
        );
      }

      // Выполняем основной обработчик
      const response = await handler(req, ...args);

      // Добавляем заголовки rate limit к успешному ответу, не теряя исходные
      const mergedHeaders = new Headers(response.headers);
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        mergedHeaders.set(key, value);
      });

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: mergedHeaders
      });
    } catch (error) {
      logger.error('Rate limit middleware error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: req.url
      });

      // При ошибке в rate limiter разрешаем запрос
      return handler(req, ...args);
    }
  };
}

/**
 * Rate limiting для webhook endpoints с более строгими лимитами
 */
export function withWebhookRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return withRateLimit(handler, {
    limit: 50, // 50 запросов
    window: 60, // в минуту
    keyGenerator: (req) => {
      // Для webhook используем комбинацию IP + webhook secret
      const pathParts = req.url.split('/');
      const webhookSecret = pathParts[pathParts.length - 1];
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
      return `webhook:${webhookSecret}:${ip}`;
    }
  });
}

/**
 * Rate limiting для API с учетом проекта
 */
export function withProjectRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: Partial<RateLimitOptions> = {}
) {
  return withRateLimit(handler, {
    limit: 200, // 200 запросов
    window: 60, // в минуту
    ...options,
    keyGenerator: (req) => {
      // Извлекаем projectId из URL
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const projectIndex = pathParts.indexOf('projects');
      const projectId =
        projectIndex >= 0 ? pathParts[projectIndex + 1] : 'unknown';

      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

      return `project:${projectId}:${ip}`;
    }
  });
}

/**
 * Rate limiting для аналитики (более дорогие операции)
 */
export function withAnalyticsRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return withRateLimit(handler, {
    limit: 20, // 20 запросов
    window: 60, // в минуту
    keyGenerator: (req) => {
      // Для аналитики используем projectId
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const projectIndex = pathParts.indexOf('projects');
      const projectId =
        projectIndex >= 0 ? pathParts[projectIndex + 1] : 'unknown';

      return `analytics:${projectId}`;
    }
  });
}

export default withRateLimit;
