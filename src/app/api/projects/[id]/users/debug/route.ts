/**
 * @file: route.ts
 * @description: Отладочный API для проверки пользователей в проекте
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, Prisma
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireProjectAccess } from '@/lib/with-project-access';

// GET /api/projects/[id]/users/debug - Отладочная информация о пользователях
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;

  const access = await requireProjectAccess(context.params);
  if (access instanceof NextResponse) return access;

  try {
    console.log('🔍 Отладочный запрос для проекта:', projectId);

    // Получаем всех пользователей проекта
    const allUsers = await db.user.findMany({
      where: { projectId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        telegramId: true,
        telegramUsername: true,
        isActive: true,
        registeredAt: true
      }
    });

    console.log('📊 Всего пользователей:', allUsers.length);

    // Получаем пользователей с telegramId
    const telegramUsers = await db.user.findMany({
      where: {
        projectId,
        telegramId: { not: null },
        isActive: true
      },
      select: {
        id: true,
        email: true,
        telegramId: true,
        telegramUsername: true
      }
    });

    console.log('📱 Пользователей с telegramId:', telegramUsers.length);

    // Статистика
    const stats = {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter((u: { isActive: boolean }) => u.isActive)
        .length,
      telegramUsers: telegramUsers.length,
      usersWithTelegramId: allUsers.filter(
        (u: { telegramId: bigint | null }) => u.telegramId !== null
      ).length
    };

    console.log('📈 Статистика:', stats);

    return NextResponse.json({
      success: true,
      stats,
      allUsers,
      telegramUsers
    });
  } catch (error) {
    console.error('❌ Ошибка в debug endpoint:', error);

    logger.error(
      'Error getting debug info',
      {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'debug-api'
    );

    return NextResponse.json(
      {
        error: 'Ошибка получения отладочной информации',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
