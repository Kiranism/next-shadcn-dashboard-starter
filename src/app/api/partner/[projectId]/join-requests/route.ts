/**
 * @file: route.ts
 * @description: Partner API — список ожидающих заявок на вступление
 * @project: SaaS Bonus System
 * @created: 2026-06-07
 */

import { NextRequest, NextResponse } from 'next/server';

import { requirePartnerUser } from '@/lib/with-partner-auth';
import { PartnerTeamService } from '@/lib/services/partner-team.service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const auth = await requirePartnerUser(request, projectId);
  if ('error' in auth) return auth.error;

  const requests = await PartnerTeamService.listPendingRequestsForReviewer(
    projectId,
    auth.partner.id
  );

  return NextResponse.json({ requests });
}
