// @ts-nocheck
// Временно отключаем проверку типов для совместимости с Prisma

import { db } from '@/lib/db';
import type {
  CreateUserInput,
  CreateBonusInput,
  CreateTransactionInput,
  User,
  Bonus,
  Transaction,
  UserBalance,
  BonusType,
  TransactionType
} from '@/types/bonus';
import { ProjectService } from './project.service';
import { sendBonusNotification, sendBonusSpentNotification } from '@/lib/telegram/notifications';

export class UserService {
  // Создание нового пользователя
  static async createUser(data: CreateUserInput): Promise<User> {
    const user = await db.user.create({
      data,
      include: {
        project: true,
        bonuses: true,
        transactions: true,
      },
    });

    return user;
  }

  // Поиск пользователя по email или телефону в рамках проекта
  static async findUserByContact(
    projectId: string,
    email?: string,
    phone?: string
  ): Promise<User | null> {
    if (!email && !phone) return null;

    const user = await db.user.findFirst({
      where: {
        projectId,
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
        ].filter(Boolean),
      },
      include: {
        project: true,
        bonuses: true,
        transactions: true,
      },
    });

    return user;
  }

  // Получение пользователя по Telegram ID
  static async getUserByTelegramId(telegramId: bigint): Promise<User | null> {
    const user = await db.user.findUnique({
      where: { telegramId },
      include: {
        project: true,
        bonuses: true,
        transactions: true,
      },
    });

    return user;
  }

  // Привязка Telegram аккаунта к пользователю
  static async linkTelegramAccount(
    projectId: string,
    telegramId: bigint,
    telegramUsername?: string,
    contactInfo?: { email?: string; phone?: string }
  ): Promise<User | null> {
    const user = await this.findUserByContact(
      projectId,
      contactInfo?.email,
      contactInfo?.phone
    );

    if (!user) return null;

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        telegramId,
        telegramUsername,
      },
      include: {
        project: true,
        bonuses: true,
        transactions: true,
      },
    });

    return updatedUser;
  }

  // Получение баланса пользователя
  static async getUserBalance(userId: string): Promise<UserBalance> {
    const [earnTransactions, spendTransactions, expiringSoon] = await Promise.all([
      db.transaction.aggregate({
        where: {
          userId,
          type: 'EARN',
        },
        _sum: {
          amount: true,
        },
      }),
      db.transaction.aggregate({
        where: {
          userId,
          type: 'SPEND',
        },
        _sum: {
          amount: true,
        },
      }),
      db.bonus.aggregate({
        where: {
          userId,
          isUsed: false,
          expiresAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const totalEarned = Number(earnTransactions._sum.amount || 0);
    const totalSpent = Number(spendTransactions._sum.amount || 0);
    const currentBalance = totalEarned - totalSpent;
    const expiringSoonAmount = Number(expiringSoon._sum.amount || 0);

    return {
      totalEarned,
      totalSpent,
      currentBalance,
      expiringSoon: expiringSoonAmount,
    };
  }

  // Получение списка пользователей проекта
  static async getProjectUsers(
    projectId: string,
    page = 1,
    limit = 10
  ): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      db.user.findMany({
        where: { projectId },
        skip,
        take: limit,
        include: {
          project: true,
          bonuses: true,
          transactions: true,
        },
        orderBy: {
          registeredAt: 'desc',
        },
      }),
      db.user.count({
        where: { projectId },
      }),
    ]);

    return { users, total };
  }
}

export class BonusService {
  // Начисление бонусов пользователю
  static async awardBonus(data: CreateBonusInput): Promise<Bonus> {
    const user = await db.user.findUnique({
      where: { id: data.userId },
      include: { project: true },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    // Если дата истечения не указана, рассчитываем по настройкам проекта
    let expiresAt = data.expiresAt;
    if (!expiresAt && user.project) {
      const expireDays = user.project.bonusExpiryDays;
      expiresAt = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);
    }

    const bonus = await db.bonus.create({
      data: {
        ...data,
        expiresAt,
      },
      include: {
        user: true,
        transactions: true,
      },
    });

    // Создаем транзакцию начисления
    await this.createTransaction({
      userId: data.userId,
      bonusId: bonus.id,
      amount: data.amount,
      type: 'EARN',
      description: data.description || `Начисление бонусов: ${data.type}`,
    });

    // Отправляем уведомление в Telegram (неблокирующе)
    try {
      await sendBonusNotification(user, bonus, user.projectId);
    } catch (error) {
      console.error('Ошибка отправки уведомления о бонусах:', error);
      // Не блокируем основной процесс
    }

    return bonus;
  }

  // Списание бонусов пользователя
  static async spendBonuses(
    userId: string,
    amount: number,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<Transaction[]> {
    const availableBonuses = await db.bonus.findMany({
      where: {
        userId,
        isUsed: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: {
        expiresAt: 'asc', // Используем сначала те, что скоро истекают
      },
    });

    const totalAvailable = availableBonuses.reduce(
      (sum: number, bonus: any) => sum + Number(bonus.amount),
      0
    );

    if (totalAvailable < amount) {
      throw new Error(
        `Недостаточно бонусов. Доступно: ${totalAvailable}, требуется: ${amount}`
      );
    }

    const transactions: Transaction[] = [];
    let remainingAmount = amount;

    for (const bonus of availableBonuses) {
      if (remainingAmount <= 0) break;

      const bonusAmount = Number(bonus.amount);
      const spendFromThisBonus = Math.min(bonusAmount, remainingAmount);

      // Создаем транзакцию списания
      const transaction = await this.createTransaction({
        userId,
        bonusId: bonus.id,
        amount: spendFromThisBonus,
        type: 'SPEND',
        description: description || 'Списание бонусов',
        metadata,
      });

      transactions.push(transaction);

      // Если бонус полностью использован, помечаем его как использованный
      if (spendFromThisBonus === bonusAmount) {
        await db.bonus.update({
          where: { id: bonus.id },
          data: { isUsed: true },
        });
      }

      remainingAmount -= spendFromThisBonus;
    }

    // Отправляем уведомление о списании бонусов (неблокирующе)
    if (transactions.length > 0) {
      try {
        const user = await db.user.findUnique({
          where: { id: userId },
          include: { project: true }
        });
        if (user) {
          await sendBonusSpentNotification(
            user, 
            amount, 
            description || 'Списание бонусов', 
            user.projectId
          );
        }
      } catch (error) {
        console.error('Ошибка отправки уведомления о списании бонусов:', error);
        // Не блокируем основной процесс
      }
    }

    return transactions;
  }

  // Создание транзакции
  static async createTransaction(data: CreateTransactionInput): Promise<Transaction> {
    const transaction = await db.transaction.create({
      data,
      include: {
        user: true,
        bonus: true,
      },
    });

    return transaction;
  }

  // Начисление за покупку
  static async awardPurchaseBonus(
    userId: string,
    purchaseAmount: number,
    orderId: string,
    description?: string
  ): Promise<Bonus> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { project: true },
    });

    if (!user || !user.project) {
      throw new Error('Пользователь или проект не найден');
    }

    const bonusPercentage = Number(user.project.bonusPercentage);
    const bonusAmount = (purchaseAmount * bonusPercentage) / 100;

    return this.awardBonus({
      userId,
      amount: bonusAmount,
      type: 'PURCHASE',
      description: description || `Бонус за покупку на сумму ${purchaseAmount}₽ (заказ ${orderId})`,
    });
  }

  // Начисление ко дню рождения
  static async awardBirthdayBonus(
    userId: string,
    amount: number
  ): Promise<Bonus> {
    return this.awardBonus({
      userId,
      amount,
      type: 'BIRTHDAY',
      description: `Бонус ко дню рождения`,
    });
  }

  // Получение истории транзакций пользователя
  static async getUserTransactions(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          user: true,
          bonus: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      db.transaction.count({
        where: { userId },
      }),
    ]);

    return { transactions, total };
  }
} 