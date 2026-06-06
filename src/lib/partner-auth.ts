/**
 * @file: partner-auth.ts
 * @description: Аутентификация партнёра по Telegram/MAX ID для partner API
 * @project: SaaS Bonus System
 * @created: 2026-06-07
 */

import { db } from '@/lib/db';

export async function resolvePartnerUserFromPlatform(params: {
  projectId: string;
  telegramId?: string | null;
  maxId?: string | null;
}) {
  const { projectId, telegramId, maxId } = params;
  if (!telegramId && !maxId) return null;

  if (telegramId) {
    const user = await db.user.findFirst({
      where: { projectId, telegramId: BigInt(telegramId) },
      select: {
        id: true,
        partnerRole: true,
        organizationId: true,
        isActive: true
      }
    });
    if (user) return user;
  }

  if (maxId) {
    return db.user.findFirst({
      where: { projectId, maxId: BigInt(maxId) },
      select: {
        id: true,
        partnerRole: true,
        organizationId: true,
        isActive: true
      }
    });
  }

  return null;
}
