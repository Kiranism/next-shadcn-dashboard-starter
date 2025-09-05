/**
 * @file: src/app/api/auth/logout/route.ts
 * @description: Выход (очистка cookie)
 * @project: SaaS Bonus System
 * @dependencies: auth utils
 * @created: 2025-09-03
 * @author: AI Assistant + User
 */

import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
