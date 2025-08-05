/**
 * @file: global-error-handler.ts
 * @description: Глобальный обработчик unhandled rejections для ботов
 * @project: SaaS Bonus System
 * @dependencies: logger
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

import { logger } from '@/lib/logger';

/**
 * Глобальный обработчик для unhandled rejections
 * Специально для обработки 409 конфликтов Grammy
 */
export function setupGlobalErrorHandler(): void {
  if (typeof process !== 'undefined') {
    // Перехватываем unhandled rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      const errorMessage =
        reason instanceof Error ? reason.message : String(reason);

      // Проверяем, является ли это 409 конфликтом Grammy
      if (
        errorMessage.includes('409') ||
        errorMessage.includes('terminated by other getUpdates') ||
        errorMessage.includes('GrammyError')
      ) {
        logger.warn('🚨 Перехвачен 409 конфликт Grammy', {
          error: errorMessage,
          type: 'unhandledRejection',
          component: 'global-error-handler'
        });

        // НЕ прерываем процесс для 409 ошибок
        return;
      }

      // Логируем серьезные ошибки
      logger.error('Необработанное отклонение промиса', {
        error: errorMessage,
        stack: reason instanceof Error ? reason.stack : undefined,
        type: 'unhandledRejection',
        component: 'global-error-handler'
      });

      // Для серьезных ошибок можем завершить процесс
      // process.exit(1);
    });

    // Перехватываем uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      const errorMessage = error.message;

      // Проверяем, является ли это 409 конфликтом Grammy
      if (
        errorMessage.includes('409') ||
        errorMessage.includes('terminated by other getUpdates') ||
        errorMessage.includes('GrammyError')
      ) {
        logger.warn('🚨 Перехвачено исключение 409 конфликта Grammy', {
          error: errorMessage,
          stack: error.stack,
          type: 'uncaughtException',
          component: 'global-error-handler'
        });

        // НЕ прерываем процесс для 409 ошибок
        return;
      }

      // Логируем серьезные ошибки
      logger.error('Необработанное исключение', {
        error: errorMessage,
        stack: error.stack,
        type: 'uncaughtException',
        component: 'global-error-handler'
      });

      // Для серьезных ошибок завершаем процесс
      process.exit(1);
    });

    // Обработка сигналов завершения
    process.on('SIGTERM', () => {
      logger.info('📴 Получен сигнал SIGTERM, начинаем graceful shutdown', {
        component: 'global-error-handler'
      });

      // Останавливаем все боты перед завершением
      try {
        const { botManager } = require('@/lib/telegram/bot-manager');
        botManager.emergencyStopAll();
        logger.info('✅ Все боты остановлены перед завершением', {
          component: 'global-error-handler'
        });
      } catch (error) {
        logger.error('❌ Ошибка остановки ботов при завершении', {
          error: error instanceof Error ? error.message : 'Unknown error',
          component: 'global-error-handler'
        });
      }

      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('📴 Получен сигнал SIGINT, начинаем graceful shutdown', {
        component: 'global-error-handler'
      });

      // Останавливаем все боты перед завершением
      try {
        const { botManager } = require('@/lib/telegram/bot-manager');
        botManager.emergencyStopAll();
        logger.info('✅ Все боты остановлены перед завершением', {
          component: 'global-error-handler'
        });
      } catch (error) {
        logger.error('❌ Ошибка остановки ботов при завершении', {
          error: error instanceof Error ? error.message : 'Unknown error',
          component: 'global-error-handler'
        });
      }

      process.exit(0);
    });

    logger.info('🛡️ Глобальный обработчик ошибок активирован', {
      component: 'global-error-handler',
      features: ['unhandledRejection', 'uncaughtException', 'SIGTERM', 'SIGINT']
    });
  }
}

/**
 * Обёртка для безопасного выполнения операций с ботами
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes('409') ||
      errorMessage.includes('terminated by other getUpdates')
    ) {
      logger.warn(`409 конфликт в ${context}`, {
        error: errorMessage,
        context,
        component: 'global-error-handler'
      });
      return null; // Возвращаем null вместо ошибки
    }

    // Пробрасываем серьезные ошибки
    throw error;
  }
}
