/**
 * @file: src/app/api/projects/[id]/referral-commission-settings/route.ts
 * @description: Флаг персональных планов и план по умолчанию для атрибуции
 * @project: SaaS Bonus System
 * @created: 2026-05-12
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProjectService } from '@/lib/services/project.service';
import { ReferralCommissionService } from '@/lib/services/referral-commission.service';

const PatchSchema = z.object({
  referralPlansEnabled: z.boolean().optional(),
  defaultReferralCommissionPlanId: z.string().nullable().optional()
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

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      referralPlansEnabled: true,
      defaultReferralCommissionPlanId: true
    }
  });

  const plans = await ReferralCommissionService.listPlans(projectId);

  return NextResponse.json({
    referralPlansEnabled: project?.referralPlansEnabled ?? false,
    defaultReferralCommissionPlanId:
      project?.defaultReferralCommissionPlanId ?? null,
    plans: plans.map((p) => ({
      id: p.id,
      name: p.name,
      maxPayoutDepth: p.maxPayoutDepth,
      levels: p.levels.map((l) => ({
        level: l.level,
        percent: Number(l.percent),
        isActive: l.isActive
      }))
    }))
  });
}

export async function PATCH(
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

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const updated = await ReferralCommissionService.setProjectSettings(
      projectId,
      parsed.data
    );
    return NextResponse.json({ settings: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
