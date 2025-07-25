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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: projectId, userId } = await params;
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

    return NextResponse.json(bonus, { status: 201 });

  } catch (error) {
    console.error('Ошибка начисления бонусов:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: projectId, userId } = await params;

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

    return NextResponse.json(balance);

  } catch (error) {
    console.error('Ошибка получения баланса:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 