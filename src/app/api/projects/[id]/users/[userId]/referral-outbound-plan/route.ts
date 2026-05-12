/**
 * @file: src/app/api/projects/[id]/users/[userId]/referral-outbound-plan/route.ts
 * @description: Назначить пользователю (блогеру) исходящий план реферальных процентов
 * @project: SaaS Bonus System
 * @created: 2026-05-12
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentAdmin } from '@/lib/auth';
import { ProjectService } from '@/lib/services/project.service';
import { ReferralCommissionService } from '@/lib/services/referral-commission.service';

const BodySchema = z.object({
  outboundReferralPlanId: z.string().nullable()
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId, userId } = await context.params;
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

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const user = await ReferralCommissionService.setUserOutboundPlan(
      projectId,
      userId,
      parsed.data.outboundReferralPlanId
    );
    return NextResponse.json({ user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    const status = msg.includes('не найден') ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
