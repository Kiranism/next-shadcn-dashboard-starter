/**
 * @file: route.ts
 * @description: Partner API — отклонение заявки на вступление в команду
 * @project: SaaS Bonus System
 * @created: 2026-06-07
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requirePartnerUser } from '@/lib/with-partner-auth';
import { PartnerTeamService } from '@/lib/services/partner-team.service';

const RejectSchema = z.object({
  reason: z.string().max(500).optional()
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string; requestId: string }> }
) {
  const { projectId, requestId } = await context.params;
  const auth = await requirePartnerUser(request, projectId);
  if ('error' in auth) return auth.error;

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await PartnerTeamService.rejectJoinRequest({
      projectId,
      requestId,
      reviewerUserId: auth.partner.id,
      reason: parsed.data.reason
    });
    return NextResponse.json({ request: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
