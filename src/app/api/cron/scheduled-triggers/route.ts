/**
 * @file: src/app/api/cron/scheduled-triggers/route.ts
 * @description: Cron-эндпоинт для запуска workflow с trigger.schedule.
 *               Рекомендуется запускать каждую минуту в Vercel/внешнем шедулере.
 *               Авторизация: `Authorization: Bearer ${CRON_SECRET}`.
 *
 *               Vercel Cron конфиг (vercel.json):
 *               {
 *                 "crons": [{
 *                   "path": "/api/cron/scheduled-triggers",
 *                   "schedule": "* * * * *"
 *                 }]
 *               }
 *
 * @project: SaaS Bonus System
 * @created: 2026-05-27
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ScheduledTriggerRunner } from '@/lib/services/workflow/scheduled/scheduled-trigger-runner';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('Unauthorized scheduled-triggers cron access attempt', {
      source: 'scheduled-triggers-cron'
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    logger.info('Starting scheduled-triggers cron run', {
      source: 'scheduled-triggers-cron'
    });

    const stats = await ScheduledTriggerRunner.runDueWorkflows(new Date());

    const durationMs = Date.now() - startedAt;
    logger.info('Scheduled-triggers cron run completed', {
      source: 'scheduled-triggers-cron',
      durationMs,
      ...stats
    });

    return NextResponse.json({
      success: true,
      durationMs,
      stats
    });
  } catch (error) {
    logger.error('Scheduled-triggers cron run failed', {
      source: 'scheduled-triggers-cron',
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * Ручной запуск (для тестирования из админки или скриптами).
 * Также требует Bearer ${CRON_SECRET}.
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
