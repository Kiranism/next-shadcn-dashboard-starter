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

    // Временно возвращаем моковые данные до создания таблицы notification_logs
    const mockNotifications = [
      {
        id: '1',
        projectId: 'cmfcb42zr0001v8hsk17ou4x9',
        channel: 'telegram',
        type: 'broadcast',
        message: 'Тестовое уведомление',
        status: 'sent',
        createdAt: new Date().toISOString(),
        metadata: { sentCount: 5, failedCount: 0 },
        project: {
          id: 'cmfcb42zr0001v8hsk17ou4x9',
          name: 'Тестовый проект',
          domain: 'example.com'
        }
      }
    ];

    const mockStats = {
      sent: 10,
      failed: 2,
      pending: 0
    };

    return NextResponse.json({
      notifications: mockNotifications,
      pagination: {
        page,
        limit,
        total: mockNotifications.length,
        totalPages: Math.ceil(mockNotifications.length / limit)
      },
      stats: mockStats
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

    // Временно не логируем в БД до создания таблицы
    console.log('Notification sent:', {
      projectId,
      message,
      result
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
