/**
 * @file: src/app/api/auth/forgot-password/route.ts
 * @description: Запрос на восстановление пароля (отправка инструкции на email)
 * @project: SaaS Bonus System
 * @dependencies: zod, withAuthRateLimit, db (опционально для проверки существования email)
 * @created: 2025-09-17
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuthRateLimit } from '@/lib';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const schema = z.object({
  email: z.string().email()
});

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);

    // Безопасность: всегда возвращаем 200, не раскрывая наличие аккаунта
    // Но для аудита и возможной интеграции с провайдером почты проверим наличие
    try {
      const account = await db.adminAccount.findUnique({ where: { email } });
      if (account?.isActive) {
        // Здесь можно создать запись токена восстановления и отправить письмо
        // Пока логируем-как-заглушка. Реальная отправка будет реализована в NotificationService.
        logger.info('Запрошено восстановление пароля', {
          email,
          accountId: account.id,
          component: 'auth-forgot-password'
        });
      }
    } catch (e) {
      // Не раскрываем детали наружу
      logger.error('Ошибка обработки forgot-password', {
        email,
        error: e instanceof Error ? e.message : 'Unknown error',
        component: 'auth-forgot-password'
      });
    }

    return NextResponse.json({
      success: true,
      message:
        'Если такой email существует, мы отправили инструкцию по восстановлению'
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Неверные данные', details: err.flatten() },
        { status: 400 }
      );
    }

    const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
    return NextResponse.json(
      { error: 'Внутренняя ошибка', details: errorMessage },
      { status: 500 }
    );
  }
}

export const POST = withAuthRateLimit(handlePOST);

