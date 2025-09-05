/**
 * @file: src/app/api/projects/[id]/users/[userId]/bonuses/route.ts
 * @description: API для управления бонусами пользователя
 * @project: SaaS Bonus System
 * @dependencies: Next.js API Routes, UserService
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService, BonusService } from '@/lib/services/user.service';
import { db } from '@/lib/db';
import { withApiRateLimit } from '@/lib';

async function postHandler(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const { id: projectId, userId } = params;
    const body = await request.json();

    const { amount, type, description } = body;

    // Валидация
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Сумма должна быть больше 0' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Тип бонуса обязателен' },
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

    // Начисляем бонусы через BonusService
    const bonus = await BonusService.awardBonus({
      userId,
      amount,
      type,
      description: description || 'Ручное начисление через админ-панель'
    });

    // Конвертируем BigInt в строки для JSON serialization
    const serializedBonus = {
      ...bonus,
      id: bonus.id,
      userId: bonus.userId,
      amount: bonus.amount.toString(),
      type: bonus.type,
      description: bonus.description,
      expiresAt: bonus.expiresAt ? bonus.expiresAt.toISOString() : null,
      isUsed: bonus.isUsed,
      createdAt: bonus.createdAt.toISOString(),
      user: bonus.user
        ? {
            ...bonus.user,
            id: bonus.user.id,
            projectId: bonus.user.projectId,
            totalPurchases: bonus.user.totalPurchases
              ? bonus.user.totalPurchases.toString()
              : '0',
            currentLevel: bonus.user.currentLevel,
            registeredAt: bonus.user.registeredAt.toISOString(),
            updatedAt: bonus.user.updatedAt.toISOString(),
            // Другие поля без BigInt
            email: bonus.user.email,
            phone: bonus.user.phone,
            firstName: bonus.user.firstName,
            lastName: bonus.user.lastName,
            birthDate: bonus.user.birthDate
              ? bonus.user.birthDate.toISOString()
              : null,
            telegramId: bonus.user.telegramId
              ? bonus.user.telegramId.toString()
              : null, // BigInt
            telegramUsername: bonus.user.telegramUsername,
            isActive: bonus.user.isActive,
            referredBy: bonus.user.referredBy,
            referralCode: bonus.user.referralCode,
            utmSource: bonus.user.utmSource,
            utmMedium: bonus.user.utmMedium,
            utmCampaign: bonus.user.utmCampaign,
            utmContent: bonus.user.utmContent,
            utmTerm: bonus.user.utmTerm
          }
        : undefined,
      transactions:
        bonus.transactions?.map((t) => ({
          ...t,
          id: t.id,
          userId: t.userId,
          bonusId: t.bonusId,
          amount: t.amount.toString(),
          type: t.type,
          description: t.description,
          metadata: t.metadata,
          createdAt: t.createdAt.toISOString(),
          userLevel: t.userLevel,
          appliedPercent: t.appliedPercent,
          isReferralBonus: t.isReferralBonus,
          referralUserId: t.referralUserId
        })) || []
    };

    return NextResponse.json(serializedBonus, { status: 201 });
  } catch (error) {
    console.error('Ошибка начисления бонусов:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

async function getHandler(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const { id: projectId, userId } = params;

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

    // Получаем баланс пользователя
    const balance = await UserService.getUserBalance(userId);

    // Сериализуем BigInt поля в балансе
    const serializedBalance = {
      ...balance,
      currentBalance: balance.currentBalance.toString(),
      totalEarned: balance.totalEarned.toString(),
      totalSpent: balance.totalSpent.toString(),
      expiringSoon: balance.expiringSoon.toString()
    };

    return NextResponse.json(serializedBalance);
  } catch (error) {
    console.error('Ошибка получения баланса:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export const POST = withApiRateLimit(postHandler);
export const GET = withApiRateLimit(getHandler);
