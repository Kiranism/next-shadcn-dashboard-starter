/**
 * @file: src/app/api/auth/forgot-password/route.ts
 * @description: API endpoint для восстановления пароля с Zod валидацией и rate limiting
 * @project: SaaS Bonus System
 * @dependencies: Next.js, Zod, rate limiting
 * @created: 2025-09-18
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@/lib/validation/schemas';
import { withAuthRateLimit } from '@/lib';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Безопасность: всегда возвращаем успех, не раскрывая наличие аккаунта
    try {
      const account = await db.adminAccount.findUnique({
        where: { email },
        select: { id: true, isActive: true }
      });

      if (account?.isActive) {
        // Логируем для аудита (без раскрытия деталей)
        logger.info('Запрошено восстановление пароля', {
          email: email.substring(0, 3) + '***',
          accountId: account.id.substring(0, 8) + '...',
          component: 'auth-forgot-password'
        });

        // TODO: Реализовать через NotificationService
        // 1. Создать токен восстановления
        // 2. Отправить email с инструкциями
        // 3. Сохранить токен в БД с expiration
      }
    } catch (e) {
      // Логируем ошибку, но не раскрываем пользователю
      logger.error('Ошибка обработки forgot-password', {
        email: email.substring(0, 3) + '***',
        error: e instanceof Error ? e.message : 'Unknown error',
        component: 'auth-forgot-password'
      });
    }

    // Всегда возвращаем успех для безопасности
    return NextResponse.json({
      success: true,
      message:
        'Если такой email существует, мы отправили инструкции для восстановления пароля'
    });
  } catch (err: unknown) {
    if (err instanceof Error && 'issues' in err) {
      // Ошибки валидации Zod
      logger.warn('Ошибка валидации при восстановлении пароля', {
        error: err.message
      });
      return NextResponse.json(
        { error: 'Неверный формат email' },
        { status: 400 }
      );
    }

    logger.error('Ошибка при восстановлении пароля', { error: err });

    // Безопасный ответ
    return NextResponse.json({
      success: true,
      message:
        'Если такой email существует, мы отправили инструкции для восстановления пароля'
    });
  }
}

export const POST = withAuthRateLimit(handlePOST);
