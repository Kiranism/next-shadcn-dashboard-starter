/**
 * @file: __tests__/services/workflow/max-bot-compatibility.test.ts
 * @description: Unit tests for MAX Bot and Telegram platform compatibility in Database queries.
 */

import { QueryExecutor } from '@/lib/services/workflow/query-executor';
import { db } from '@/lib/db';

jest.mock('@/lib/db');
jest.mock('@/lib/logger');

const mockMiddlewares: any[] = [];
jest.mock('@maxhub/max-bot-api', () => {
  return {
    Bot: class {
      use(fn: any) {
        mockMiddlewares.push(fn);
      }
      on() {}
    },
    Keyboard: {
      button: {
        requestContact: (text: string) => ({ type: 'request_contact', text }),
        callback: (text: string, payload: string) => ({
          type: 'callback',
          text,
          payload
        })
      },
      inlineKeyboard: (buttons: any) => ({
        type: 'inline_keyboard',
        payload: { buttons }
      })
    }
  };
});

jest.mock('@/lib/services/workflow-runtime.service', () => ({
  WorkflowRuntimeService: {
    hasActiveWorkflow: jest.fn(),
    executeWorkflow: jest.fn(),
    cacheWaitingExecution: jest.fn(),
    getCachedWaitingExecution: jest.fn(),
    invalidateWaitingExecutionCache: jest.fn()
  }
}));

describe('Max Bot Platform Compatibility', () => {
  const mockDb = db as jest.Mocked<typeof db>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('check_user_by_platform with platform=max searches by maxId', async () => {
    mockDb.user.findFirst = jest.fn().mockResolvedValue({
      id: 'user-1',
      projectId: 'project-1',
      maxId: BigInt(123456),
      maxUsername: 'maxuser',
      bonuses: []
    } as any);

    const result = await QueryExecutor.execute(
      mockDb as any,
      'check_user_by_platform',
      {
        telegramId: '123456',
        projectId: 'project-1',
        platform: 'max'
      }
    );

    expect(mockDb.user.findFirst).toHaveBeenCalledWith({
      where: {
        maxId: BigInt(123456),
        projectId: 'project-1'
      },
      include: expect.any(Object)
    });
    expect(result.maxId).toBe('123456');
    expect(result.maxUsername).toBe('maxuser');
  });

  it('check_user_by_platform with platform=telegram searches by telegramId', async () => {
    mockDb.user.findFirst = jest.fn().mockResolvedValue({
      id: 'user-1',
      projectId: 'project-1',
      telegramId: BigInt(123456),
      telegramUsername: 'tguser',
      bonuses: []
    } as any);

    const result = await QueryExecutor.execute(
      mockDb as any,
      'check_user_by_platform',
      {
        telegramId: '123456',
        projectId: 'project-1',
        platform: 'telegram'
      }
    );

    expect(mockDb.user.findFirst).toHaveBeenCalledWith({
      where: {
        telegramId: BigInt(123456),
        projectId: 'project-1'
      },
      include: expect.any(Object)
    });
    expect(result.telegramId).toBe('123456');
    expect(result.telegramUsername).toBe('tguser');
  });

  it('activate_user with platform=max updates maxId and maxUsername', async () => {
    mockDb.user.findUnique = jest.fn().mockResolvedValue({
      id: 'user-1',
      projectId: 'project-1'
    } as any);
    mockDb.user.updateMany = jest.fn().mockResolvedValue({ count: 1 } as any);
    mockDb.user.update = jest.fn().mockResolvedValue({
      id: 'user-1',
      maxId: BigInt(123456),
      maxUsername: 'maxuser',
      project: { bonusExpiryDays: 365 }
    } as any);
    mockDb.referralProgram = {
      findUnique: jest.fn().mockResolvedValue({ welcomeBonus: 0 } as any)
    } as any;

    await QueryExecutor.execute(mockDb as any, 'activate_user', {
      userId: 'user-1',
      telegramId: '123456',
      telegramUsername: 'maxuser',
      platform: 'max'
    });

    expect(mockDb.user.updateMany).toHaveBeenCalledWith({
      where: {
        projectId: 'project-1',
        maxId: BigInt(123456),
        id: { not: 'user-1' }
      },
      data: {
        maxId: null,
        isActive: false
      }
    });

    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        maxId: BigInt(123456),
        maxUsername: 'maxuser',
        isActive: true
      }),
      include: expect.any(Object)
    });
  });

  it('update_user_contact with platform=max queries by maxId and returns max fields', async () => {
    mockDb.user.findFirst = jest.fn().mockResolvedValue({
      id: 'user-1',
      projectId: 'project-1',
      maxId: BigInt(123456),
      maxUsername: 'maxuser',
      isActive: true,
      email: 'old@test.com'
    } as any);
    mockDb.user.update = jest.fn().mockResolvedValue({
      id: 'user-1',
      projectId: 'project-1',
      maxId: BigInt(123456),
      maxUsername: 'maxuser',
      isActive: true,
      email: 'new@test.com'
    } as any);

    const result = await QueryExecutor.execute(
      mockDb as any,
      'update_user_contact',
      {
        telegramId: '123456',
        projectId: 'project-1',
        email: 'new@test.com',
        platform: 'max'
      }
    );

    expect(mockDb.user.findFirst).toHaveBeenCalledWith({
      where: {
        maxId: BigInt(123456),
        projectId: 'project-1'
      }
    });
    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        email: 'new@test.com'
      })
    });
    expect(result.maxId).toBe('123456');
    expect(result.email).toBe('new@test.com');
  });

  it('check_user_by_contact with platform=max searches by maxId', async () => {
    mockDb.user.findFirst = jest.fn().mockResolvedValue({
      id: 'user-1',
      projectId: 'project-1',
      maxId: BigInt(123456),
      maxUsername: 'maxuser',
      isActive: true,
      email: 'test@test.com'
    } as any);

    const result = await QueryExecutor.execute(
      mockDb as any,
      'check_user_by_contact',
      {
        telegramId: '123456',
        projectId: 'project-1',
        platform: 'max'
      }
    );

    expect(mockDb.user.findFirst).toHaveBeenCalledWith({
      where: {
        maxId: BigInt(123456),
        projectId: 'project-1'
      }
    });
    expect(result.maxId).toBe('123456');
    expect(result.maxUsername).toBe('maxuser');
  });

  it('create_user with platform=max maps telegramId to maxId', async () => {
    mockDb.user.create = jest.fn().mockResolvedValue({
      id: 'user-1',
      projectId: 'project-1',
      maxId: BigInt(123456),
      maxUsername: 'maxuser',
      email: 'test@test.com'
    } as any);

    await QueryExecutor.execute(mockDb as any, 'create_user', {
      telegramId: '123456',
      username: 'maxuser',
      projectId: 'project-1',
      platform: 'max',
      email: 'test@test.com'
    });

    expect(mockDb.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'project-1',
        maxId: BigInt(123456),
        maxUsername: 'maxuser',
        email: 'test@test.com'
      })
    });
  });
});

