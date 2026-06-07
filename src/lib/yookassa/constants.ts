/**
 * @file: src/lib/yookassa/constants.ts
 * @description: Константы интеграции ЮKassa
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

export const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3/payments';

/** Официальный whitelist IP для webhook (https://yookassa.ru/developers/using-api/webhooks) */
export const YOOKASSA_WEBHOOK_CIDRS = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.154.128/25',
  '77.75.156.11',
  '77.75.156.35',
  '2a02:5180::/32'
] as const;
