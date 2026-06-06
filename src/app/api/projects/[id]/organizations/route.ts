/**
 * @file: route.ts
 * @description: API списка и создания B2B-организаций проекта
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withProjectAccess } from '@/lib/with-project-access';
import { PartnerOrganizationService } from '@/lib/services/partner-organization.service';

const CreateOrgSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(64).optional(),
  description: z.string().max(500).optional(),
  defaultReferralCommissionPlanId: z.string().nullable().optional(),
  directorUserId: z.string().nullable().optional()
});

export const GET = withProjectAccess(async (_request, { projectId }) => {
  const organizations = await PartnerOrganizationService.list(projectId);
  return NextResponse.json({ organizations });
});

export const POST = withProjectAccess(async (request, { projectId }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreateOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const organization = await PartnerOrganizationService.create({
      projectId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      defaultReferralCommissionPlanId:
        parsed.data.defaultReferralCommissionPlanId ?? null,
      directorUserId: parsed.data.directorUserId ?? null
    });
    return NextResponse.json({ organization }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
});
