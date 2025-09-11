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
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        timezone: true,
        language: true,
        twoFactorEnabled: true,
        sessionTimeout: true,
        emailNotifications: true,
        smsNotifications: true,
        telegramNotifications: true,
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
        firstName: admin.firstName || '',
        lastName: admin.lastName || '',
        email: admin.email,
        phone: admin.phone || '',
        avatar: admin.avatar || ''
      },
      security: {
        enableTwoFactor: admin.twoFactorEnabled,
        sessionTimeout: admin.sessionTimeout || 30,
        changePassword: false
      },
      notifications: {
        enableEmailNotifications: admin.emailNotifications,
        enableSystemNotifications: admin.telegramNotifications,
        enableSecurityAlerts: admin.smsNotifications,
        notificationEmail: admin.email
      },
      preferences: {
        language: admin.language || 'ru',
        timezone: admin.timezone || 'Europe/Moscow',
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

    // Обновляем профиль администратора в БД
    const updatedAdmin = await db.adminAccount.update({
      where: { id: payload.sub },
      data: {
        firstName: settings.personal?.firstName,
        lastName: settings.personal?.lastName,
        phone: settings.personal?.phone,
        avatar: settings.personal?.avatar,
        timezone: settings.preferences?.timezone,
        language: settings.preferences?.language,
        twoFactorEnabled: settings.security?.enableTwoFactor,
        sessionTimeout: settings.security?.sessionTimeout,
        emailNotifications: settings.notifications?.enableEmailNotifications,
        smsNotifications: settings.notifications?.enableSecurityAlerts,
        telegramNotifications: settings.notifications?.enableSystemNotifications
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        timezone: true,
        language: true,
        twoFactorEnabled: true,
        sessionTimeout: true,
        emailNotifications: true,
        smsNotifications: true,
        telegramNotifications: true
      }
    });

    logger.info('Profile settings updated:', {
      adminId: payload.sub,
      settings: {
        personal: {
          firstName: updatedAdmin.firstName,
          lastName: updatedAdmin.lastName,
          phone: updatedAdmin.phone,
          avatar: updatedAdmin.avatar
        },
        preferences: {
          timezone: updatedAdmin.timezone,
          language: updatedAdmin.language
        },
        security: {
          twoFactorEnabled: updatedAdmin.twoFactorEnabled,
          sessionTimeout: updatedAdmin.sessionTimeout
        },
        notifications: {
          email: updatedAdmin.emailNotifications,
          sms: updatedAdmin.smsNotifications,
          telegram: updatedAdmin.telegramNotifications
        }
      }
    });

    return NextResponse.json({
      message: 'Настройки профиля обновлены',
      settings: {
        personal: {
          firstName: updatedAdmin.firstName || '',
          lastName: updatedAdmin.lastName || '',
          email: updatedAdmin.email,
          phone: updatedAdmin.phone || '',
          avatar: updatedAdmin.avatar || ''
        },
        security: {
          enableTwoFactor: updatedAdmin.twoFactorEnabled,
          sessionTimeout: updatedAdmin.sessionTimeout || 30,
          changePassword: false
        },
        notifications: {
          enableEmailNotifications: updatedAdmin.emailNotifications,
          enableSystemNotifications: updatedAdmin.telegramNotifications,
          enableSecurityAlerts: updatedAdmin.smsNotifications,
          notificationEmail: updatedAdmin.email
        },
        preferences: {
          language: updatedAdmin.language || 'ru',
          timezone: updatedAdmin.timezone || 'Europe/Moscow',
          theme: 'system',
          dateFormat: 'DD.MM.YYYY'
        }
      }
    });
  } catch (error) {
    logger.error('Error updating profile settings:', { error: String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
