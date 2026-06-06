/**
 * @file: route.ts
 * @description: Участник организации — обновление и удаление из сети
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withProjectAccess } from '@/lib/with-project-access';
import { PartnerOrganizationService } from '@/lib/services/partner-organization.service';

const UpdateMemberSchema = z.object({
  partnerRole: z.enum(['CLIENT', 'TRAINER', 'MANAGER', 'DIRECTOR']).optional(),
  referredBy: z.string().nullable().optional(),
  outboundReferralPlanId: z.string().nullable().optional()
});

type MemberParams = { id: string; organizationId: string; userId: string };

export const PATCH = withProjectAccess<MemberParams>(
  async (request, { projectId, params }) => {
    const { organizationId, userId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = UpdateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      const user = await PartnerOrganizationService.updateMember(
        projectId,
        organizationId,
        userId,
        parsed.data
      );
      return NextResponse.json({ user });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Server error';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }
);

export const DELETE = withProjectAccess<MemberParams>(
  async (_request, { projectId, params }) => {
    const { organizationId, userId } = await params;
    try {
      await PartnerOrganizationService.removeMember(
        projectId,
        organizationId,
        userId
      );
      return NextResponse.json({ success: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Server error';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }
);
