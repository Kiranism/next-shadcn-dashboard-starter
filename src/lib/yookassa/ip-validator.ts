/**
 * @file: src/lib/yookassa/ip-validator.ts
 * @description: Проверка IP-адреса отправителя webhook ЮKassa
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import { isIP } from 'net';
import { YOOKASSA_WEBHOOK_CIDRS } from '@/lib/yookassa/constants';

function ipv4ToInt(ip: string): number {
  return (
    ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0
  );
}

function ipv4InCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes('/')) {
    return ip === cidr;
  }

  const [network, bitsStr] = cidr.split('/');
  const bits = Number(bitsStr);
  if (!Number.isFinite(bits) || bits < 0 || bits > 32) {
    return false;
  }

  const ipNum = ipv4ToInt(ip);
  const networkNum = ipv4ToInt(network);
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipNum & mask) === (networkNum & mask);
}

/** Упрощённая проверка IPv6 /32 (достаточно для 2a02:5180::/32). */
function ipv6InCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes('/')) {
    return ip.toLowerCase() === cidr.toLowerCase();
  }

  const [network, bitsStr] = cidr.split('/');
  const bits = Number(bitsStr);
  if (bits !== 32 || !network.endsWith('::')) {
    return false;
  }

  const prefix = network.slice(0, -2).toLowerCase();
  return ip.toLowerCase().startsWith(prefix);
}

export function isYooKassaWebhookIp(ip: string): boolean {
  const normalized = ip.replace(/^\[|\]$/g, '').trim();
  const version = isIP(normalized);
  if (version === 0) {
    return false;
  }

  for (const cidr of YOOKASSA_WEBHOOK_CIDRS) {
    if (version === 4 && !cidr.includes(':')) {
      if (ipv4InCidr(normalized, cidr)) {
        return true;
      }
    }
    if (version === 6 && cidr.includes(':')) {
      if (ipv6InCidr(normalized, cidr)) {
        return true;
      }
    }
  }

  return false;
}

/** IP клиента с учётом reverse-proxy (Vercel, Nginx). */
export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return null;
}

export function assertYooKassaWebhookIp(
  request: Request,
  options?: { skipInDev?: boolean }
): { ok: true } | { ok: false; ip: string | null } {
  if (options?.skipInDev !== false && process.env.NODE_ENV !== 'production') {
    if (process.env.YOOKASSA_WEBHOOK_SKIP_IP_CHECK === 'true') {
      return { ok: true };
    }
  }

  const ip = getClientIp(request);
  if (!ip || !isYooKassaWebhookIp(ip)) {
    return { ok: false, ip: ip ?? null };
  }

  return { ok: true };
}
