/**
 * @file: src/app/api/cron/subscription-renewal/route.ts
 * @description: Cron — автопродление подписок через ЮKassa (сохранённая карта)
 * @project: SaaS Bonus System
 * @created: 2026-06-06
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { SubscriptionRenewalService } from '@/lib/services/subscription-renewal.service';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron access attempt', {
        source: 'subscription-renewal-cron'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Starting subscription renewal cron', {
      source: 'subscription-renewal-cron'
    });

    const result = await SubscriptionRenewalService.processDueRenewals();

    logger.info('Subscription renewal cron completed', {
      source: 'subscription-renewal-cron',
      result
    });

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Subscription renewal cron failed', {
      source: 'subscription-renewal-cron',
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
