/**
 * @file: src/app/api/projects/[id]/referral-commission-plans/[planId]/bulk-assign/route.ts
 * @description: POST — назначить outbound-план всем пользователям проекта
 *               с указанной партнёрской ролью (по умолчанию TRAINER).
 *               Используется кнопкой «Назначить всем тренерам» в админ-панели
 *               (b2b-referral-hierarchy Phase 6.4).
 * @project: SaaS Bonus System
 * @dependencies: ReferralCommissionService.setUserOutboundPlan, Prisma
 * @created: 2026-05-24
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ProjectService } from '@/lib/services/project.service';

const VALID_ROLES = ['TRAINER', 'MANAGER', 'DIRECTOR'] as const;

const BodySchema = z.object({
  role: z.enum(VALID_ROLES).default('TRAINER'),
  /**
   * Если true — план назначается ТОЛЬКО тем, у кого ещё нет outbound-плана.
   * По умолчанию false: перезаписываем у всех.
   */
  onlyEmpty: z.boolean().optional().default(false)
});

/**
 * GET — превью числа пользователей роли (нужен диалогу подтверждения,
 * чтобы показать «...всем 12 тренерам?»). Не модифицирует данные.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; planId: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = await context.params;
  try {
    await ProjectService.verifyProjectAccess(projectId, admin.sub);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const role = (url.searchParams.get('role') || 'TRAINER').toUpperCase();
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return NextResponse.json(
      { error: 'Invalid role parameter' },
      { status: 400 }
    );
  }

  const total = await db.user.count({
    where: { projectId, partnerRole: role as (typeof VALID_ROLES)[number] }
  });
  const empty = await db.user.count({
    where: {
      projectId,
      partnerRole: role as (typeof VALID_ROLES)[number],
      outboundReferralPlanId: null
    }
  });

  return NextResponse.json({ role, total, empty });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; planId: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId, planId } = await context.params;
  try {
    await ProjectService.verifyProjectAccess(projectId, admin.sub);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // План должен принадлежать проекту.
  const plan = await db.referralCommissionPlan.findFirst({
    where: { id: planId, projectId },
    select: { id: true, name: true }
  });
  if (!plan) {
    return NextResponse.json(
      { error: 'План не найден в проекте' },
      { status: 404 }
    );
  }

  const where = {
    projectId,
    partnerRole: parsed.data.role,
    ...(parsed.data.onlyEmpty ? { outboundReferralPlanId: null } : {})
  } as const;

  // updateMany — атомарно и быстро для больших проектов.
  // Проверка ролей не нужна: фильтруем по роли != CLIENT в where.
  let updated = 0;
  try {
    const result = await db.user.updateMany({
      where,
      data: { outboundReferralPlanId: planId }
    });
    updated = result.count;
  } catch (error) {
    logger.error('bulk-assign outbound plan failed', {
      projectId,
      planId,
      role: parsed.data.role,
      error: error instanceof Error ? error.message : String(error),
      component: 'referral-commission-bulk-assign'
    });
    return NextResponse.json(
      { error: 'Не удалось выполнить массовое назначение' },
      { status: 500 }
    );
  }

  logger.info('bulk-assign outbound plan ok', {
    projectId,
    planId,
    planName: plan.name,
    role: parsed.data.role,
    onlyEmpty: parsed.data.onlyEmpty,
    updated,
    adminId: admin.sub,
    component: 'referral-commission-bulk-assign'
  });

  return NextResponse.json({
    ok: true,
    planId,
    planName: plan.name,
    role: parsed.data.role,
    updated
  });
}
