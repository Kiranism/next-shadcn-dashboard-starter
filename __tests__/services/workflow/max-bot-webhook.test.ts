/**
 * @file: __tests__/services/workflow/max-bot-webhook.test.ts
 * @description: Unit tests for MAX Bot Webhook registration, cleanup and route handler.
 */

import { maxBotManager } from '@/lib/max-bot/bot-manager';
import { db } from '@/lib/db';
import { POST, GET } from '@/app/api/webhook/max-bot/[projectId]/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({
  db: {
    project: {
      findUnique: jest.fn()
    }
  }
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

const mockClientCall = jest.fn();
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockHandleUpdate = jest.fn();
const mockGetMyInfo = jest.fn().mockResolvedValue({ id: 123, username: 'mockmaxbot' });

jest.mock('@maxhub/max-bot-api', () => {
  return {
    Bot: class {
      api = {
        getMyInfo: mockGetMyInfo,
        raw: {
          client: {
            call: mockClientCall
          }
        }
      };
      botInfo = undefined;
      start = mockStart;
      stop = mockStop;
      handleUpdate = mockHandleUpdate;
      use() {}
      on() {}
    }
  };
});

describe('MAX Bot Webhook Management', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('createBot registers webhook in production when HTTPS is enabled', async () => {
    process.env.NODE_ENV = 'production';
    process.env.WEBHOOK_BASE_URL = 'https://my-saas-platform.com';
    
    mockClientCall.mockResolvedValue({ status: 200, data: { ok: true } });

    const instance = await maxBotManager.createBot('project-1', 'dummy-token');

    expect(instance.isPolling).toBe(false);
    expect(mockGetMyInfo).toHaveBeenCalled();
    expect(mockClientCall).toHaveBeenCalledWith({
      method: 'subscriptions',
      options: {
        method: 'POST',
        body: {
          url: 'https://my-saas-platform.com/api/webhook/max-bot/project-1',
          update_types: ['message_created', 'message_callback', 'bot_started']
        }
      }
    });
    expect(mockStart).not.toHaveBeenCalled();
  });

  it('createBot defaults to long polling in local development', async () => {
    process.env.NODE_ENV = 'development';
    process.env.WEBHOOK_BASE_URL = 'https://my-saas-platform.com';

    mockClientCall.mockResolvedValue({ status: 200, data: { ok: true } });

    const instance = await maxBotManager.createBot('project-2', 'dummy-token');

    expect(instance.isPolling).toBe(true);
    // Should attempt to delete webhook subscription first
    expect(mockClientCall).toHaveBeenCalledWith({
      method: 'subscriptions',
      options: {
        method: 'DELETE',
        query: { url: 'https://my-saas-platform.com/api/webhook/max-bot/project-2' }
      }
    });
    expect(mockStart).toHaveBeenCalled();
  });

  it('stopBot deletes webhook subscription if bot is not in polling mode', async () => {
    process.env.NODE_ENV = 'production';
    process.env.WEBHOOK_BASE_URL = 'https://my-saas-platform.com';
    mockClientCall.mockResolvedValue({ status: 200, data: { ok: true } });

    await maxBotManager.createBot('project-3', 'dummy-token');
    
    // Stop the bot
    await maxBotManager.stopBot('project-3', false);

    expect(mockClientCall).toHaveBeenCalledWith({
      method: 'subscriptions',
      options: {
        method: 'DELETE',
        query: { url: 'https://my-saas-platform.com/api/webhook/max-bot/project-3' }
      }
    });
    expect(mockStop).not.toHaveBeenCalled();
  });

  it('stopBot stops polling if bot is in polling mode', async () => {
    process.env.NODE_ENV = 'development';
    process.env.WEBHOOK_BASE_URL = 'https://my-saas-platform.com';
    mockClientCall.mockResolvedValue({ status: 200, data: { ok: true } });

    await maxBotManager.createBot('project-4', 'dummy-token');
    
    // Stop the bot
    await maxBotManager.stopBot('project-4', false);

    expect(mockStop).toHaveBeenCalled();
  });
});

describe('MAX Bot Webhook Route Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST forwards updates to handleUpdate on active bot', async () => {
    const updatePayload = {
      update_type: 'message_created',
      timestamp: 1625000000,
      message: {
        body: { text: 'Hello' }
      }
    };

    // Ensure bot exists in manager memory
    const mockBotInstance = {
      bot: {
        handleUpdate: mockHandleUpdate
      },
      isActive: true,
      projectId: 'project-5',
      lastUpdated: new Date()
    };
    (maxBotManager as any).bots.set('project-5', mockBotInstance);

    const request = new NextRequest('http://localhost:5006/api/webhook/max-bot/project-5', {
      method: 'POST',
      body: JSON.stringify(updatePayload)
    });

    const response = await POST(request, { params: Promise.resolve({ projectId: 'project-5' }) });
    expect(response.status).toBe(200);

    const resJson = await response.json();
    expect(resJson.ok).toBe(true);
    expect(mockHandleUpdate).toHaveBeenCalledWith(updatePayload);
  });

  it('GET returns active subscription details', async () => {
    const mockBotInstance = {
      bot: {
        api: {
          raw: {
            client: {
              call: mockClientCall
            }
          }
        }
      },
      isActive: true,
      projectId: 'project-6',
      lastUpdated: new Date()
    };
    (maxBotManager as any).bots.set('project-6', mockBotInstance);
    
    mockClientCall.mockResolvedValue({
      status: 200,
      data: [{ url: 'https://my-saas-platform.com/api/webhook/max-bot/project-6' }]
    });

    const request = new NextRequest('http://localhost:5006/api/webhook/max-bot/project-6', {
      method: 'GET'
    });

    const response = await GET(request, { params: Promise.resolve({ projectId: 'project-6' }) });
    expect(response.status).toBe(200);

    const resJson = await response.json();
    expect(resJson.isRunning).toBe(true);
    expect(resJson.webhookSubscription).toEqual([{ url: 'https://my-saas-platform.com/api/webhook/max-bot/project-6' }]);
  });
});
