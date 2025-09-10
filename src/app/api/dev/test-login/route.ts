/**
 * @file: route.ts
 * @description: Dev-эндпоинт: выдает тестовую JWT сессию (HttpOnly cookie)
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, JWT utils
 * @created: 2025-09-09
 */

import { NextRequest, NextResponse } from 'next/server';
import { signJwt } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not allowed in production' },
      { status: 403 }
    );
  }

  // Тестовый админ
  const token = await signJwt({
    sub: 'dev-admin-1',
    email: 'dev@local',
    role: 'SUPERADMIN'
  });

  const res = NextResponse.json({ success: true, token });
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || '';
  const isHttps = appUrl.startsWith('https://');
  res.cookies.set('sb_auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
    maxAge: 24 * 60 * 60
  });
  return res;
}

export const GET = POST;
