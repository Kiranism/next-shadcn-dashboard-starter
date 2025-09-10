/**
 * @file: route.ts
 * @description: Статус интеграции (подключения сайта) по активности webhook
 * @project: SaaS Bonus System
 * @dependencies: NextRequest, NextResponse, db
 * @created: 2025-09-10
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ProjectService } from '@/lib/services/project.service';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const project = await ProjectService.getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
  }

  // Последние события
  const [lastAny, lastSuccess, counts24h] = await Promise.all([
    db.webhookLog.findFirst({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' }
    }),
    db.webhookLog.findFirst({
      where: { projectId: id, success: true },
      orderBy: { createdAt: 'desc' }
    }),
    (async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [success24h, error24h] = await Promise.all([
        db.webhookLog.count({
          where: { projectId: id, createdAt: { gte: since }, success: true }
        }),
        db.webhookLog.count({
          where: { projectId: id, createdAt: { gte: since }, success: false }
        })
      ]);
      return { success24h, error24h, since };
    })()
  ]);

  // Считаем подключенным, если был успешный webhook за последние 30 дней
  const THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;
  const connected = !!(
    lastSuccess &&
    Date.now() - new Date(lastSuccess.createdAt).getTime() < THRESHOLD_MS
  );

  return NextResponse.json({
    connected,
    project: { id: project.id, name: project.name },
    lastEventAt: lastAny?.createdAt ?? null,
    lastSuccessAt: lastSuccess?.createdAt ?? null,
    lastStatus: lastAny?.status ?? null,
    stats24h: counts24h
  });
}
