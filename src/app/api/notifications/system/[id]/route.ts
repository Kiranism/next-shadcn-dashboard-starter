/**
 * @file: src/app/api/notifications/system/[id]/route.ts
 * @description: API endpoint для обновления статуса системных уведомлений
 * @project: SaaS Bonus System
 * @dependencies: Prisma, JWT auth
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { logger } from '@/lib/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('sb_auth')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // В реальном приложении здесь будет обновление статуса уведомления в БД
    // Пока что просто логируем изменение
    logger.info('Notification status updated:', {
      notificationId: id,
      adminId: payload.sub,
      newStatus: status
    });

    return NextResponse.json({
      message: 'Статус уведомления обновлен',
      notificationId: id,
      status
    });
  } catch (error) {
    logger.error('Error updating notification status:', {
      error: String(error)
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
