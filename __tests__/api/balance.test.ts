/**
 * @file: balance.test.ts
 * @description: Тесты для API получения баланса и авто-регистрации пользователей
 * @project: SaaS Bonus System
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/projects/[id]/users/balance/route';
import { UserService } from '@/lib/services/user.service';
import { ProjectService } from '@/lib/services/project.service';

jest.mock('@/lib/services/user.service');
jest.mock('@/lib/services/project.service');
jest.mock('@/lib/logger');

// Mock db
jest.mock('@/lib/db', () => ({
  db: {
    project: {
      findUnique: jest.fn().mockResolvedValue({
        welcomeRewardType: 'DISCOUNT',
        firstPurchaseDiscountPercent: 10
      })
    }
  }
}));

// Mock dynamic import for BonusLevelService
jest.mock('@/lib/services/bonus-level.service', () => ({
  BonusLevelService: {
    calculateUserLevel: jest.fn().mockResolvedValue({
      name: 'Базовый',
      bonusPercent: 5,
      paymentPercent: 50,
      minAmount: 0,
      maxAmount: null
    })
  }
}));

describe('Project Balance API', () => {
  const projectId = 'test-project-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns balance successfully for existing user', async () => {
    (ProjectService.getProjectById as jest.Mock).mockResolvedValue({
      id: projectId,
      domain: 'test.com',
      operationMode: 'WITH_BOT'
    });

    (UserService.findUserByContact as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      phone: '+79001234567',
      totalPurchases: 0,
      currentLevel: 'Базовый',
      telegramId: null
    });

    (UserService.getUserBalance as jest.Mock).mockResolvedValue({
      currentBalance: 100,
      totalEarned: 100,
      totalSpent: 0,
      expiringSoon: 0
    });

    const req = new NextRequest(
      `http://test.com/api/projects/${projectId}/users/balance?email=test@example.com`,
      {
        method: 'GET',
        headers: { origin: 'http://test.com' }
      }
    );

    const res = await GET(req, { params: Promise.resolve({ id: projectId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.balance).toBe(100);
    expect(data.user.email).toBe('test@example.com');
  });

  it('returns 404 for non-existing user if operationMode is WITH_BOT', async () => {
    (ProjectService.getProjectById as jest.Mock).mockResolvedValue({
      id: projectId,
      domain: 'test.com',
      operationMode: 'WITH_BOT'
    });

    (UserService.findUserByContact as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest(
      `http://test.com/api/projects/${projectId}/users/balance?email=new@example.com`,
      {
        method: 'GET',
        headers: { origin: 'http://test.com' }
      }
    );

    const res = await GET(req, { params: Promise.resolve({ id: projectId }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('registers user automatically and returns balance if operationMode is WITHOUT_BOT', async () => {
    (ProjectService.getProjectById as jest.Mock).mockResolvedValue({
      id: projectId,
      domain: 'test.com',
      operationMode: 'WITHOUT_BOT'
    });

    (UserService.findUserByContact as jest.Mock).mockResolvedValue(null);

    const createdUser = {
      id: 'new-user-id',
      email: 'new@example.com',
      phone: undefined,
      totalPurchases: 0,
      currentLevel: 'Базовый',
      telegramId: null
    };

    (UserService.createUser as jest.Mock).mockResolvedValue(createdUser);

    (UserService.getUserBalance as jest.Mock).mockResolvedValue({
      currentBalance: 0,
      totalEarned: 0,
      totalSpent: 0,
      expiringSoon: 0
    });

    const req = new NextRequest(
      `http://test.com/api/projects/${projectId}/users/balance?email=new@example.com&firstName=Alex&utm_source=ref123`,
      {
        method: 'GET',
        headers: { origin: 'http://test.com' }
      }
    );

    const res = await GET(req, { params: Promise.resolve({ id: projectId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.balance).toBe(0);
    expect(data.user.id).toBe('new-user-id');
    expect(UserService.createUser).toHaveBeenCalledWith({
      projectId,
      email: 'new@example.com',
      phone: undefined,
      firstName: 'Alex',
      lastName: undefined,
      utmSource: 'ref123',
      utmMedium: undefined,
      utmCampaign: undefined,
      utmContent: undefined,
      utmTerm: undefined
    });
  });
});
