/**
 * @file: src/app/api/notifications/system/[id]/route.ts
 * @description: API endpoint для обновления статуса системных уведомлений
 * @project: SaaS Bonus System
 * @dependencies: Prisma, JWT auth
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJwt } from '@/lib/jwt';
import { logger } from '@/lib/logger';
import { NotificationStatus } from '@/types/notification';
import { z } from 'zod';

const updateNotificationStatusSchema = z.object({
  status: z.nativeEnum(NotificationStatus)
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('sb_auth')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = updateNotificationStatusSchema.parse(body);

    // Обновляем статус уведомления в БД
    const updatedNotification = await db.notification.update({
      where: {
        id: id
      },
      data: {
        metadata: {
          ...(((await db.notification.findUnique({ where: { id } }))
            ?.metadata as any) || {}),
          status
        }
      },
      select: {
        id: true,
        title: true,
        metadata: true
      }
    });

    logger.info(`Notification status updated`, {
      notificationId: id,
      adminId: payload.sub,
      newStatus: status,
      title: updatedNotification.title
    });

    return NextResponse.json({
      message: 'Статус уведомления обновлен',
      notificationId: id,
      status: status
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
