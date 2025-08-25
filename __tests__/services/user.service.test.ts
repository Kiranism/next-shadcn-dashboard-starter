/**
 * @file: user.service.test.ts
 * @description: Тесты для UserService и BonusService
 * @project: SaaS Bonus System
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import { UserService, BonusService } from '@/lib/services/user.service';
import { db } from '@/lib/db';
import { BonusType, TransactionType } from '@prisma/client';

jest.mock('@/lib/db');
jest.mock('@/lib/logger');
jest.mock('@/lib/telegram/notifications');

describe('UserService', () => {
  const mockDb = db as jest.Mocked<typeof db>;
  const projectId = 'test-project-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        projectId,
        email: 'test@example.com',
        phone: '+79001234567',
        firstName: 'Test',
        lastName: 'User',
      };

      const expectedUser = {
        id: 'new-user-id',
        ...userData,
        totalPurchases: 0,
        currentLevel: 'Базовый',
        project: { id: projectId },
        bonuses: [],
        transactions: [],
      };

      mockDb.user.create = jest.fn().mockResolvedValue(expectedUser);

      const result = await UserService.createUser(userData);

      expect(result).toEqual(expectedUser);
      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...userData,
          totalPurchases: 0,
          currentLevel: 'Базовый',
        }),
        include: {
          project: true,
          bonuses: true,
          transactions: true,
        },
      });
    });

    it('should handle referral code when creating user', async () => {
      const userData = {
        projectId,
        email: 'referred@example.com',
        phone: '+79001234567',
        firstName: 'Referred',
        lastName: 'User',
        referralCode: 'REF123',
      };

      mockDb.user.findFirst = jest.fn().mockResolvedValue({
        id: 'referrer-id',
        referralCode: 'REF123',
      });

      mockDb.user.create = jest.fn().mockResolvedValue({
        id: 'new-user-id',
        ...userData,
        referredBy: 'referrer-id',
      });

      const result = await UserService.createUser(userData);

      expect(result.referredBy).toBe('referrer-id');
    });

    it('should throw error when required fields are missing', async () => {
      const invalidData = {
        projectId,
        // Missing email and phone
        firstName: 'Test',
      };

      await expect(UserService.createUser(invalidData)).rejects.toThrow();
    });
  });

  describe('findUserByContact', () => {
    it('should find user by email', async () => {
      const email = 'test@example.com';
      const expectedUser = {
        id: 'user-id',
        email,
        projectId,
        totalPurchases: 1000,
      };

      mockDb.user.findFirst = jest.fn().mockResolvedValue(expectedUser);

      const result = await UserService.findUserByContact(projectId, email, undefined);

      expect(result).toBeDefined();
      expect(result?.email).toBe(email);
      expect(result?.totalPurchases).toBe(1000);
      expect(mockDb.user.findFirst).toHaveBeenCalledWith({
        where: {
          projectId,
          OR: [{ email }, {}].filter(Boolean),
        },
        include: {
          project: true,
          bonuses: true,
          transactions: true,
        },
      });
    });

    it('should find user by phone', async () => {
      const phone = '+79001234567';
      mockDb.user.findFirst = jest.fn().mockResolvedValue({
        id: 'user-id',
        phone,
        projectId,
      });

      const result = await UserService.findUserByContact(projectId, undefined, phone);

      expect(result).toBeDefined();
      expect(result?.phone).toBe(phone);
    });

    it('should return null when user not found', async () => {
      mockDb.user.findFirst = jest.fn().mockResolvedValue(null);

      const result = await UserService.findUserByContact(projectId, 'nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getUserBalance', () => {
    it('should calculate user balance correctly', async () => {
      const userId = 'user-id';
      const bonuses = [
        { id: '1', amount: 100, isUsed: false, expiresAt: new Date(Date.now() + 86400000) },
        { id: '2', amount: 50, isUsed: false, expiresAt: new Date(Date.now() + 86400000) },
        { id: '3', amount: 30, isUsed: true, expiresAt: new Date(Date.now() + 86400000) },
        { id: '4', amount: 20, isUsed: false, expiresAt: new Date(Date.now() - 86400000) }, // expired
      ];

      mockDb.bonus.findMany = jest.fn().mockResolvedValue(bonuses);
      mockDb.bonus.aggregate = jest.fn()
        .mockResolvedValueOnce({ _sum: { amount: 200 } }) // totalEarned
        .mockResolvedValueOnce({ _sum: { amount: 30 } }); // totalSpent

      const result = await UserService.getUserBalance(userId);

      expect(result.currentBalance).toBe(150); // 100 + 50 (not used, not expired)
      expect(result.totalEarned).toBe(200);
      expect(result.totalSpent).toBe(30);
      expect(result.bonuses).toHaveLength(4);
    });
  });
});

describe('BonusService', () => {
  const mockDb = db as jest.Mocked<typeof db>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup transaction mock
    mockDb.$transaction = jest.fn().mockImplementation(async (callback) => {
      return callback(mockDb);
    });
  });

  describe('awardPurchaseBonus', () => {
    it('should award purchase bonus correctly', async () => {
      const userId = 'user-id';
      const amount = 1000;
      const orderId = 'ORDER-123';

      mockDb.user.findUnique = jest.fn().mockResolvedValue({
        id: userId,
        projectId: 'project-id',
        totalPurchases: 0,
        currentLevel: 'Базовый',
        project: {
          bonusPercentage: 5,
          bonusExpiryDays: 365,
        },
      });

      mockDb.bonusLevel.findMany = jest.fn().mockResolvedValue([
        {
          name: 'Базовый',
          minAmount: 0,
          maxAmount: 10000,
          bonusPercent: 5,
        },
      ]);

      mockDb.bonus.create = jest.fn().mockResolvedValue({
        id: 'bonus-id',
        userId,
        amount: 50,
        type: BonusType.PURCHASE,
        expiresAt: new Date(Date.now() + 365 * 86400000),
      });

      mockDb.transaction.create = jest.fn().mockResolvedValue({
        id: 'transaction-id',
        userId,
        amount: 50,
        type: TransactionType.EARN,
      });

      mockDb.user.update = jest.fn().mockResolvedValue({
        id: userId,
        totalPurchases: 1000,
        currentLevel: 'Базовый',
      });

      const result = await BonusService.awardPurchaseBonus(userId, amount, orderId);

      expect(result.bonus.amount).toBe(50);
      expect(result.transaction.type).toBe(TransactionType.EARN);
      expect(result.levelInfo.currentLevel).toBe('Базовый');
      expect(mockDb.$transaction).toHaveBeenCalled();
    });

    it('should handle level upgrade on purchase', async () => {
      const userId = 'user-id';
      const amount = 15000; // Should trigger level upgrade

      mockDb.user.findUnique = jest.fn().mockResolvedValue({
        id: userId,
        projectId: 'project-id',
        totalPurchases: 5000,
        currentLevel: 'Базовый',
        project: {
          bonusPercentage: 5,
          bonusExpiryDays: 365,
        },
      });

      mockDb.bonusLevel.findMany = jest.fn().mockResolvedValue([
        {
          name: 'Базовый',
          minAmount: 0,
          maxAmount: 10000,
          bonusPercent: 5,
        },
        {
          name: 'Серебряный',
          minAmount: 10000,
          maxAmount: 50000,
          bonusPercent: 7,
        },
      ]);

      mockDb.bonus.create = jest.fn().mockResolvedValue({
        id: 'bonus-id',
        amount: 1050, // 7% of 15000
      });

      mockDb.transaction.create = jest.fn();
      mockDb.user.update = jest.fn().mockResolvedValue({
        id: userId,
        totalPurchases: 20000,
        currentLevel: 'Серебряный',
      });

      const result = await BonusService.awardPurchaseBonus(userId, amount, 'ORDER-456');

      expect(result.levelInfo.currentLevel).toBe('Серебряный');
      expect(result.levelInfo.levelChanged).toBe(true);
      expect(result.levelInfo.previousLevel).toBe('Базовый');
    });
  });

  describe('spendBonuses', () => {
    it('should spend bonuses in FIFO order', async () => {
      const userId = 'user-id';
      const amountToSpend = 75;

      const bonuses = [
        { id: 'bonus-1', amount: 50, isUsed: false, expiresAt: new Date(Date.now() + 86400000) },
        { id: 'bonus-2', amount: 30, isUsed: false, expiresAt: new Date(Date.now() + 172800000) },
        { id: 'bonus-3', amount: 20, isUsed: false, expiresAt: new Date(Date.now() + 259200000) },
      ];

      mockDb.bonus.findMany = jest.fn().mockResolvedValue(bonuses);
      mockDb.bonus.update = jest.fn();
      mockDb.transaction.create = jest.fn();

      const result = await BonusService.spendBonuses(userId, amountToSpend, 'SPEND-123');

      expect(result.spent).toBe(75);
      expect(result.remaining).toBe(0);
      expect(result.bonusesUsed).toHaveLength(2);
      
      // Check that first bonus is fully used
      expect(mockDb.bonus.update).toHaveBeenCalledWith({
        where: { id: 'bonus-1' },
        data: { amount: 0, isUsed: true },
      });
      
      // Check that second bonus is partially used
      expect(mockDb.bonus.update).toHaveBeenCalledWith({
        where: { id: 'bonus-2' },
        data: { amount: 5, isUsed: false },
      });
    });

    it('should handle insufficient bonuses', async () => {
      const userId = 'user-id';
      const amountToSpend = 100;

      mockDb.bonus.findMany = jest.fn().mockResolvedValue([
        { id: 'bonus-1', amount: 30, isUsed: false, expiresAt: new Date(Date.now() + 86400000) },
      ]);

      mockDb.bonus.update = jest.fn();
      mockDb.transaction.create = jest.fn();

      const result = await BonusService.spendBonuses(userId, amountToSpend, 'SPEND-456');

      expect(result.spent).toBe(30);
      expect(result.remaining).toBe(70);
      expect(result.insufficientFunds).toBe(true);
    });

    it('should skip expired bonuses', async () => {
      const userId = 'user-id';
      const amountToSpend = 50;

      mockDb.bonus.findMany = jest.fn().mockResolvedValue([
        { id: 'bonus-1', amount: 30, isUsed: false, expiresAt: new Date(Date.now() - 86400000) }, // expired
        { id: 'bonus-2', amount: 50, isUsed: false, expiresAt: new Date(Date.now() + 86400000) },
      ]);

      mockDb.bonus.update = jest.fn();
      mockDb.transaction.create = jest.fn();

      const result = await BonusService.spendBonuses(userId, amountToSpend, 'SPEND-789');

      expect(result.spent).toBe(50);
      expect(result.bonusesUsed).toHaveLength(1);
      expect(result.bonusesUsed[0].id).toBe('bonus-2');
    });
  });
});