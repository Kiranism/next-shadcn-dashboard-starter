/**
 * @file: route.ts
 * @description: Partner API — список команды и добавление участника
 * @project: SaaS Bonus System
 * @created: 2026-06-07
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requirePartnerUser } from '@/lib/with-partner-auth';
import {
  PartnerTeamService,
  type TeamListFilter
} from '@/lib/services/partner-team.service';

const AddSchema = z.object({
  targetUserId: z.string().min(1),
  partnerRole: z.enum(['TRAINER', 'MANAGER']).optional()
});

const FILTERS = new Set<TeamListFilter>([
  'direct',
  'clients',
  'partners',
  'all'
]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const auth = await requirePartnerUser(request, projectId);
  if ('error' in auth) return auth.error;

  const filterParam = (
    request.nextUrl.searchParams.get('filter') ?? 'direct'
  ).toLowerCase() as TeamListFilter;
  const filter = FILTERS.has(filterParam) ? filterParam : 'direct';
  const page = Math.max(
    1,
    parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10)
  );
  const pageSize = Math.min(
    50,
    Math.max(
      1,
      parseInt(request.nextUrl.searchParams.get('pageSize') ?? '20', 10)
    )
  );

  const result = await PartnerTeamService.listTeam({
    projectId,
    viewerUserId: auth.partner.id,
    filter,
    page,
    pageSize
  });

  return NextResponse.json(result);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const auth = await requirePartnerUser(request, projectId);
  if ('error' in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = AddSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const user = await PartnerTeamService.addToTeam({
      projectId,
      managerUserId: auth.partner.id,
      targetUserId: parsed.data.targetUserId,
      partnerRole: parsed.data.partnerRole
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
