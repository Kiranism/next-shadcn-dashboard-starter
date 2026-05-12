/**
 * @file: src/app/api/projects/[id]/referral-stats-grants/route.ts
 * @description: Выдача права пользователю смотреть реферальную статистику другого пользователя (иерархия / партнёры)
 * @project: SaaS Bonus System
 * @created: 2026-05-12
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentAdmin } from '@/lib/auth';
import { ProjectService } from '@/lib/services/project.service';
import { ReferralCommissionService } from '@/lib/services/referral-commission.service';

const PostSchema = z.object({
  subjectUserId: z.string().min(1),
  viewerUserId: z.string().min(1)
});

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

  const subjectUserId = request.nextUrl.searchParams.get('subjectUserId');
  if (!subjectUserId) {
    return NextResponse.json(
      { error: 'Query subjectUserId обязателен' },
      { status: 400 }
    );
  }

  const grants = await ReferralCommissionService.listStatsGrants(
    projectId,
    subjectUserId
  );
  return NextResponse.json({ grants });
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

  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const grant = await ReferralCommissionService.createStatsGrant(
      projectId,
      parsed.data.subjectUserId,
      parsed.data.viewerUserId
    );
    return NextResponse.json({ grant }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
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

  const subjectUserId = request.nextUrl.searchParams.get('subjectUserId');
  const viewerUserId = request.nextUrl.searchParams.get('viewerUserId');
  if (!subjectUserId || !viewerUserId) {
    return NextResponse.json(
      { error: 'Query subjectUserId и viewerUserId обязательны' },
      { status: 400 }
    );
  }

  await ReferralCommissionService.removeStatsGrant(
    projectId,
    subjectUserId,
    viewerUserId
  );
  return NextResponse.json({ ok: true });
}
