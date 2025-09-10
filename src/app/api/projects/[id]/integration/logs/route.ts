/**
 * @file: route.ts
 * @description: Получение последних логов webhook для проекта
 * @project: SaaS Bonus System
 * @dependencies: NextRequest, NextResponse, db
 * @created: 2025-09-10
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

  const logs = await db.webhookLog.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      endpoint: true,
      method: true,
      headers: true,
      status: true,
      success: true,
      createdAt: true,
      body: true,
      response: true
    }
  });

  return NextResponse.json({ logs });
}
