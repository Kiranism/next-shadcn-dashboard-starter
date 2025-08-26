/**
 * @file: route.ts
 * @description: API для списания бонусов пользователя (для интеграции с Tilda)
 * @project: SaaS Bonus System
 * @dependencies: NextRequest, NextResponse, UserService, BonusService
 * @created: 2025-01-23
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService, BonusService } from '@/lib/services/user.service';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/with-rate-limit-redis';
import {
  SpendBonusesSchema,
  validateRequest
} from '@/lib/validation/api-schemas';

// Обернем POST в rate limiter
const rateLimitedPOST = withRateLimit(
  async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: projectId } = await context.params;

      // Валидация входных данных
      const body = await request.json();
      const { email, phone, amount, orderId, description } = body;

      if (!email && !phone) {
        return NextResponse.json(
          { error: 'Требуется email или phone' },
          { status: 400 }
        );
      }

      if (!amount || amount <= 0) {
        return NextResponse.json(
          { error: 'Сумма списания должна быть больше 0' },
          { status: 400 }
        );
      }

      // Находим пользователя
      const user = await UserService.findUserByContact(
        projectId,
        email || undefined,
        phone || undefined
      );

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: 'Пользователь не найден',
            canSpend: false
          },
          { status: 404 }
        );
      }

      // Проверяем баланс пользователя
      const userBalance = await UserService.getUserBalance(user.id);
      const currentBalance = Number(userBalance.currentBalance);

      if (currentBalance < amount) {
        return NextResponse.json(
          {
            success: false,
            error: 'Недостаточно бонусов для списания',
            currentBalance,
            requestedAmount: amount,
            canSpend: false
          },
          { status: 400 }
        );
      }

      // Списываем бонусы
      const transactions = await BonusService.spendBonuses(
        user.id,
        amount,
        description || 'Списание бонусов через Tilda'
      );

      // Получаем обновленный баланс
      const newBalance = await UserService.getUserBalance(user.id);

      logger.info('Bonuses spent successfully', {
        projectId,
        userId: user.id,
        amount,
        orderId,
        oldBalance: currentBalance,
        newBalance: Number(newBalance.currentBalance)
      });

      return NextResponse.json({
        success: true,
        message: 'Бонусы успешно списаны',
        transactions: transactions.map((t) => ({
          id: t.id,
          amount: Number(t.amount),
          description: t.description
        })),
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName
        },
        balance: {
          previous: currentBalance,
          current: Number(newBalance.currentBalance),
          spent: amount
        }
      });
    } catch (error) {
      const { id: projectId } = await context.params;
      logger.error('Error spending bonuses', {
        projectId,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });

      return NextResponse.json(
        {
          error: 'Внутренняя ошибка сервера',
          success: false,
          canSpend: false
        },
        { status: 500 }
      );
    }
  },
  {
    limit: 30, // 30 запросов
    window: 60, // в минуту
    keyGenerator: (req) => {
      // Используем IP + projectId для ключа
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
      const projectId =
        req.url.split('/projects/')[1]?.split('/')[0] || 'unknown';
      return `spend:${projectId}:${ip}`;
    }
  }
);

export { rateLimitedPOST as POST };
