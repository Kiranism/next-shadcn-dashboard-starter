/**
 * @file: src/app/api/auth/login/route.ts
 * @description: Вход администратора по email/паролю
 * @project: SaaS Bonus System
 * @dependencies: Prisma, zod, auth utils
 * @created: 2025-09-03
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { setSessionCookie, verifyPassword } from '@/lib/auth';
import { signJwt } from '@/lib/jwt';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72)
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const account = await db.adminAccount.findUnique({
      where: { email: data.email }
    });
    if (!account || !account.isActive) {
      return NextResponse.json(
        { error: 'Неверные учетные данные' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(data.password, account.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверные учетные данные' },
        { status: 401 }
      );
    }

    const token = await signJwt({
      sub: account.id,
      email: account.email,
      role: account.role
    });
    await setSessionCookie(token);

    return NextResponse.json({
      id: account.id,
      email: account.email,
      role: account.role
    });
  } catch (err: unknown) {
    console.error('❌ Ошибка логина:', err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Неверные данные', details: err.flatten() },
        { status: 400 }
      );
    }

    const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
    return NextResponse.json({ error: 'Внутренняя ошибка', details: errorMessage }, { status: 500 });
  }
}
