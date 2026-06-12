/**
 * @file: route.ts
 * @description: API для списания бонусов у пользователя
 * @project: SaaS Bonus System
 * @dependencies: Next.js API Routes, BonusService
 * @created: 2025-01-23
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService, BonusService } from '@/lib/services/user.service';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { withApiRateLimit } from '@/lib';
import { requireProjectAccess } from '@/lib/with-project-access';

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: projectId, userId } = await params;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;

    const body = await request.json();

    const { amount, description } = body;

    // Валидация
    if (amount === undefined || amount === null || amount <= 0) {
      return NextResponse.json(
        { error: 'Сумма должна быть больше 0' },
        { status: 400 }
      );
    }

    // Проверяем существование пользователя в проекте
    const user = await db.user.findFirst({
      where: {
        id: userId,
        projectId: projectId
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден в данном проекте' },
        { status: 404 }
      );
    }

    // Проверяем баланс пользователя (используем реальный spendable balance из BonusService)
    try {
      // Списываем бонусы через BonusService
      const transactions = await BonusService.spendBonuses(
        userId,
        amount,
        description || 'Ручное списание через админ-панель'
      );

      // Получаем новый баланс для ответа
      const userBalance = await UserService.getUserBalance(userId);

      logger.info('Бонусы успешно списаны', {
        projectId,
        userId,
        amount,
        transactionsCount: transactions.length,
        component: 'bonus-deduction-api'
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Бонусы успешно списаны',
          deducted: {
            amount,
            transactionsCount: transactions.length
          },
          newBalance: userBalance.currentBalance
        },
        { status: 200 }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';

      if (errorMessage.includes('Недостаточно бонусов')) {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }

      throw error; // Бросаем дальше для общего catch
    }
  } catch (error) {
    logger.error('Ошибка списания бонусов', {
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      component: 'bonus-deduction-api'
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export const POST = withApiRateLimit(postHandler);
