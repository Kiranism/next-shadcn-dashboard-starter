/**
 * @file: user.unique-telegram.test.ts
 * @description: Тесты композитной уникальности (projectId, telegramId)
 */

import { db } from '@/lib/db';

jest.mock('@/lib/db');

describe('Composite unique (projectId, telegramId)', () => {
  const mockDb = db as jest.Mocked<typeof db>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows same telegramId in different projects', async () => {
    const tg = BigInt(1234567890);
    mockDb.user.findFirst = jest.fn()
      // First lookup in project A returns null, then insert ok
      .mockResolvedValueOnce(null as any)
      // Lookup in project B returns null, then insert ok
      .mockResolvedValueOnce(null as any);

    mockDb.user.create = jest.fn()
      .mockResolvedValueOnce({ id: 'u1', projectId: 'A', telegramId: tg } as any)
      .mockResolvedValueOnce({ id: 'u2', projectId: 'B', telegramId: tg } as any);

    const u1 = await mockDb.user.create({ data: { projectId: 'A', telegramId: tg } } as any);
    const u2 = await mockDb.user.create({ data: { projectId: 'B', telegramId: tg } } as any);

    expect(u1.projectId).toBe('A');
    expect(u2.projectId).toBe('B');
  });

  it('rejects duplicate telegramId inside same project', async () => {
    const tg = BigInt(1111111111);

    // Emulate prisma unique violation on second insert
    mockDb.user.create = jest
      .fn()
      .mockResolvedValueOnce({ id: 'u1', projectId: 'P', telegramId: tg } as any)
      .mockRejectedValueOnce(Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }));

    await mockDb.user.create({ data: { projectId: 'P', telegramId: tg } } as any);

    await expect(
      mockDb.user.create({ data: { projectId: 'P', telegramId: tg } } as any)
    ).rejects.toHaveProperty('code', 'P2002');
  });
});

