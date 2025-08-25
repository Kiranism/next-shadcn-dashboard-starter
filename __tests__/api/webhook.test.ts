/**
 * @file: webhook.test.ts
 * @description: Тесты для webhook API endpoints
 * @project: SaaS Bonus System
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/webhook/[webhookSecret]/route';
import { db } from '@/lib/db';

// Mock the database
jest.mock('@/lib/db');

// Mock services
jest.mock('@/lib/services/project.service');
jest.mock('@/lib/services/user.service');
jest.mock('@/lib/logger');

describe('Webhook API', () => {
  const mockDb = db as jest.Mocked<typeof db>;
  const webhookSecret = 'test-webhook-secret';
  const projectId = 'test-project-id';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockDb.project.findUnique = jest.fn().mockResolvedValue({
      id: projectId,
      name: 'Test Project',
      webhookSecret,
      isActive: true,
      bonusPercentage: 5,
      bonusExpiryDays: 365,
    });
  });

  describe('POST /api/webhook/[webhookSecret]', () => {
    it('should handle register_user action successfully', async () => {
      const requestBody = {
        action: 'register_user',
        payload: {
          email: 'test@example.com',
          phone: '+79001234567',
          firstName: 'Test',
          lastName: 'User',
        },
      };

      mockDb.user.findFirst = jest.fn().mockResolvedValue(null);
      mockDb.user.create = jest.fn().mockResolvedValue({
        id: 'new-user-id',
        email: 'test@example.com',
        phone: '+79001234567',
        firstName: 'Test',
        lastName: 'User',
        projectId,
      });

      const request = new NextRequest('http://localhost:3000/api/webhook/test-webhook-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, { params: { webhookSecret } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(mockDb.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
            phone: '+79001234567',
          }),
        })
      );
    });

    it('should handle purchase action successfully', async () => {
      const requestBody = {
        action: 'purchase',
        payload: {
          email: 'test@example.com',
          amount: 1000,
          orderId: 'ORDER-123',
          description: 'Test purchase',
        },
      };

      mockDb.user.findFirst = jest.fn().mockResolvedValue({
        id: 'existing-user-id',
        email: 'test@example.com',
        projectId,
        totalPurchases: 0,
        currentLevel: 'Базовый',
      });

      mockDb.bonus.create = jest.fn().mockResolvedValue({
        id: 'bonus-id',
        userId: 'existing-user-id',
        amount: 50,
        type: 'PURCHASE',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      mockDb.transaction.create = jest.fn().mockResolvedValue({
        id: 'transaction-id',
        userId: 'existing-user-id',
        amount: 50,
        type: 'EARN',
      });

      const request = new NextRequest('http://localhost:3000/api/webhook/test-webhook-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, { params: { webhookSecret } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.bonus).toBeDefined();
      expect(mockDb.bonus.create).toHaveBeenCalled();
      expect(mockDb.transaction.create).toHaveBeenCalled();
    });

    it('should handle spend_bonuses action successfully', async () => {
      const requestBody = {
        action: 'spend_bonuses',
        payload: {
          email: 'test@example.com',
          amount: 100,
          orderId: 'SPEND-123',
        },
      };

      mockDb.user.findFirst = jest.fn().mockResolvedValue({
        id: 'existing-user-id',
        email: 'test@example.com',
        projectId,
      });

      mockDb.bonus.findMany = jest.fn().mockResolvedValue([
        {
          id: 'bonus-1',
          userId: 'existing-user-id',
          amount: 150,
          isUsed: false,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ]);

      mockDb.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(mockDb);
      });

      const request = new NextRequest('http://localhost:3000/api/webhook/test-webhook-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, { params: { webhookSecret } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.spent).toBe(100);
      expect(mockDb.$transaction).toHaveBeenCalled();
    });

    it('should handle Tilda webhook format', async () => {
      const tildaPayload = [
        {
          name: 'Test User',
          email: 'tilda@example.com',
          phone: '+79001234567',
          payment: {
            amount: '5000',
            orderid: 'TILDA-123',
            products: [
              { name: 'Product 1', price: 3000 },
              { name: 'Product 2', price: 2000 },
            ],
          },
        },
      ];

      mockDb.user.findFirst = jest.fn().mockResolvedValue(null);
      mockDb.user.create = jest.fn().mockResolvedValue({
        id: 'new-user-id',
        email: 'tilda@example.com',
        projectId,
      });

      mockDb.bonus.create = jest.fn().mockResolvedValue({
        id: 'bonus-id',
        amount: 250,
        type: 'PURCHASE',
      });

      const request = new NextRequest('http://localhost:3000/api/webhook/test-webhook-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tildaPayload),
      });

      const response = await POST(request, { params: { webhookSecret } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.order).toBeDefined();
      expect(data.order.amount).toBe(5000);
    });

    it('should return 401 for invalid webhook secret', async () => {
      mockDb.project.findUnique = jest.fn().mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/webhook/invalid-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'register_user', payload: {} }),
      });

      const response = await POST(request, { params: { webhookSecret: 'invalid-secret' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Неверный webhook secret');
    });

    it('should return 403 for inactive project', async () => {
      mockDb.project.findUnique = jest.fn().mockResolvedValue({
        id: projectId,
        webhookSecret,
        isActive: false,
      });

      const request = new NextRequest('http://localhost:3000/api/webhook/test-webhook-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'register_user', payload: {} }),
      });

      const response = await POST(request, { params: { webhookSecret } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Проект деактивирован');
    });

    it('should validate request payload', async () => {
      const invalidPayload = {
        action: 'purchase',
        payload: {
          // Missing required fields
          email: 'test@example.com',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhook/test-webhook-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPayload),
      });

      const response = await POST(request, { params: { webhookSecret } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Validation failed');
    });
  });
});