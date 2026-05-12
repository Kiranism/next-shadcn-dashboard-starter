/**
 * @file: src/app/api/projects/[id]/referral-commission-plans/seed-from-legacy/route.ts
 * @description: Создать дефолтный план процентов из текущей реферальной программы проекта
 * @project: SaaS Bonus System
 * @created: 2026-05-12
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';

import { getCurrentAdmin } from '@/lib/auth';
import { ProjectService } from '@/lib/services/project.service';
import { ReferralCommissionService } from '@/lib/services/referral-commission.service';

export async function POST(
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

  try {
    const plan =
      await ReferralCommissionService.seedDefaultPlanFromLegacyReferralProgram(
        projectId
      );
    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
