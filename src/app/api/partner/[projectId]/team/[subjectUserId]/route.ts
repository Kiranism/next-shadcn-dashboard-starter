/**
 * @file: route.ts
 * @description: Partner API — удаление участника из команды
 * @project: SaaS Bonus System
 * @created: 2026-06-07
 */

import { NextRequest, NextResponse } from 'next/server';

import { requirePartnerUser } from '@/lib/with-partner-auth';
import { PartnerTeamService } from '@/lib/services/partner-team.service';

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ projectId: string; subjectUserId: string }>;
  }
) {
  const { projectId, subjectUserId } = await context.params;
  const auth = await requirePartnerUser(request, projectId);
  if ('error' in auth) return auth.error;

  try {
    await PartnerTeamService.removeFromTeam({
      projectId,
      managerUserId: auth.partner.id,
      subjectUserId
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
