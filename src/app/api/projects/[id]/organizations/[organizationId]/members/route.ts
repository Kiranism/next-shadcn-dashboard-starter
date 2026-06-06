/**
 * @file: route.ts
 * @description: Участники B2B-организации — список и добавление
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withProjectAccess } from '@/lib/with-project-access';
import { PartnerOrganizationService } from '@/lib/services/partner-organization.service';

const AddMemberSchema = z.object({
  userId: z.string().min(1),
  partnerRole: z.enum(['CLIENT', 'TRAINER', 'MANAGER', 'DIRECTOR']).optional(),
  referredBy: z.string().nullable().optional(),
  outboundReferralPlanId: z.string().nullable().optional()
});

type OrgParams = { id: string; organizationId: string };

export const GET = withProjectAccess<OrgParams>(
  async (_request, { projectId, params }) => {
    const { organizationId } = await params;
    try {
      const members = await PartnerOrganizationService.listMembers(
        projectId,
        organizationId
      );
      return NextResponse.json({ members });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Server error';
      const status = msg.includes('не найдена') ? 404 : 400;
      return NextResponse.json({ error: msg }, { status });
    }
  }
);

export const POST = withProjectAccess<OrgParams>(
  async (request, { projectId, params }) => {
    const { organizationId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = AddMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      const user = await PartnerOrganizationService.addMember(
        projectId,
        organizationId,
        parsed.data
      );
      return NextResponse.json({ user }, { status: 201 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Server error';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }
);
