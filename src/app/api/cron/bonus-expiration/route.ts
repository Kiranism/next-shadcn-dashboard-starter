import { NextRequest, NextResponse } from 'next/server';
import {
  processBonusExpiration,
  scheduleExpirationWarnings
} from '@/features/bonuses/utils/bonus-expiration';
import type { BonusTransaction } from '@/features/bonuses/types';

// Симуляция базы данных - в реальном проекте здесь была бы работа с БД
let mockUsers = [
  {
    id: '1',
    name: 'Иван Петров',
    email: 'ivan@example.com',
    bonusBalance: 1500,
    totalEarned: 3000,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Мария Сидорова',
    email: 'maria@example.com',
    bonusBalance: 750,
    totalEarned: 1200,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date()
  }
];

let mockTransactions: BonusTransaction[] = [
  {
    id: '1',
    userId: '1',
    type: 'EARN',
    amount: 500,
    description: 'Бонус за покупку',
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Истекает через 2 дня
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) // Создан 25 дней назад
  },
  {
    id: '2',
    userId: '1',
    type: 'EARN',
    amount: 1000,
    description: 'Приветственный бонус',
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Истекает через 5 дней
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    userId: '2',
    type: 'EARN',
    amount: 250,
    description: 'Бонус за отзыв',
    expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Уже истек
    createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
  }
];

let mockNotifications: any[] = [];

/**
 * Cron job для обработки истечения бонусов
 * Должен запускаться ежедневно в 00:00
 */
export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию cron job (в продакшене нужна защита)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Запуск cron job для обработки истечения бонусов...');

    // 1. Обрабатываем истекшие бонусы
    const expirationResult = await processBonusExpiration(
      mockTransactions,
      mockUsers
    );

    // Обновляем транзакции и балансы пользователей
    if (expirationResult.expirationTransactions.length > 0) {
      // Добавляем транзакции списания
      mockTransactions.push(...expirationResult.expirationTransactions);

      // Обновляем балансы пользователей
      expirationResult.expiredTransactions.forEach((expiredTx) => {
        const user = mockUsers.find((u) => u.id === expiredTx.userId);
        if (user) {
          user.bonusBalance = Math.max(0, user.bonusBalance - expiredTx.amount);
          user.updatedAt = new Date();
        }
      });

      console.log(
        `💸 Обработано ${expirationResult.summary.totalExpiredBonuses} истекших бонусов на сумму ${expirationResult.summary.totalExpiredAmount}`
      );
    }

    // 2. Планируем уведомления об истекающих бонусах
    const warningNotifications = await scheduleExpirationWarnings(
      mockTransactions,
      mockUsers,
      [7, 3, 1] // Уведомления за 7, 3 и 1 день
    );

    // Добавляем уведомления
    mockNotifications.push(...expirationResult.notifications);
    mockNotifications.push(...warningNotifications);

    // 3. Отправка email уведомлений (заглушка)
    for (const notification of [
      ...expirationResult.notifications,
      ...warningNotifications
    ]) {
      await sendEmailNotification(notification);
    }

    // 4. Создаем отчет
    const report = {
      timestamp: new Date().toISOString(),
      processing: {
        expiredBonuses: expirationResult.summary.totalExpiredBonuses,
        affectedUsers: expirationResult.summary.affectedUsers,
        totalExpiredAmount: expirationResult.summary.totalExpiredAmount
      },
      notifications: {
        expirationNotifications: expirationResult.notifications.length,
        warningNotifications: warningNotifications.length,
        totalSent:
          expirationResult.notifications.length + warningNotifications.length
      },
      nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    console.log('✅ Cron job завершен успешно:', report);

    return NextResponse.json({
      success: true,
      message: 'Bonus expiration processing completed',
      report
    });
  } catch (error) {
    console.error('❌ Ошибка в cron job:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Ручной запуск обработки (для тестирования)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Ручной запуск обработки истечения бонусов...');

    // Переиспользуем логику GET запроса
    return await GET(request);
  } catch (error) {
    console.error('❌ Ошибка в ручном запуске:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Manual processing failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Получить статистику последнего запуска
 */
export async function HEAD(request: NextRequest) {
  return NextResponse.json({
    lastRun: new Date().toISOString(),
    nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'healthy'
  });
}

// Заглушка для отправки email уведомлений
async function sendEmailNotification(notification: any): Promise<void> {
  // В реальном проекте здесь была бы интеграция с email сервисом
  console.log(
    `📧 Отправка email уведомления пользователю ${notification.userId}:`,
    {
      title: notification.title,
      message: notification.message
    }
  );

  // Симуляция задержки отправки
  await new Promise((resolve) => setTimeout(resolve, 100));
}
