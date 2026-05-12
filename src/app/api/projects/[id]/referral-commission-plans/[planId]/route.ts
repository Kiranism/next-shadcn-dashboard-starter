/**
 * @file: src/app/api/projects/[id]/referral-commission-plans/[planId]/route.ts
 * @description: Обновление и удаление плана реферальных процентов
 * @project: SaaS Bonus System
 * @created: 2026-05-12
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentAdmin } from '@/lib/auth';
import { ProjectService } from '@/lib/services/project.service';
import { ReferralCommissionService } from '@/lib/services/referral-commission.service';

const LevelSchema = z.object({
  level: z.number().int().min(1).max(3),
  percent: z.number().min(0).max(100),
  isActive: z.boolean().optional()
});

const PatchPlanSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  maxPayoutDepth: z.number().int().min(1).max(10).optional(),
  levels: z.array(LevelSchema).min(1).max(3).optional()
});

export async function PATCH(
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
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = PatchPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const plan = await ReferralCommissionService.updatePlan(
      projectId,
      planId,
      parsed.data
    );
    return NextResponse.json({
      plan: {
        id: plan.id,
        name: plan.name,
        maxPayoutDepth: plan.maxPayoutDepth,
        levels: plan.levels.map((l) => ({
          id: l.id,
          level: l.level,
          percent: Number(l.percent),
          isActive: l.isActive
        }))
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    const status = msg.includes('не найден') ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
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

  try {
    await ReferralCommissionService.deletePlan(projectId, planId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    const status =
      msg.includes('Нельзя') || msg.includes('назначен') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
