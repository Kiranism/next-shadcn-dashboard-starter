/**
 * @file: src/app/api/billing/plan/route.ts
 * @description: API endpoint для смены тарифного плана админом из UI Settings.
 *               Делегирует в BillingService.upsertActiveSubscription —
 *               единая точка входа, которая в одной транзакции отменяет
 *               предыдущие активные подписки и создаёт новую. Также
 *               поддерживает партнёрские unique constraint в БД (см.
 *               миграцию 20260528134634_one_active_subscription_per_admin).
 * @project: SaaS Bonus System
 * @dependencies: Next.js, Prisma, JWT, BillingService
 * @created: 2025-01-28
 * @updated: 2026-05-28 — переписано на upsertActiveSubscription
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { verifyJwt } from '@/lib/jwt';
import { logger } from '@/lib/logger';
import { BillingService } from '@/lib/services/billing.service';
import { formatPlan, toNumber } from '@/lib/services/billing-plan.utils';

const changePlanSchema = z.object({
  planId: z.string().min(1, 'planId is required')
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

    // Поддержка обоих форматов: planId и slug.
    const plan = await db.subscriptionPlan.findFirst({
      where: {
        OR: [{ id: planId }, { slug: planId }]
      }
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: 'Plan not found or inactive' },
        { status: 404 }
      );
    }

    // Проверяем, что не активируем тот же план повторно.
    const current = await BillingService.getActiveSubscription(admin.id);
    if (current && current.planId === plan.id) {
      return NextResponse.json({ error: 'План уже активен' }, { status: 400 });
    }

    // Единая точка входа — отменяет предыдущие, создаёт новую, пишет history.
    const updatedSubscription = await BillingService.upsertActiveSubscription({
      adminId: admin.id,
      planId: plan.id,
      performedBy: admin.id,
      reason: 'self_service_plan_change'
    });

    // Синхронизируем роль админа с уровнем тарифа (legacy, не критично).
    if (admin.role !== 'SUPERADMIN') {
      const nextRole = plan.slug === 'free' ? 'MANAGER' : 'ADMIN';
      if (nextRole !== admin.role) {
        await db.adminAccount.update({
          where: { id: admin.id },
          data: { role: nextRole }
        });
      }
    }

    const action = current
      ? toNumber(plan.price) > toNumber(current.plan?.price ?? 0)
        ? 'upgraded'
        : 'downgraded'
      : 'created';

    logger.info('Plan change completed', {
      adminId: admin.id,
      subscriptionId: updatedSubscription.id,
      planId: plan.id,
      action
    });

    return NextResponse.json({
      success: true,
      message:
        action === 'created'
          ? `Подписка на план «${plan.name}» активирована`
          : `Тарифный план изменен на «${plan.name}»`,
      plan: formatPlan(updatedSubscription.plan, {
        status: updatedSubscription.status,
        startDate: updatedSubscription.startDate,
        endDate: updatedSubscription.endDate,
        nextPaymentDate: updatedSubscription.nextPaymentDate
      })
    });
  } catch (error) {
    logger.error('Error changing plan:', { error: String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
