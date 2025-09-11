/**
 * @file: src/app/api/notifications/route.ts
 * @description: API endpoint для управления глобальными уведомлениями
 * @project: SaaS Bonus System
 * @dependencies: JWT auth, Prisma
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const token = request.cookies.get('sb_auth')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Получаем параметры запроса
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const projectId = searchParams.get('projectId');

    // Строим условие для фильтрации
    const whereCondition: any = {};
    if (projectId) {
      whereCondition.projectId = projectId;
    }

    // Получаем уведомления с пагинацией
    const [notifications, total] = await Promise.all([
      db.notificationLog.findMany({
        where: whereCondition,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              domain: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.notificationLog.count({
        where: whereCondition
      })
    ]);

    // Получаем статистику
    const stats = await db.notificationLog.groupBy({
      by: ['status'],
      where: whereCondition,
      _count: {
        status: true
      }
    });

    const statusStats = {
      sent: 0,
      failed: 0,
      pending: 0
    };

    stats.forEach((stat) => {
      if (stat.status === 'sent') statusStats.sent = stat._count.status;
      else if (stat.status === 'failed')
        statusStats.failed = stat._count.status;
      else if (stat.status === 'pending')
        statusStats.pending = stat._count.status;
    });

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: statusStats
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const token = request.cookies.get('sb_auth')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      message,
      imageUrl,
      buttons,
      parseMode = 'Markdown'
    } = body;

    if (!projectId || !message) {
      return NextResponse.json(
        { error: 'Project ID and message are required' },
        { status: 400 }
      );
    }

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        botSettings: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Отправляем уведомление через существующую систему
    const { sendRichBroadcastMessage } = await import(
      '@/lib/telegram/notifications'
    );

    const result = await sendRichBroadcastMessage(projectId, {
      message,
      imageUrl,
      buttons,
      parseMode
    });

    // Логируем результат
    await db.notificationLog.create({
      data: {
        projectId,
        channel: 'telegram',
        type: 'broadcast',
        message,
        metadata: {
          imageUrl,
          buttons,
          parseMode,
          sentCount: result.sent,
          failedCount: result.failed
        },
        status: result.failed > 0 ? 'partial' : 'sent'
      }
    });

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
