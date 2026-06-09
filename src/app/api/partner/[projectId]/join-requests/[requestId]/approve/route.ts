/**
 * @file: route.ts
 * @description: Partner API — одобрение заявки на вступление в команду
 * @project: SaaS Bonus System
 * @created: 2026-06-07
 */

import { NextRequest, NextResponse } from 'next/server';

import { requirePartnerUser } from '@/lib/with-partner-auth';
import { PartnerTeamService } from '@/lib/services/partner-team.service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string; requestId: string }> }
) {
  const { projectId, requestId } = await context.params;
  const auth = await requirePartnerUser(request, projectId);
  if ('error' in auth) return auth.error;

  try {
    const result = await PartnerTeamService.approveJoinRequest({
      projectId,
      requestId,
      reviewerUserId: auth.partner.id
    });
    return NextResponse.json({
      request: result.request,
      partnerRole: result.partnerRole
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
