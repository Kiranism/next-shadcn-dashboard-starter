/**
 * @file: forgot-password.test.ts
 * @description: Тесты для API восстановления пароля
 * @project: SaaS Bonus System
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/forgot-password/route';
import { db } from '@/lib/db';

jest.mock('@/lib/db');
jest.mock('@/lib/logger');

describe('Auth Forgot Password API', () => {
  const mockDb = db as jest.Mocked<typeof db>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns success for valid email without leaking existence', async () => {
    mockDb.adminAccount.findUnique = jest.fn().mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      isActive: true
    } as any);

    const req = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com' })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns success even if account not found', async () => {
    mockDb.adminAccount.findUnique = jest.fn().mockResolvedValue(null as any);

    const req = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'notfound@example.com' })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('validates email format', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid' })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

