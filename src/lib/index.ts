/**
 * @file: index.ts
 * @description: Публичные реэкспорты для lib. Важное: адаптивный экспорт rate-limit
 * @project: SaaS Bonus System
 * @dependencies: internal lib modules
 * @created: 2025-08-13
 * @author: AI Assistant + User
 */

// Адаптивный экспорт rate-limit оберток: в prod при наличии REDIS_URL — Redis, иначе — in-memory
// Важно: избегаем динамических импортов ради tree-shaking и статического анализа Next.js

const useRedis =
  !!process.env.REDIS_URL && process.env.NODE_ENV === 'production';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const rateLimitModule = useRedis
  ? require('./with-rate-limit-redis')
  : require('./with-rate-limit');

export const withRateLimit = rateLimitModule.withRateLimit;
export const withWebhookRateLimit =
  rateLimitModule.withWebhookRateLimit ??
  require('./with-rate-limit').withWebhookRateLimit;
export const withProjectRateLimit =
  rateLimitModule.withProjectRateLimit ??
  (() => require('./with-rate-limit').withRateLimit);
export const withAnalyticsRateLimit =
  rateLimitModule.withAnalyticsRateLimit ??
  (() => require('./with-rate-limit').withRateLimit);
export const withApiRateLimit = rateLimitModule.withRateLimit
  ? (handler: any) => rateLimitModule.withRateLimit(handler, {})
  : require('./with-rate-limit').withApiRateLimit;

export * from './logger';
export * from './error-handler';
export * from './db';
export * from './redis';
export * from './validation/schemas';
export * from './validation/middleware';
export * from './telegram/bot-manager';
