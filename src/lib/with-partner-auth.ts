/**
 * @file: with-partner-auth.ts
 * @description: Аутентификация партнёра для partner API (Telegram / MAX ID)
 * @project: SaaS Bonus System
 * @created: 2026-06-07
 */

import { NextRequest, NextResponse } from 'next/server';

import { resolvePartnerUserFromPlatform } from '@/lib/partner-auth';

export async function requirePartnerUser(
  request: NextRequest,
  projectId: string
) {
  const telegramId =
    request.headers.get('x-telegram-user-id') ??
    request.nextUrl.searchParams.get('telegramId');
  const maxId =
    request.headers.get('x-max-user-id') ??
    request.nextUrl.searchParams.get('maxId');

  if (!telegramId && !maxId) {
    return {
      error: NextResponse.json(
        {
          error: 'Unauthorized — передайте x-telegram-user-id или x-max-user-id'
        },
        { status: 401 }
      )
    } as const;
  }

  const partner = await resolvePartnerUserFromPlatform({
    projectId,
    telegramId,
    maxId
  });

  if (!partner?.isActive) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    } as const;
  }

  return { partner } as const;
}