describe('Max Bot Middleware and Fallbacks', () => {
  const { createMaxBot } = require('@/lib/max-bot/bot');
  const {
    WorkflowRuntimeService
  } = require('@/lib/services/workflow-runtime.service');
  const {
    isPhone,
    normalizePhone
  } = require('@/lib/services/workflow/handlers/utils');

  beforeEach(() => {
    mockMiddlewares.length = 0;
    jest.clearAllMocks();
  });

  it('detects /start message as start trigger in MAX bot middleware', async () => {
    createMaxBot('dummy-token', 'project-1');

    // Находим middleware обработки workflow (второй middleware)
    const workflowMiddleware = mockMiddlewares[1];
    expect(workflowMiddleware).toBeDefined();

    WorkflowRuntimeService.hasActiveWorkflow.mockResolvedValue(true);
    WorkflowRuntimeService.executeWorkflow.mockResolvedValue(true);

    const mockCtx = {
      updateType: 'message_created',
      chatId: '123',
      user: { user_id: '456', username: 'testuser', name: 'Test' },
      message: {
        body: { text: '/start' }
      }
    };
    const next = jest.fn();

    await workflowMiddleware(mockCtx, next);

    expect(WorkflowRuntimeService.executeWorkflow).toHaveBeenCalledWith(
      'project-1',
      'start', // Триггер должен быть 'start' благодаря проверке текста сообщения
      expect.objectContaining({
        _platform: 'max',
        _projectId: 'project-1'
      })
    );
  });

  it('isPhone and normalizePhone work as expected', () => {
    expect(isPhone('+79991234567')).toBe(true);
    expect(isPhone('89991234567')).toBe(true);
    expect(isPhone('12345')).toBe(false);

    expect(normalizePhone(' +7 (999) 123-45-67 ')).toBe('+79991234567');
    expect(normalizePhone('8-999-123-45-67')).toBe('89991234567');
  });
});
