/**
 * @file: redis.ts
 * @description: Redis клиент для кэширования и rate limiting
 * @project: SaaS Bonus System
 * @dependencies: ioredis
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import Redis from 'ioredis';
import { logger } from '@/lib/logger';

// Создаем Redis клиент с retry стратегией. В dev (без REDIS_URL) используем in-memory fallback
const createRedisClient = () => {
  const useRealRedis =
    !!process.env.REDIS_URL && process.env.NODE_ENV === 'production';

  if (useRealRedis) {
    const redisUrl = process.env.REDIS_URL as string;
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Переподключаемся при readonly ошибках
          return true;
        }
        return false;
      }
    });

    client.on('error', (error) => {
      logger.error('Redis connection error:', { error: error.message });
    });

    client.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    return client as unknown as Redis;
  }

  logger.warn('Redis disabled: using in-memory fallback (development)');
  const store = new Map<string, { value: string; expireAt?: number }>();
  const nowMs = () => Date.now();

  const stub: any = {
    on: () => undefined,
    async get(key: string) {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expireAt && entry.expireAt < nowMs()) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async setex(key: string, ttlSeconds: number, val: string) {
      store.set(key, { value: val, expireAt: nowMs() + ttlSeconds * 1000 });
    },
    async del(...keys: string[]) {
      let cnt = 0;
      for (const k of keys) {
        if (store.delete(k)) cnt++;
      }
      return cnt;
    },
    async keys(pattern: string) {
      if (!pattern.includes('*'))
        return Array.from(store.keys()).filter((k) => k === pattern);
      const prefix = pattern.slice(0, pattern.indexOf('*'));
      return Array.from(store.keys()).filter((k) => k.startsWith(prefix));
    },
    async incr(key: string) {
      const current = await stub.get(key);
      const num = current ? parseInt(current, 10) : 0;
      const next = (num + 1).toString();
      store.set(key, { value: next });
      return parseInt(next, 10);
    },
    async expire(key: string, ttlSeconds: number) {
      const entry = store.get(key);
      if (entry) {
        entry.expireAt = nowMs() + ttlSeconds * 1000;
        store.set(key, entry);
        return 1;
      }
      return 0;
    }
  };

  return stub as Redis;
};

// Singleton экземпляр Redis клиента
export const redis = createRedisClient();

// Утилиты для работы с кэшем
export class CacheService {
  private static DEFAULT_TTL = 60 * 5; // 5 минут по умолчанию

  /**
   * Получить значение из кэша
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null;
    }
  }

  /**
   * Сохранить значение в кэш
   */
  static async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = CacheService.DEFAULT_TTL
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await redis.setex(key, ttlSeconds, serialized);
    } catch (error) {
      logger.error('Cache set error:', { key, error });
    }
  }

  /**
   * Удалить значение из кэша
   */
  static async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', { key, error });
    }
  }

  /**
   * Удалить все значения по паттерну
   */
  static async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error:', { pattern, error });
    }
  }

  /**
   * Инвалидация кэша проекта
   */
  static async invalidateProject(projectId: string): Promise<void> {
    await Promise.all([
      this.deletePattern(`project:${projectId}:*`),
      this.deletePattern(`analytics:${projectId}:*`),
      this.deletePattern(`users:${projectId}:*`)
    ]);
  }

  /**
   * Кэширование с автоматическим обновлением
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = CacheService.DEFAULT_TTL
  ): Promise<T> {
    // Пытаемся получить из кэша
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Если нет в кэше, получаем данные
    const data = await fetcher();

    // Сохраняем в кэш
    await this.set(key, data, ttlSeconds);

    return data;
  }
}

// Rate Limiter на основе Redis
export class RateLimiter {
  /**
   * Проверка rate limit
   */
  static async checkLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const now = Date.now();
    const window = Math.floor(now / (windowSeconds * 1000));
    const redisKey = `rate_limit:${key}:${window}`;

    try {
      // Инкрементируем счетчик
      const count = await (redis as any).incr(redisKey);

      // Устанавливаем TTL при первом запросе
      if (count === 1) {
        await (redis as any).expire(redisKey, windowSeconds);
      }

      const allowed = count <= limit;
      const remaining = Math.max(0, limit - count);
      const resetAt = new Date((window + 1) * windowSeconds * 1000);

      return { allowed, remaining, resetAt };
    } catch (error) {
      logger.error('Rate limit check error:', { key, error });
      // При ошибке разрешаем запрос
      return { allowed: true, remaining: limit, resetAt: new Date() };
    }
  }

  /**
   * Rate limiter middleware для API
   */
  static async middleware(
    identifier: string,
    options: {
      limit?: number;
      window?: number;
      keyPrefix?: string;
    } = {}
  ): Promise<{ success: boolean; headers: Record<string, string> }> {
    const { limit = 100, window = 60, keyPrefix = 'api' } = options;

    const key = `${keyPrefix}:${identifier}`;
    const result = await this.checkLimit(key, limit, window);

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetAt.toISOString()
    };

    if (!result.allowed) {
      headers['Retry-After'] = Math.ceil(
        (result.resetAt.getTime() - Date.now()) / 1000
      ).toString();
    }

    return {
      success: result.allowed,
      headers
    };
  }
}

// Distributed Lock для предотвращения race conditions
export class DistributedLock {
  /**
   * Получить блокировку
   */
  static async acquire(key: string, ttlSeconds: number = 10): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const lockValue = Date.now().toString();

    try {
      const result = await (redis as any).set(
        lockKey,
        lockValue,
        'EX',
        ttlSeconds,
        'NX'
      );
      return result === 'OK';
    } catch (error) {
      logger.error('Lock acquire error:', { key, error });
      return false;
    }
  }

  /**
   * Освободить блокировку
   */
  static async release(key: string): Promise<void> {
    const lockKey = `lock:${key}`;
    try {
      await (redis as any).del(lockKey);
    } catch (error) {
      logger.error('Lock release error:', { key, error });
    }
  }

  /**
   * Выполнить с блокировкой
   */
  static async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    options: { ttl?: number; retries?: number } = {}
  ): Promise<T | null> {
    const { ttl = 10, retries = 3 } = options;

    for (let i = 0; i < retries; i++) {
      const acquired = await this.acquire(key, ttl);

      if (acquired) {
        try {
          return await fn();
        } finally {
          await this.release(key);
        }
      }

      // Ждем перед повторной попыткой
      await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
    }

    logger.warn('Failed to acquire lock after retries:', { key, retries });
    return null;
  }
}

export default redis;
