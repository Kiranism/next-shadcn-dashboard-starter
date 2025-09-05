/**
 * @file: src/app/api/auth/me/route.ts
 * @description: Текущий админ (по cookie)
 * @project: SaaS Bonus System
 * @dependencies: auth utils
 * @created: 2025-09-03
 * @author: AI Assistant + User
 */

import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin)
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  return NextResponse.json({
    id: admin.sub,
    email: admin.email,
    role: admin.role
  });
}
