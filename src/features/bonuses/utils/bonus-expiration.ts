import type { BonusTransaction, BonusNotification, User } from '../types';

export interface ExpiringBonusInfo {
  userId: string;
  userName: string;
  userEmail: string;
  expiringAmount: number;
  expirationDate: Date;
  daysUntilExpiration: number;
}

/**
 * Находит бонусы, которые истекают в ближайшее время
 */
export function findExpiringBonuses(
  transactions: BonusTransaction[],
  users: User[],
  daysAhead: number = 7
): ExpiringBonusInfo[] {
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  
  const expiringBonuses: ExpiringBonusInfo[] = [];
  
  // Группируем транзакции по пользователям
  const userTransactions = transactions
    .filter(t => t.type === 'EARN' && t.expiresAt && t.expiresAt > now && t.expiresAt <= futureDate)
    .reduce((acc, transaction) => {
      if (!acc[transaction.userId]) {
        acc[transaction.userId] = [];
      }
      acc[transaction.userId].push(transaction);
      return acc;
    }, {} as Record<string, BonusTransaction[]>);

  // Создаем информацию об истекающих бонусах для каждого пользователя
  Object.entries(userTransactions).forEach(([userId, userTxs]) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    userTxs.forEach(transaction => {
      if (transaction.expiresAt) {
        const daysUntilExpiration = Math.ceil(
          (transaction.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );

        expiringBonuses.push({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          expiringAmount: transaction.amount,
          expirationDate: transaction.expiresAt,
          daysUntilExpiration,
        });
      }
    });
  });

  return expiringBonuses.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
}

/**
 * Создает уведомления об истекающих бонусах
 */
export function createExpirationNotifications(
  expiringBonuses: ExpiringBonusInfo[]
): BonusNotification[] {
  return expiringBonuses.map(bonus => ({
    id: crypto.randomUUID(),
    userId: bonus.userId,
    type: 'EXPIRING_SOON' as const,
    title: 'Бонусы скоро истекут!',
    message: `У вас есть ${bonus.expiringAmount.toLocaleString()} бонусов, которые истекут через ${bonus.daysUntilExpiration} ${getDaysWord(bonus.daysUntilExpiration)}. Не забудьте их потратить!`,
    bonusAmount: bonus.expiringAmount,
    expiresAt: bonus.expirationDate,
    isRead: false,
    createdAt: new Date(),
  }));
}

/**
 * Находит истекшие бонусы и помечает их как истекшие
 */
export function findExpiredBonuses(
  transactions: BonusTransaction[]
): BonusTransaction[] {
  const now = new Date();
  
  return transactions.filter(
    t => t.type === 'EARN' && t.expiresAt && t.expiresAt <= now
  );
}

/**
 * Создает транзакции списания для истекших бонусов
 */
export function createExpirationTransactions(
  expiredBonuses: BonusTransaction[]
): BonusTransaction[] {
  return expiredBonuses.map(expiredBonus => ({
    id: crypto.randomUUID(),
    userId: expiredBonus.userId,
    type: 'EXPIRE' as const,
    amount: -expiredBonus.amount,
    description: `Истечение бонусов (начислены ${expiredBonus.createdAt.toLocaleDateString()})`,
    createdAt: new Date(),
    metadata: {
      originalTransactionId: expiredBonus.id,
      originalCreatedAt: expiredBonus.createdAt,
      expiredAt: expiredBonus.expiresAt,
    },
  }));
}

/**
 * Создает уведомления об истекших бонусах
 */
export function createExpiredNotifications(
  expiredBonuses: BonusTransaction[],
  users: User[]
): BonusNotification[] {
  // Группируем истекшие бонусы по пользователям
  const userExpiredBonuses = expiredBonuses.reduce((acc, transaction) => {
    if (!acc[transaction.userId]) {
      acc[transaction.userId] = [];
    }
    acc[transaction.userId].push(transaction);
    return acc;
  }, {} as Record<string, BonusTransaction[]>);

  return Object.entries(userExpiredBonuses).map(([userId, userBonuses]) => {
    const user = users.find(u => u.id === userId);
    const totalExpired = userBonuses.reduce((sum, bonus) => sum + bonus.amount, 0);

    return {
      id: crypto.randomUUID(),
      userId,
      type: 'EXPIRED' as const,
      title: 'Бонусы истекли',
      message: `У вас истекло ${totalExpired.toLocaleString()} бонусов. В следующий раз используйте их вовремя!`,
      bonusAmount: totalExpired,
      isRead: false,
      createdAt: new Date(),
    };
  });
}

/**
 * Основная функция обработки истечения бонусов
 */
export async function processBonusExpiration(
  transactions: BonusTransaction[],
  users: User[]
): Promise<{
  expiredTransactions: BonusTransaction[];
  expirationTransactions: BonusTransaction[];
  notifications: BonusNotification[];
  summary: {
    totalExpiredBonuses: number;
    affectedUsers: number;
    totalExpiredAmount: number;
  };
}> {
  // Находим истекшие бонусы
  const expiredBonuses = findExpiredBonuses(transactions);
  
  // Создаем транзакции списания
  const expirationTransactions = createExpirationTransactions(expiredBonuses);
  
  // Создаем уведомления
  const notifications = createExpiredNotifications(expiredBonuses, users);
  
  // Подсчитываем статистику
  const affectedUserIds = new Set(expiredBonuses.map(b => b.userId));
  const totalExpiredAmount = expiredBonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
  
  return {
    expiredTransactions: expiredBonuses,
    expirationTransactions,
    notifications,
    summary: {
      totalExpiredBonuses: expiredBonuses.length,
      affectedUsers: affectedUserIds.size,
      totalExpiredAmount,
    },
  };
}

/**
 * Планирование уведомлений об истекающих бонусах
 */
export async function scheduleExpirationWarnings(
  transactions: BonusTransaction[],
  users: User[],
  warningDays: number[] = [7, 3, 1]
): Promise<BonusNotification[]> {
  const allNotifications: BonusNotification[] = [];
  
  for (const days of warningDays) {
    const expiringBonuses = findExpiringBonuses(transactions, users, days);
    const notifications = createExpirationNotifications(expiringBonuses);
    allNotifications.push(...notifications);
  }
  
  return allNotifications;
}

// Вспомогательные функции
function getDaysWord(days: number): string {
  if (days === 1) return 'день';
  if (days >= 2 && days <= 4) return 'дня';
  return 'дней';
}

/**
 * Форматирование даты для уведомлений
 */
export function formatExpirationDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}