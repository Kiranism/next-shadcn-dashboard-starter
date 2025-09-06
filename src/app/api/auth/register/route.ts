/**
 * @file: src/app/api/auth/register/route.ts
 * @description: Регистрация администратора по email/паролю
 * @project: SaaS Bonus System
 * @dependencies: Prisma, zod, auth utils
 * @created: 2025-09-03
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { signJwt } from '@/lib/jwt';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'MANAGER']).optional()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await db.adminAccount.findUnique({
      where: { email: data.email }
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Пользователь уже существует' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(data.password);
    const created = await db.adminAccount.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role ?? 'ADMIN'
      }
    });

    const token = await signJwt({
      sub: created.id,
      email: created.email,
      role: created.role
    });
    await setSessionCookie(token);

    return NextResponse.json(
      {
        id: created.id,
        email: created.email,
        role: created.role
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('❌ Ошибка регистрации:', err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Неверные данные', details: err.flatten() },
        { status: 400 }
      );
    }

    const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
    // Если известная проблема (например, JWT_SECRET), вернём 500 c явным сообщением
    if (errorMessage.includes('JWT_SECRET')) {
      return NextResponse.json(
        { error: 'JWT секрет не задан на сервере', details: errorMessage },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: 'Внутренняя ошибка', details: errorMessage }, { status: 500 });
  }
}
