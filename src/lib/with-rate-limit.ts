/**
 * @file: with-rate-limit.ts
 * @description: Middleware для применения rate limiting к API routes
 * @project: SaaS Bonus System
 * @dependencies: rate-limiter.ts
 * @created: 2025-01-27
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  defaultLimiter,
  webhookLimiter,
  authLimiter,
  apiLimiter,
  getRateLimitHeaders,
  getClientIdentifier
} from './rate-limiter';

type RateLimiterType = 'default' | 'webhook' | 'auth' | 'api';

interface RateLimitOptions {
  type?: RateLimiterType;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}

export function withRateLimit(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: RateLimitOptions = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const {
      type = 'default',
      skipSuccessfulRequests = false,
      skipFailedRequests = false,
      keyGenerator
    } = options;

    // Выбираем лимитер
    const limiter = (() => {
      switch (type) {
        case 'webhook':
          return webhookLimiter;
        case 'auth':
          return authLimiter;
        case 'api':
          return apiLimiter;
        default:
          return defaultLimiter;
      }
    })();

    // Генерируем ключ для идентификации клиента
    const identifier = keyGenerator
      ? keyGenerator(request)
      : getClientIdentifier(request);

    // Проверяем лимит
    const result = limiter.check(identifier);

    if (!result.allowed) {
      // Превышен лимит
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Слишком много запросов. Попробуйте позже.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(
              (result.resetTime - Date.now()) / 1000
            ).toString(),
            ...getRateLimitHeaders(result, {
              limit: (limiter as any).maxRequests ?? 100
            })
          }
        }
      );
    }

    try {
      // Выполняем оригинальный handler
      const response = await handler(request, context);

      // Добавляем заголовки rate limit к успешным ответам
      if (!skipSuccessfulRequests && response.ok) {
        const headers = new Headers(response.headers);
        Object.entries(
          getRateLimitHeaders(result, {
            limit: (limiter as any).maxRequests ?? 100
          })
        ).forEach(([key, value]) => {
          headers.set(key, value);
        });

        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      }

      return response;
    } catch (error) {
      // Если запрос неуспешный и настроено пропускать неуспешные запросы
      if (skipFailedRequests) {
        limiter.reset(identifier);
      }

      throw error;
    }
  };
}

// Утилита для быстрого создания rate-limited роутов
export function createRateLimitedRoute(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: RateLimitOptions = {}
) {
  return withRateLimit(handler, options);
}

// Специальные обертки для частых случаев
export function withWebhookRateLimit(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return withRateLimit(handler, {
    type: 'webhook',
    keyGenerator: (req) => {
      // Для webhook'ов используем комбинацию IP + webhook secret
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const webhookSecret = pathParts[pathParts.length - 1];
      return `${getClientIdentifier(req)}-${webhookSecret}`;
    }
  });
}

export function withAuthRateLimit(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return withRateLimit(handler, {
    type: 'auth',
    skipFailedRequests: true // Не засчитываем неудачные попытки авторизации
  });
}

export function withApiRateLimit(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return withRateLimit(handler, { type: 'api' });
}
