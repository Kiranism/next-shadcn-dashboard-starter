/**
 * @file: referral-commission.service.partner-role.test.ts
 * @description: Тесты валидации partner-role при назначении outbound-плана
 * @project: SaaS Bonus System
 */

import { ReferralCommissionService } from '@/lib/services/referral-commission.service';
import { db } from '@/lib/db';

jest.mock('@/lib/db');
jest.mock('@/lib/logger');

describe('ReferralCommissionService.setUserOutboundPlan (b2b partner roles)', () => {
  const mockDb = db as jest.Mocked<typeof db>;
  const projectId = 'project-1';
  const userId = 'user-1';
  const planId = 'plan-1';

  beforeEach(() => {
    jest.clearAllMocks();
    (mockDb as any).referralCommissionPlan = {
      findFirst: jest.fn().mockResolvedValue({ id: planId, projectId })
    };
    mockDb.user.update = jest.fn().mockResolvedValue({
      id: userId,
      outboundReferralPlanId: planId,
      email: 'u@example.com',
      phone: null
    } as any);
  });

  it('throws when enablePartnerRoles=true and user is CLIENT', async () => {
    mockDb.user.findFirst = jest.fn().mockResolvedValue({
      id: userId,
      partnerRole: 'CLIENT',
      project: { enablePartnerRoles: true }
    } as any);

    await expect(
      ReferralCommissionService.setUserOutboundPlan(projectId, userId, planId)
    ).rejects.toThrow('Outbound план можно назначить только партнёру');

    expect(mockDb.user.update).not.toHaveBeenCalled();
  });

  it('updates plan when enablePartnerRoles=true and user is TRAINER', async () => {
    mockDb.user.findFirst = jest.fn().mockResolvedValue({
      id: userId,
      partnerRole: 'TRAINER',
      project: { enablePartnerRoles: true }
    } as any);

    const result = await ReferralCommissionService.setUserOutboundPlan(
      projectId,
      userId,
      planId
    );

    expect(mockDb.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: userId },
        data: { outboundReferralPlanId: planId }
      })
    );
    expect(result.outboundReferralPlanId).toBe(planId);
  });

  it('updates plan when enablePartnerRoles=false and user is CLIENT (legacy behavior)', async () => {
    mockDb.user.findFirst = jest.fn().mockResolvedValue({
      id: userId,
      partnerRole: 'CLIENT',
      project: { enablePartnerRoles: false }
    } as any);

    const result = await ReferralCommissionService.setUserOutboundPlan(
      projectId,
      userId,
      planId
    );

    expect(mockDb.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: userId },
        data: { outboundReferralPlanId: planId }
      })
    );
    expect(result.outboundReferralPlanId).toBe(planId);
  });
});
