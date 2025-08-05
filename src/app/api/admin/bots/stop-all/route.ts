/**
 * @file: route.ts
 * @description: API для экстренной остановки всех ботов
 * @project: SaaS Bonus System
 * @dependencies: BotManager
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { botManager } from '@/lib/telegram/bot-manager';
import { logger } from '@/lib/logger';

// POST /api/admin/bots/stop-all - Экстренная остановка всех ботов
export async function POST(request: NextRequest) {
  try {
    logger.info('Запрос на экстренную остановку всех ботов', {}, 'admin-api');

    // Получаем все активные боты
    const activeBots = botManager.getAllBots();

    if (activeBots.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Нет активных ботов для остановки',
        stoppedCount: 0
      });
    }

    logger.warn(
      `🚨 ЭКСТРЕННАЯ ОСТАНОВКА: найдено ${activeBots.length} активных ботов`,
      {
        botCount: activeBots.length
      },
      'admin-api'
    );

    // Используем экстренную остановку для форсированной очистки 409 конфликтов
    try {
      await botManager.emergencyStopAll();

      const stoppedCount = activeBots.length;
      logger.info(
        `✅ Экстренная остановка завершена успешно`,
        {
          stoppedCount
        },
        'admin-api'
      );

      return NextResponse.json({
        success: true,
        message: `✅ Экстренная остановка: остановлено ${stoppedCount} ботов, конфликты очищены`,
        stoppedCount,
        totalBots: activeBots.length,
        method: 'emergency_stop'
      });
    } catch (error) {
      // Fallback к обычной остановке если экстренная не сработала
      logger.warn(
        `Экстренная остановка не сработала, используем обычную`,
        {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        'admin-api'
      );

      let stoppedCount = 0;
      const errors: string[] = [];

      for (const [projectId] of activeBots) {
        try {
          await botManager.stopBot(projectId);
          stoppedCount++;
          logger.info(
            `Бот для проекта ${projectId} остановлен`,
            { projectId },
            'admin-api'
          );
        } catch (error) {
          const errorMsg = `Ошибка остановки бота ${projectId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          logger.error(errorMsg, { projectId }, 'admin-api');
        }
      }

      return NextResponse.json({
        success: true,
        message: `Обычная остановка: ${stoppedCount} из ${activeBots.length} ботов остановлено`,
        stoppedCount,
        totalBots: activeBots.length,
        errors: errors.length > 0 ? errors : undefined,
        method: 'fallback_stop'
      });
    }
  } catch (error) {
    logger.error(
      'Ошибка экстренной остановки ботов',
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'admin-api'
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка экстренной остановки ботов',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
