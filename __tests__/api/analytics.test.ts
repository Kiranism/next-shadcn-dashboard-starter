/**
 * @file: analytics.test.ts
 * @description: Тесты для analytics API endpoint
 * @project: SaaS Bonus System
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/projects/[id]/analytics/route';
import { db } from '@/lib/db';
// auth not required in this test scope

// Mock dependencies
jest.mock('@/lib/db');
// no clerk
jest.mock('@/lib/logger');

describe('Analytics API', () => {
  const mockDb = db as jest.Mocked<typeof db>;
  // no auth
  const projectId = 'test-project-id';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authentication not required

    // Setup default mocks for analytics data
    mockDb.project.findUnique = jest.fn().mockResolvedValue({
      id: projectId,
      name: 'Test Project',
      isActive: true
    });

    mockDb.user.count = jest
      .fn()
      .mockResolvedValueOnce(100) // totalUsers
      .mockResolvedValueOnce(80) // activeUsers
      .mockResolvedValueOnce(20) // newUsersLast30Days
      .mockResolvedValueOnce(5); // newUsersLast7Days

    mockDb.bonus.aggregate = jest
      .fn()
      .mockResolvedValueOnce({
        _sum: { amount: 10000 },
        _count: 200
      }) // totalBonuses
      .mockResolvedValueOnce({
        _sum: { amount: 5000 },
        _count: 100
      }) // activeBonuses
      .mockResolvedValueOnce({
        _sum: { amount: 500 },
        _count: 10
      }); // expiringBonuses

    mockDb.transaction.count = jest
      .fn()
      .mockResolvedValueOnce(1000) // totalTransactions
      .mockResolvedValueOnce(300) // transactionsLast30Days
      .mockResolvedValueOnce(50); // transactionsLast7Days

    mockDb.transaction.findMany = jest.fn().mockResolvedValue([
      {
        createdAt: new Date('2025-01-28'),
        type: 'EARN',
        amount: 100
      },
      {
        createdAt: new Date('2025-01-28'),
        type: 'SPEND',
        amount: 50
      }
    ]);

    mockDb.transaction.groupBy = jest.fn().mockResolvedValue([
      { type: 'EARN', _count: 150, _sum: { amount: 7500 } },
      { type: 'SPEND', _count: 50, _sum: { amount: 2500 } }
    ]);

    mockDb.user.findMany = jest.fn().mockResolvedValue([
      {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: null,
        transactions: [
          { type: 'EARN', amount: 100 },
          { type: 'SPEND', amount: 20 }
        ]
      }
    ]);

    mockDb.user.groupBy = jest.fn().mockResolvedValue([
      {
        currentLevel: 'Базовый',
        _count: { id: 50 },
        _avg: { totalPurchases: 1000 }
      },
      {
        currentLevel: 'Серебряный',
        _count: { id: 30 },
        _avg: { totalPurchases: 5000 }
      }
    ]);

    mockDb.bonusLevel.findMany = jest.fn().mockResolvedValue([
      {
        id: 'level-1',
        name: 'Базовый',
        minAmount: 0,
        maxAmount: 10000,
        bonusPercent: 5,
        paymentPercent: 10,
        order: 1
      }
    ]);
  });

  describe('GET /api/projects/[id]/analytics', () => {
    it('should return analytics data successfully', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/analytics`
      );

      const response = await GET(request, { params: { id: projectId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.analytics).toBeDefined();
      expect(data.analytics.overview).toBeDefined();
      expect(data.analytics.overview.totalUsers).toBe(100);
      expect(data.analytics.overview.activeUsers).toBe(80);
      expect(data.analytics.charts).toBeDefined();
      expect(data.analytics.topUsers).toBeDefined();
      expect(data.analytics.userLevels).toBeDefined();
      expect(data.analytics.bonusLevels).toBeDefined();
    });

    it('should handle date range parameters', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/analytics?startDate=2025-01-01&endDate=2025-01-31`
      );

      const response = await GET(request, { params: { id: projectId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockDb.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date)
            })
          })
        })
      );
    });

    it('should return 404 for non-existent project', async () => {
      mockDb.project.findUnique = jest.fn().mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/projects/invalid-id/analytics`
      );

      const response = await GET(request, { params: { id: 'invalid-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Проект не найден');
    });

    it('should handle database errors gracefully', async () => {
      mockDb.user.count = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/analytics`
      );

      const response = await GET(request, { params: { id: projectId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('ошибка');
    });

    it('should calculate daily activity correctly', async () => {
      const transactions = [
        { createdAt: new Date('2025-01-28'), type: 'EARN', amount: 100 },
        { createdAt: new Date('2025-01-28'), type: 'EARN', amount: 50 },
        { createdAt: new Date('2025-01-28'), type: 'SPEND', amount: 30 },
        { createdAt: new Date('2025-01-27'), type: 'EARN', amount: 200 }
      ];

      mockDb.transaction.findMany = jest.fn().mockResolvedValue(transactions);

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/analytics`
      );

      const response = await GET(request, { params: { id: projectId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analytics.charts.dailyActivity).toHaveLength(2);

      const day28 = data.analytics.charts.dailyActivity.find(
        (d) => d.date === '2025-01-28'
      );
      expect(day28.earnedTransactions).toBe(2);
      expect(day28.earnedAmount).toBe(150);
      expect(day28.spentTransactions).toBe(1);
      expect(day28.spentAmount).toBe(30);
    });

    it('should sort top users by transaction count', async () => {
      const users = [
        {
          id: 'user-1',
          firstName: 'User',
          lastName: 'One',
          email: 'user1@example.com',
          phone: null,
          transactions: [
            { type: 'EARN', amount: 100 },
            { type: 'EARN', amount: 50 }
          ]
        },
        {
          id: 'user-2',
          firstName: 'User',
          lastName: 'Two',
          email: 'user2@example.com',
          phone: null,
          transactions: [
            { type: 'EARN', amount: 200 },
            { type: 'EARN', amount: 150 },
            { type: 'SPEND', amount: 50 }
          ]
        }
      ];

      mockDb.user.findMany = jest.fn().mockResolvedValue(users);

      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/analytics`
      );

      const response = await GET(request, { params: { id: projectId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analytics.topUsers[0].id).toBe('user-2');
      expect(data.analytics.topUsers[0].transactionCount).toBe(3);
      expect(data.analytics.topUsers[1].id).toBe('user-1');
      expect(data.analytics.topUsers[1].transactionCount).toBe(2);
    });
  });
});
