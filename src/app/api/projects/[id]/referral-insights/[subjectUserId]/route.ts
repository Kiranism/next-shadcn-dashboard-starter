/**
 * @file: src/app/api/projects/[id]/referral-insights/[subjectUserId]/route.ts
 * @description: Реферальная статистика пользователя (блогер); владелец проекта видит всегда. С Phase 3 поддерживает опциональный `viewerUserId` (или header `x-viewer-user-id`) с проверкой `canViewSubject` для b2b-иерархии.
 * @project: SaaS Bonus System
 * @created: 2026-05-12
 * @updated: 2026-05-24
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';

import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ProjectService } from '@/lib/services/project.service';
import { ReferralService } from '@/lib/services/referral.service';
import { cachedCanViewSubject } from '@/lib/services/referral-commission.service';

export async function GET(
  request: NextRequest,
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

  try {
    const subject = await db.user.findFirst({
      where: { id: subjectUserId, projectId }
    });
    if (!subject) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Опциональная проверка viewer'а (b2b-иерархия).
    // Если параметр передан — viewer должен иметь право смотреть subject'а.
    const viewerUserId =
      request.nextUrl.searchParams.get('viewerUserId') ||
      request.headers.get('x-viewer-user-id') ||
      null;

    if (viewerUserId) {
      const allowed = await cachedCanViewSubject(
        projectId,
        viewerUserId,
        subjectUserId
      );
      if (!allowed) {
        return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
      }
    }

    const stats = await ReferralService.getUserReferralStats(
      subjectUserId,
      projectId
    );

    return NextResponse.json({
      subjectUserId,
      ...stats
    });
  } catch (error) {
    logger.error(
      'GET /api/projects/[id]/referral-insights/[subjectUserId] failed',
      {
        error: error instanceof Error ? error.message : String(error),
        projectId,
        subjectUserId,
        component: 'api-referral-insights'
      }
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
