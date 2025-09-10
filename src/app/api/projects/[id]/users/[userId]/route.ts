/**
 * @file: route.ts
 * @description: Удаление пользователя проекта
 * @project: SaaS Bonus System
 * @dependencies: Next.js, Prisma
 * @created: 2025-09-10
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  const { id: projectId, userId } = await context.params;

  try {
    const user = await db.user.findFirst({ where: { id: userId, projectId } });
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Каскад: сначала удаляем связанные записи
    await db.transaction.deleteMany({ where: { userId } });
    await db.bonus.deleteMany({ where: { userId } });

    await db.user.delete({ where: { id: userId } });

    logger.info('Пользователь удалён', { projectId, userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Ошибка удаления пользователя', {
      projectId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
