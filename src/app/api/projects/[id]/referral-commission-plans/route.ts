/**
 * @file: src/app/api/projects/[id]/referral-commission-plans/route.ts
 * @description: CRUD списка планов реферальных процентов по уровням
 * @project: SaaS Bonus System
 * @dependencies: ReferralCommissionService, auth
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

const CreatePlanSchema = z.object({
  name: z.string().min(1).max(120),
  maxPayoutDepth: z.number().int().min(1).max(10).optional(),
  levels: z.array(LevelSchema).min(1).max(3)
});

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

  const plans = await ReferralCommissionService.listPlans(projectId);
  return NextResponse.json({
    plans: plans.map((p) => ({
      id: p.id,
      name: p.name,
      maxPayoutDepth: p.maxPayoutDepth,
      createdAt: p.createdAt,
      levels: p.levels.map((l) => ({
        id: l.id,
        level: l.level,
        percent: Number(l.percent),
        isActive: l.isActive
      }))
    }))
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreatePlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const plan = await ReferralCommissionService.createPlan(
      projectId,
      parsed.data.name,
      parsed.data.levels,
      parsed.data.maxPayoutDepth ?? 3
    );
    return NextResponse.json(
      {
        plan: {
          id: plan.id,
          projectId: plan.projectId,
          name: plan.name,
          maxPayoutDepth: plan.maxPayoutDepth,
          createdAt: plan.createdAt,
          levels: plan.levels.map((l) => ({
            id: l.id,
            level: l.level,
            percent: Number(l.percent),
            isActive: l.isActive
          }))
        }
      },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
