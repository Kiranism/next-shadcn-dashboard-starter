/**
 * @file: src/app/api/projects/[id]/referral-insights/[subjectUserId]/route.ts
 * @description: Реферальная статистика пользователя (блогер); владелец проекта видит всегда
 * @project: SaaS Bonus System
 * @created: 2026-05-12
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';

import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProjectService } from '@/lib/services/project.service';
import { ReferralService } from '@/lib/services/referral.service';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; subjectUserId: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId, subjectUserId } = await context.params;
  try {
    await ProjectService.verifyProjectAccess(projectId, admin.sub);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const subject = await db.user.findFirst({
    where: { id: subjectUserId, projectId }
  });
  if (!subject) {
    return NextResponse.json(
      { error: 'Пользователь не найден' },
      { status: 404 }
    );
  }

  const stats = await ReferralService.getUserReferralStats(
    subjectUserId,
    projectId
  );

  return NextResponse.json({
    subjectUserId,
    ...stats
  });
}
