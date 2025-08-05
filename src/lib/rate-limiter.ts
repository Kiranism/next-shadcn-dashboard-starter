/**
 * @file: rate-limiter.ts
 * @description: Rate limiting для защиты API endpoints от спама
 * @project: SaaS Bonus System
 * @dependencies: Map для хранения запросов
 * @created: 2025-01-27
 * @author: AI Assistant + User
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs; // 1 минута по умолчанию
    this.maxRequests = maxRequests; // 100 запросов по умолчанию

    // Очистка старых записей каждые 5 минут
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  check(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Новое окно времени
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.windowMs
      };
      this.requests.set(identifier, newEntry);

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: newEntry.resetTime
      };
    }

    if (entry.count >= this.maxRequests) {
      // Превышен лимит
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    // Увеличиваем счетчик
    entry.count++;
    this.requests.set(identifier, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.requests.entries())) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  reset(identifier: string) {
    this.requests.delete(identifier);
  }

  getStats() {
    return {
      totalKeys: this.requests.size,
      windowMs: this.windowMs,
      maxRequests: this.maxRequests
    };
  }
}

// Создаем разные лимиты для разных типов запросов
export const defaultLimiter = new RateLimiter(60000, 100); // 100 req/min
export const webhookLimiter = new RateLimiter(60000, 30); // 30 req/min для webhooks
export const authLimiter = new RateLimiter(900000, 5); // 5 req/15min для авторизации
export const apiLimiter = new RateLimiter(60000, 60); // 60 req/min для API

export function getRateLimitHeaders(result: {
  remaining: number;
  resetTime: number;
}) {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'X-RateLimit-Limit': '100'
  };
}

export function getClientIdentifier(request: Request): string {
  // Попытка получить реальный IP из заголовков
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  // Приоритет: CF -> X-Real-IP -> X-Forwarded-For -> fallback
  const ip = cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown';

  // Для webhook'ов добавляем User-Agent для лучшей идентификации
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const isWebhook = request.url.includes('/webhook/');

  return isWebhook ? `${ip}-${userAgent.slice(0, 50)}` : ip;
}

export default RateLimiter;
