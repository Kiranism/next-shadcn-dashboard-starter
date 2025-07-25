/**
 * @file: src/app/api/projects/[id]/users/route.ts
 * @description: API для управления пользователями проекта
 * @project: SaaS Bonus System
 * @dependencies: Next.js API Routes, Prisma
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404 }
      );
    }

    // Получаем пользователей с агрегированными данными о бонусах
    const users = await db.user.findMany({
      where: {
        projectId: id
      },
      include: {
        bonuses: {
          select: {
            amount: true,
            isUsed: true,
            expiresAt: true
          }
        },
        transactions: {
          select: {
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        registeredAt: 'desc'
      }
    });

    // Обрабатываем данные для добавления агрегированной информации
    const usersWithBonuses = users.map((user: any) => {
      const totalBonuses = user.bonuses.reduce((sum: number, bonus: any) => sum + bonus.amount, 0);
      const activeBonuses = user.bonuses
        .filter((bonus: any) => 
          !bonus.isUsed && 
          (!bonus.expiresAt || bonus.expiresAt > new Date())
        )
        .reduce((sum: number, bonus: any) => sum + bonus.amount, 0);
      
      const lastActivity = user.transactions.length > 0 ? user.transactions[0].createdAt : null;

      return {
        id: user.id,
        projectId: user.projectId,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
        telegramId: user.telegramId,
        telegramUsername: user.telegramUsername,
        isActive: user.isActive,
        registeredAt: user.registeredAt,
        updatedAt: user.updatedAt,
        totalBonuses,
        activeBonuses,
        lastActivity
      };
    });

    return NextResponse.json(usersWithBonuses);

  } catch (error) {
    console.error('Ошибка получения пользователей проекта:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { email, phone, firstName, lastName, birthDate } = body;

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404 }
      );
    }

    // Валидация - нужен хотя бы один контакт
    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Необходимо указать email или телефон' },
        { status: 400 }
      );
    }

    // Проверяем существование пользователя с таким email/phone в проекте
    const existingUser = await db.user.findFirst({
      where: {
        projectId: id,
        OR: [
          email ? { email } : {},
          phone ? { phone } : {}
        ].filter(obj => Object.keys(obj).length > 0)
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email или телефоном уже существует' },
        { status: 409 }
      );
    }

    // Создаем пользователя
    const user = await db.user.create({
      data: {
        projectId: id,
        email,
        phone,
        firstName,
        lastName,
        birthDate: birthDate ? new Date(birthDate) : null,
        isActive: true
      }
    });

    // Возвращаем пользователя с начальными значениями бонусов
    const userWithBonuses = {
      ...user,
      totalBonuses: 0,
      activeBonuses: 0,
      lastActivity: null
    };

    return NextResponse.json(userWithBonuses, { status: 201 });

  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 