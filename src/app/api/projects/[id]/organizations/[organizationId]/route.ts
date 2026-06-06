/**
 * @file: route.ts
 * @description: API одной B2B-организации (GET/PATCH/DELETE)
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withProjectAccess } from '@/lib/with-project-access';
import { PartnerOrganizationService } from '@/lib/services/partner-organization.service';
import { PartnerTeamService } from '@/lib/services/partner-team.service';

const UpdateOrgSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(64).optional(),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
  defaultReferralCommissionPlanId: z.string().nullable().optional(),
  directorUserId: z.string().nullable().optional()
});

type OrgRouteParams = { id: string; organizationId: string };

export const GET = withProjectAccess<OrgRouteParams>(
  async (_request, { projectId, params }) => {
    const { organizationId } = await params;
    const organization = await PartnerOrganizationService.getById(
      projectId,
      organizationId
    );
    if (!organization) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const stats = await PartnerOrganizationService.getStats(
      projectId,
      organizationId
    );

    const hierarchyWarnings =
      await PartnerTeamService.validateOrganizationHierarchy(
        projectId,
        organizationId
      );

    return NextResponse.json({ organization, stats, hierarchyWarnings });
  }
);

export const PATCH = withProjectAccess<OrgRouteParams>(
  async (request, { projectId, params }) => {
    const { organizationId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = UpdateOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      const organization = await PartnerOrganizationService.update(
        projectId,
        organizationId,
        parsed.data
      );
      return NextResponse.json({ organization });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Server error';
      const status = msg.includes('не найдена') ? 404 : 400;
      return NextResponse.json({ error: msg }, { status });
    }
  }
);

export const DELETE = withProjectAccess<OrgRouteParams>(
  async (_request, { projectId, params }) => {
    const { organizationId } = await params;
    try {
      await PartnerOrganizationService.delete(projectId, organizationId);
      return NextResponse.json({ success: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Server error';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }
);
