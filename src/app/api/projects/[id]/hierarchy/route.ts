/**
 * @file: src/app/api/projects/[id]/hierarchy/route.ts
 * @description: GET — дерево партнёрской иерархии в виде плоского массива
 *               узлов с агрегатами (size/commission/period).
 *               (b2b-referral-hierarchy Phase 6.12)
 *
 *               Принимает `?period=today|7d|30d|all` (по умолчанию `30d`).
 *               Используется страницей `/dashboard/projects/[id]/referral/hierarchy`
 *               и потенциально внешними интеграциями владельца проекта.
 *
 * @project: SaaS Bonus System
 * @dependencies: getHierarchyTree (data-access)
 * @created: 2026-05-24
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';

import { getCurrentAdmin } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ProjectService } from '@/lib/services/project.service';
import {
  getHierarchyTree,
  type HierarchyPeriod
} from '@/app/dashboard/projects/[id]/referral/hierarchy/data-access';

const VALID_PERIODS: HierarchyPeriod[] = ['today', '7d', '30d', 'all'];

export async function GET(
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

  const url = new URL(request.url);
  const periodParam = (url.searchParams.get('period') ||
    '30d') as HierarchyPeriod;
  const period: HierarchyPeriod = VALID_PERIODS.includes(periodParam)
    ? periodParam
    : '30d';
  const search = url.searchParams.get('search') || undefined;

  try {
    const data = await getHierarchyTree(projectId, { period, search });
    return NextResponse.json({
      ok: true,
      period,
      ...data
    });
  } catch (error) {
    logger.error('GET /api/projects/[id]/hierarchy failed', {
      projectId,
      error: error instanceof Error ? error.message : String(error),
      component: 'hierarchy-api'
    });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
