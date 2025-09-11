/**
 * @file: src/app/api/billing/plan/route.ts
 * @description: API endpoint для смены тарифного плана
 * @project: SaaS Bonus System
 * @dependencies: Next.js, Prisma, JWT
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJwt } from '@/lib/jwt';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const changePlanSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required')
});

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

    const admin = await db.adminAccount.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const body = await request.json();
    const { planId } = changePlanSchema.parse(body);

    // Определяем новый план на основе planId
    let newPlan;
    switch (planId) {
      case 'starter':
        newPlan = {
          id: 'starter',
          name: 'Стартовый',
          price: 0,
          currency: 'RUB',
          interval: 'month' as const,
          features: [
            'До 1 проекта',
            'До 100 пользователей',
            '1 Telegram бот',
            'Базовые уведомления',
            'Email поддержка'
          ],
          limits: {
            projects: 1,
            users: 100,
            bots: 1,
            notifications: 100
          }
        };
        break;
      case 'professional':
        newPlan = {
          id: 'professional',
          name: 'Профессиональный',
          price: 2990,
          currency: 'RUB',
          interval: 'month' as const,
          features: [
            'До 5 проектов',
            'До 1000 пользователей',
            '5 Telegram ботов',
            'Расширенные уведомления',
            'Приоритетная поддержка',
            'Аналитика и отчеты'
          ],
          limits: {
            projects: 5,
            users: 1000,
            bots: 5,
            notifications: 1000
          },
          popular: true
        };
        break;
      case 'enterprise':
        newPlan = {
          id: 'enterprise',
          name: 'Корпоративный',
          price: 9990,
          currency: 'RUB',
          interval: 'month' as const,
          features: [
            'Неограниченные проекты',
            'Неограниченные пользователи',
            'Неограниченные боты',
            'Все уведомления',
            'Персональный менеджер',
            'API доступ',
            'Кастомные интеграции'
          ],
          limits: {
            projects: -1,
            users: -1,
            bots: -1,
            notifications: -1
          }
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // В реальном приложении здесь была бы интеграция с платежной системой
    // Пока что просто логируем смену плана
    logger.info('Plan change requested', {
      adminId: admin.id,
      adminEmail: admin.email,
      oldRole: admin.role,
      newPlanId: planId,
      newPlanName: newPlan.name
    });

    // Обновляем роль администратора в зависимости от плана
    let newRole = admin.role;
    if (planId === 'professional' || planId === 'enterprise') {
      newRole = 'ADMIN';
    } else if (planId === 'starter') {
      newRole = 'MANAGER';
    }

    await db.adminAccount.update({
      where: { id: admin.id },
      data: { role: newRole }
    });

    return NextResponse.json({
      success: true,
      message: `Тарифный план успешно изменен на "${newPlan.name}"`,
      plan: newPlan,
      newRole
    });
  } catch (error) {
    logger.error('Error changing plan:', { error: String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
