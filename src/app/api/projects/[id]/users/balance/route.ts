/**
 * @file: route.ts
 * @description: API для получения баланса пользователя по email/телефону (для интеграции с Tilda)
 * @project: SaaS Bonus System
 * @dependencies: NextRequest, NextResponse, UserService
 * @created: 2025-01-23
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const phone = url.searchParams.get('phone');

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Требуется email или phone параметр' },
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
          balance: 0,
          user: null
        },
        { status: 404 }
      );
    }

    // Получаем баланс пользователя
    const userBalance = await UserService.getUserBalance(user.id);

    logger.info('User balance retrieved', {
      projectId,
      userId: user.id,
      email: user.email,
      phone: user.phone,
      balance: userBalance.currentBalance
    });

    return NextResponse.json({
      success: true,
      balance: Number(userBalance.currentBalance),
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        currentLevel: user.currentLevel
      },
      balanceDetails: {
        currentBalance: Number(userBalance.currentBalance),
        totalEarned: Number(userBalance.totalEarned),
        totalSpent: Number(userBalance.totalSpent),
        expiringSoon: Number(userBalance.expiringSoon)
      }
    });
  } catch (error) {
    const { id: projectId } = await params;
    logger.error('Error retrieving user balance', {
      projectId,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });

    return NextResponse.json(
      {
        error: 'Внутренняя ошибка сервера',
        success: false,
        balance: 0
      },
      { status: 500 }
    );
  }
}
