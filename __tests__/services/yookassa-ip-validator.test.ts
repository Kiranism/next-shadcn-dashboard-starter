/**
 * @file: __tests__/lib/yookassa/ip-validator.test.ts
 * @description: Тесты IP whitelist webhook ЮKassa
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import { isYooKassaWebhookIp, getClientIp } from '@/lib/yookassa/ip-validator';

describe('yookassa ip-validator', () => {
  it('allows official IPv4 from range', () => {
    expect(isYooKassaWebhookIp('185.71.76.10')).toBe(true);
    expect(isYooKassaWebhookIp('77.75.156.11')).toBe(true);
  });

  it('rejects random IP', () => {
    expect(isYooKassaWebhookIp('8.8.8.8')).toBe(false);
  });

  it('getClientIp reads x-forwarded-for', () => {
    const request = new Request('https://example.com/webhook', {
      headers: { 'x-forwarded-for': '185.71.76.10, 10.0.0.1' }
    });
    expect(getClientIp(request)).toBe('185.71.76.10');
  });
});
