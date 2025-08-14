/**
 * @file: src/app/api/admin/bots/init/route.ts
 * @description: API endpoint для инициализации всех активных Telegram ботов
 * @project: SaaS Bonus System
 * @dependencies: BotManager, Database
 * @created: 2025-08-09
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeAllBots } from '@/lib/telegram/startup';
import { logger } from '@/lib/logger';

// POST /api/admin/bots/init - Инициализация всех активных ботов
export async function POST(request: NextRequest) {
  try {
    logger.info('🚀 Запрос на инициализацию всех ботов', {
      component: 'admin-bots-init'
    });

    // Запускаем инициализацию ботов
    await initializeAllBots();

    logger.info('✅ Инициализация ботов завершена', {
      component: 'admin-bots-init'
    });

    return NextResponse.json({
      success: true,
      message: 'Инициализация всех активных ботов завершена'
    });
  } catch (error) {
    logger.error('❌ Ошибка инициализации ботов', {
      error: error instanceof Error ? error.message : 'Unknown error',
      component: 'admin-bots-init'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка инициализации ботов',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/bots/init - Получить статус инициализации
export async function GET(request: NextRequest) {
  try {
    const { botManager } = await import('@/lib/telegram/bot-manager');

    const allBots = botManager.getAllBots();

    return NextResponse.json({
      totalBots: allBots.length,
      activeBots: allBots.filter(([_, bot]) => bot.isActive).length,
      bots: allBots.map(([projectId, bot]) => ({
        projectId,
        isActive: bot.isActive,
        isPolling: bot.isPolling,
        hasWebhook: !!bot.webhook,
        lastUpdated: bot.lastUpdated
      }))
    });
  } catch (error) {
    logger.error('❌ Ошибка получения статуса ботов', {
      error: error instanceof Error ? error.message : 'Unknown error',
      component: 'admin-bots-init'
    });

    return NextResponse.json(
      { error: 'Ошибка получения статуса ботов' },
      { status: 500 }
    );
  }
}
