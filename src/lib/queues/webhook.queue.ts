/**
 * @file: webhook.queue.ts
 * @description: Bull очереди для асинхронной обработки webhook запросов
 * @project: SaaS Bonus System
 * @dependencies: bull, ioredis
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import Bull from 'bull';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { UserService, BonusService } from '@/lib/services/user.service';
import { sendBonusNotification } from '@/lib/telegram/notifications';
import type {
  WebhookRegisterUserPayload,
  WebhookPurchasePayload,
  WebhookSpendBonusesPayload
} from '@/types/bonus';

// Конфигурация Redis для очередей
const redisConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
};

// Типы задач в очереди
export interface WebhookJobData {
  type: 'register_user' | 'purchase' | 'spend_bonuses' | 'tilda_order';
  projectId: string;
  payload: any;
  webhookSecret: string;
  timestamp: number;
  retryCount?: number;
}

// Создаем очереди
export const webhookQueue = new Bull<WebhookJobData>(
  'webhook-processing',
  redisConfig
);
export const notificationQueue = new Bull('notifications', redisConfig);
export const analyticsQueue = new Bull('analytics-update', redisConfig);

// Обработчики задач webhook очереди
webhookQueue.process('register_user', async (job) => {
  const { projectId, payload } = job.data;
  logger.info('Processing register_user job', { jobId: job.id, projectId });

  try {
    const result = await processUserRegistration(projectId, payload);

    // Добавляем задачу на отправку приветственного уведомления
    await notificationQueue.add(
      'welcome',
      {
        userId: result.user.id,
        projectId
      },
      {
        delay: 1000 // Отправить через 1 секунду
      }
    );

    return result;
  } catch (error) {
    logger.error('Failed to process register_user', {
      jobId: job.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

webhookQueue.process('purchase', async (job) => {
  const { projectId, payload } = job.data;
  logger.info('Processing purchase job', { jobId: job.id, projectId });

  try {
    const result = await processPurchase(projectId, payload);

    // Добавляем задачи на обновление аналитики и отправку уведомления
    await Promise.all([
      analyticsQueue.add('update-user-stats', {
        userId: result.user.id,
        projectId,
        amount: payload.amount
      }),
      notificationQueue.add('bonus-earned', {
        userId: result.user.id,
        bonusId: result.bonus.id,
        projectId
      })
    ]);

    return result;
  } catch (error) {
    logger.error('Failed to process purchase', {
      jobId: job.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

webhookQueue.process('spend_bonuses', async (job) => {
  const { projectId, payload } = job.data;
  logger.info('Processing spend_bonuses job', { jobId: job.id, projectId });

  try {
    const result = await processSpendBonuses(projectId, payload);

    // Добавляем задачу на отправку уведомления
    await notificationQueue.add('bonus-spent', {
      userId: result.user.id,
      amount: payload.amount,
      projectId
    });

    return result;
  } catch (error) {
    logger.error('Failed to process spend_bonuses', {
      jobId: job.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

// Обработчики для notification очереди
notificationQueue.process('welcome', async (job) => {
  const { userId, projectId } = job.data;

  try {
    // Здесь логика отправки приветственного сообщения
    logger.info('Sending welcome notification', { userId, projectId });
    // await sendWelcomeNotification(userId, projectId);
  } catch (error) {
    logger.error('Failed to send welcome notification', {
      jobId: job.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

notificationQueue.process('bonus-earned', async (job) => {
  const { userId, bonusId, projectId } = job.data;

  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    const bonus = await db.bonus.findUnique({ where: { id: bonusId } });

    if (user && bonus) {
      await sendBonusNotification(user as any, bonus as any, projectId);
    }
  } catch (error) {
    logger.error('Failed to send bonus notification', {
      jobId: job.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    // Не пробрасываем ошибку, чтобы не блокировать основной процесс
  }
});

// Обработчики для analytics очереди
analyticsQueue.process('update-user-stats', async (job) => {
  const { userId, projectId, amount } = job.data;

  try {
    // Обновляем статистику пользователя
    await db.user.update({
      where: { id: userId },
      data: {
        totalPurchases: {
          increment: amount
        }
      }
    });

    // Инвалидируем кэш аналитики и проекта
    try {
      const { CacheService } = await import('@/lib/redis');
      await CacheService.invalidateProject(projectId);
    } catch {}
  } catch (error) {
    logger.error('Failed to update user stats', {
      jobId: job.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Обработчики событий очередей
webhookQueue.on('completed', (job, result) => {
  logger.info('Webhook job completed', {
    jobId: job.id,
    type: job.data.type,
    duration: Date.now() - job.data.timestamp
  });
});

webhookQueue.on('failed', (job, err) => {
  logger.error('Webhook job failed', {
    jobId: job.id,
    type: job.data.type,
    error: err.message,
    attempts: job.attemptsMade
  });
});

webhookQueue.on('stalled', (job) => {
  logger.warn('Webhook job stalled', {
    jobId: job.id,
    type: job.data.type
  });
});

// Настройки повторных попыток
const defaultJobOptions: Bull.JobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  },
  removeOnComplete: 100, // Хранить последние 100 выполненных задач
  removeOnFail: 50 // Хранить последние 50 неудачных задач
};

// Функция для добавления задачи в очередь
export async function enqueueWebhookJob(
  type: WebhookJobData['type'],
  projectId: string,
  payload: any,
  options: Bull.JobOptions = {}
): Promise<Bull.Job<WebhookJobData>> {
  const jobData: WebhookJobData = {
    type,
    projectId,
    payload,
    webhookSecret: '', // Заполняется при необходимости
    timestamp: Date.now()
  };

  const job = await webhookQueue.add(type, jobData, {
    ...defaultJobOptions,
    ...options
  });

  logger.info('Webhook job enqueued', {
    jobId: job.id,
    type,
    projectId
  });

  return job;
}

// Вспомогательные функции обработки (перенесены из route.ts)
async function processUserRegistration(
  projectId: string,
  payload: WebhookRegisterUserPayload
) {
  const {
    email,
    phone,
    firstName,
    lastName,
    birthDate,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    referralCode
  } = payload;

  if (!email && !phone) {
    throw new Error('Должен быть указан email или телефон');
  }

  // Проверяем существование пользователя
  const existingUser = await UserService.findUserByContact(
    projectId,
    email,
    phone
  );

  if (existingUser) {
    return {
      success: true,
      message: 'Пользователь уже существует',
      user: existingUser
    };
  }

  // Создаем нового пользователя
  const user = await UserService.createUser({
    projectId,
    email,
    phone,
    firstName,
    lastName,
    birthDate: birthDate ? new Date(birthDate) : undefined,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    referralCode
  });

  return {
    success: true,
    message: 'Пользователь успешно зарегистрирован',
    user
  };
}

async function processPurchase(
  projectId: string,
  payload: WebhookPurchasePayload
) {
  const { userEmail, userPhone, purchaseAmount, orderId, description } =
    payload;

  if (!userEmail && !userPhone) {
    throw new Error('Должен быть указан email или телефон пользователя');
  }

  // Находим пользователя
  const user = await UserService.findUserByContact(
    projectId,
    userEmail,
    userPhone
  );

  if (!user) {
    throw new Error('Пользователь не найден');
  }

  // Начисляем бонусы
  const result = await BonusService.awardPurchaseBonus(
    user.id,
    purchaseAmount,
    orderId,
    description
  );

  // Получаем баланс
  const balance = await UserService.getUserBalance(user.id);

  return {
    success: true,
    message: 'Бонусы успешно начислены',
    user,
    bonus: result.bonus,
    balance,
    levelInfo: result.levelInfo,
    referralInfo: result.referralInfo
  };
}

async function processSpendBonuses(
  projectId: string,
  payload: WebhookSpendBonusesPayload
) {
  const {
    userEmail,
    userPhone,
    bonusAmount: amount,
    orderId,
    description
  } = payload;

  if (!userEmail && !userPhone) {
    throw new Error('Должен быть указан email или телефон пользователя');
  }

  // Находим пользователя
  const user = await UserService.findUserByContact(
    projectId,
    userEmail,
    userPhone
  );

  if (!user) {
    throw new Error('Пользователь не найден');
  }

  // Списываем бонусы
  const transactions = await BonusService.spendBonuses(
    user.id,
    amount,
    description || `Списание бонусов для заказа ${orderId}`,
    { orderId }
  );

  // Получаем обновленный баланс
  const balance = await UserService.getUserBalance(user.id);

  // Считаем общую сумму списанных бонусов
  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    success: true,
    message: 'Бонусы успешно списаны',
    user,
    spent: {
      amount: totalSpent,
      transactionsCount: transactions.length
    },
    balance
  };
}

// Dashboard для мониторинга очередей
export async function getQueueStats() {
  const [webhookStats, notificationStats, analyticsStats] = await Promise.all([
    webhookQueue.getJobCounts(),
    notificationQueue.getJobCounts(),
    analyticsQueue.getJobCounts()
  ]);

  return {
    webhook: webhookStats,
    notifications: notificationStats,
    analytics: analyticsStats
  };
}

// Graceful shutdown
export async function closeQueues() {
  await Promise.all([
    webhookQueue.close(),
    notificationQueue.close(),
    analyticsQueue.close()
  ]);
}
