/**
 * @file: src/lib/yookassa/client.ts
 * @description: HTTP-клиент ЮKassa API v3
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import { YOOKASSA_API_URL } from '@/lib/yookassa/constants';

export function getYooKassaAuthHeader(): string | null {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) return null;
  const token = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
  return `Basic ${token}`;
}

export type YooKassaPaymentPayload = {
  amount: { value: string; currency: string };
  capture: boolean;
  description: string;
  confirmation?: {
    type: 'redirect';
    return_url: string;
  };
  payment_method_id?: string;
  save_payment_method?: boolean;
  metadata?: Record<string, string>;
};

export async function createYooKassaPayment(
  payload: YooKassaPaymentPayload,
  idempotenceKey: string
): Promise<
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: number; body: string }
> {
  const authHeader = getYooKassaAuthHeader();
  if (!authHeader) {
    return { ok: false, status: 500, body: 'YooKassa credentials missing' };
  }

  const response = await fetch(YOOKASSA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
      'Idempotence-Key': idempotenceKey
    },
    body: JSON.stringify(payload)
  });

  const body = await response.text();
  if (!response.ok) {
    return { ok: false, status: response.status, body };
  }

  return { ok: true, data: JSON.parse(body) as Record<string, unknown> };
}
