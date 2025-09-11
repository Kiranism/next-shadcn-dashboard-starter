/**
 * @file: src/app/api/profile/settings/route.ts
 * @description: API endpoint для настроек профиля администратора
 * @project: SaaS Bonus System
 * @dependencies: Prisma, JWT auth
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJwt } from '@/lib/jwt';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('sb_auth')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Получаем данные администратора
    const admin = await db.adminAccount.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Формируем настройки профиля
    const settings = {
      personal: {
        firstName: 'Администратор', // В реальном приложении это будет из профиля
        lastName: 'Системы',
        email: admin.email,
        phone: '', // В реальном приложении это будет из профиля
        avatar: ''
      },
      security: {
        enableTwoFactor: false,
        sessionTimeout: 24,
        changePassword: false
      },
      notifications: {
        enableEmailNotifications: true,
        enableSystemNotifications: true,
        enableSecurityAlerts: true,
        notificationEmail: admin.email
      },
      preferences: {
        language: 'ru',
        timezone: 'Europe/Moscow',
        theme: 'system',
        dateFormat: 'DD.MM.YYYY'
      }
    };

    return NextResponse.json({
      settings,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    });
  } catch (error) {
    logger.error('Error fetching profile settings:', { error: String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('sb_auth')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    // В реальном приложении здесь будет обновление профиля в БД
    // Пока что просто логируем изменения
    logger.info('Profile settings updated:', {
      adminId: payload.sub,
      settings
    });

    return NextResponse.json({
      message: 'Настройки профиля обновлены',
      settings
    });
  } catch (error) {
    logger.error('Error updating profile settings:', { error: String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
