// Типизация восстановлена для обеспечения безопасности типов

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
  TransactionType,
  UserWithBonuses
} from '@/types/bonus';
import { ProjectService } from './project.service';
import { BonusLevelService } from './bonus-level.service';
import { ReferralService } from './referral.service';
import {
  sendBonusNotification,
  sendBonusSpentNotification
} from '@/lib/telegram/notifications';
import { logger } from '@/lib/logger';

export class UserService {
  // Создание нового пользователя с поддержкой UTM меток и реферальной системы
  static async createUser(data: CreateUserInput): Promise<User> {
    try {
      // Ищем рефера если есть реферальный код
      let referredBy: string | undefined;
      if (data.referralCode) {
        const referrer = await ReferralService.findReferrer(
          data.projectId,
          data.utmSource,
          data.referralCode
        );
        if (referrer) {
          referredBy = referrer.id;
        }
      }

      // Генерируем реферальный код для нового пользователя
      const user = await db.user.create({
        data: {
          ...data,
          referredBy,
          // UTM метки сохраняются как есть из data
          totalPurchases: 0,
          currentLevel: 'Базовый'
        },
        include: {
          project: true,
          bonuses: true,
          transactions: true
        }
      });

      // Создаём реферальный код для пользователя
      await ReferralService.ensureUserReferralCode(user.id);

      logger.info('Создан новый пользователь', {
        userId: user.id,
        projectId: data.projectId,
        hasReferrer: !!referredBy,
        utmSource: data.utmSource,
        component: 'user-service'
      });

      return {
        ...user,
        totalPurchases: Number(user.totalPurchases)
      };
    } catch (error) {
      logger.error('Ошибка создания пользователя', {
        data,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'user-service'
      });
      throw error;
    }
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
        OR: [email ? { email } : {}, phone ? { phone } : {}].filter(Boolean)
      },
      include: {
        project: true,
        bonuses: true,
        transactions: true
      }
    });

    if (!user) return null;

    return {
      ...user,
      totalPurchases: Number(user.totalPurchases)
    };
  }

  // Получение пользователя по Telegram ID
  static async getUserByTelegramId(
    projectId: string,
    telegramId: bigint
  ): Promise<User | null> {
    const user = await db.user.findFirst({
      where: { projectId, telegramId },
      include: {
        project: true,
        bonuses: true,
        transactions: true
      }
    });

    if (!user) return null;

    return {
      ...user,
      totalPurchases: Number(user.totalPurchases)
    };
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
        telegramUsername
      },
      include: {
        project: true,
        bonuses: true,
        transactions: true
      }
    });

    return {
      ...updatedUser,
      totalPurchases: Number(updatedUser.totalPurchases)
    };
  }

  // Получение баланса пользователя с учётом уровня
  static async getUserBalance(userId: string): Promise<UserBalance> {
    const [earnTransactions, spendTransactions, expiringSoon] =
      await Promise.all([
        db.transaction.aggregate({
          where: {
            userId,
            type: 'EARN'
          },
          _sum: {
            amount: true
          }
        }),
        db.transaction.aggregate({
          where: {
            userId,
            type: 'SPEND'
          },
          _sum: {
            amount: true
          }
        }),
        db.bonus.aggregate({
          where: {
            userId,
            isUsed: false,
            expiresAt: {
              gte: new Date(),
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 дней
            }
          },
          _sum: {
            amount: true
          }
        })
      ]);

    const totalEarned = Number(earnTransactions._sum.amount || 0);
    const totalSpent = Number(spendTransactions._sum.amount || 0);
    const currentBalance = totalEarned - totalSpent;
    const expiringSoonAmount = Number(expiringSoon._sum.amount || 0);

    return {
      totalEarned,
      totalSpent,
      currentBalance,
      expiringSoon: expiringSoonAmount
    };
  }

  // Получение списка пользователей проекта с информацией об уровнях
  static async getProjectUsers(
    projectId: string,
    page = 1,
    limit = 10
  ): Promise<{ users: UserWithBonuses[]; total: number }> {
    const skip = (page - 1) * limit;

    // Загружаем пользователей страницы и общее количество
    const [users, total] = await Promise.all([
      db.user.findMany({
        where: { projectId },
        skip,
        take: limit,
        include: {
          project: true,
          // Убираем загрузку бонусов/транзакций для предотвращения N+1
          referrer: true,
          referrals: true
        },
        orderBy: { registeredAt: 'desc' }
      }),
      db.user.count({ where: { projectId } })
    ]);

    if (users.length === 0) {
      return { users: [], total };
    }

    const userIds = users.map((u) => u.id);

    // Выполняем агрегаты ОДНИМ запросом для всех пользователей страницы
    const [txByUserAndType, activeBonusesByUser, projectLevels] =
      await Promise.all([
        db.transaction.groupBy({
          by: ['userId', 'type'],
          where: { userId: { in: userIds } },
          _sum: { amount: true }
        }),
        db.bonus.groupBy({
          by: ['userId'],
          where: {
            userId: { in: userIds },
            isUsed: false,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
          },
          _sum: { amount: true }
        }),
        BonusLevelService.getBonusLevels(projectId)
      ]);

    // Преобразуем агрегаты в быстрые словари
    const earnedMap = new Map<string, number>();
    const spentMap = new Map<string, number>();
    for (const row of txByUserAndType) {
      const sum = Number(row._sum?.amount || 0);
      if (row.type === 'EARN') earnedMap.set(row.userId, sum);
      else if (row.type === 'SPEND') spentMap.set(row.userId, sum);
    }

    const activeBonusMap = new Map<string, number>();
    for (const row of activeBonusesByUser) {
      activeBonusMap.set(row.userId, Number(row._sum?.amount || 0));
    }

    // Считаем уровень на основе уже загруженных уровней (без доп. запросов)
    const usersWithBonuses: UserWithBonuses[] = users.map((user) => {
      const activeBonuses = activeBonusMap.get(user.id) ?? 0;
      const totalEarned = earnedMap.get(user.id) ?? 0;
      const totalSpent = spentMap.get(user.id) ?? 0;

      const progress = BonusLevelService.calculateProgressToNextLevelFromLevels(
        projectLevels as any,
        Number(user.totalPurchases)
      );

      return {
        ...user,
        totalPurchases: Number(user.totalPurchases),
        activeBonuses,
        totalEarned,
        totalSpent,
        level: progress.currentLevel,
        progressToNext: progress.nextLevel
          ? {
              nextLevel: progress.nextLevel,
              amountNeeded: progress.amountNeeded,
              progressPercent: progress.progressPercent
            }
          : undefined
      };
    });

    return { users: usersWithBonuses, total };
  }

  // Получить расширенную информацию о пользователе с уровнем
  static async getUserWithLevel(
    userId: string
  ): Promise<UserWithBonuses | null> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        project: true,
        bonuses: {
          where: {
            isUsed: false,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
          }
        },
        transactions: true,
        referrer: true,
        referrals: true
      }
    });

    if (!user) return null;

    const activeBonuses = user.bonuses.reduce(
      (sum, bonus) => sum + Number(bonus.amount),
      0
    );

    const [totalEarned, totalSpent] = await Promise.all([
      db.transaction.aggregate({
        where: { userId: user.id, type: 'EARN' },
        _sum: { amount: true }
      }),
      db.transaction.aggregate({
        where: { userId: user.id, type: 'SPEND' },
        _sum: { amount: true }
      })
    ]);

    // Получаем информацию об уровне
    const progress = await BonusLevelService.calculateProgressToNextLevel(
      user.projectId,
      Number(user.totalPurchases)
    );

    return {
      ...user,
      totalPurchases: Number(user.totalPurchases),
      activeBonuses,
      totalEarned: Number(totalEarned._sum.amount || 0),
      totalSpent: Number(totalSpent._sum.amount || 0),
      level: progress.currentLevel,
      progressToNext: progress.nextLevel
        ? {
            nextLevel: progress.nextLevel,
            amountNeeded: progress.amountNeeded,
            progressPercent: progress.progressPercent
          }
        : undefined
    };
  }
}

export class BonusService {
  // Начисление бонусов пользователю с учётом уровня
  static async awardBonus(data: CreateBonusInput): Promise<Bonus> {
    const user = await db.user.findUnique({
      where: { id: data.userId },
      include: { project: true }
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
        expiresAt
      },
      include: {
        user: true,
        transactions: true
      }
    });

    // Создаем транзакцию начисления
    await this.createTransaction({
      userId: data.userId,
      bonusId: bonus.id,
      amount: data.amount,
      type: 'EARN',
      description: data.description || `Начисление бонусов: ${data.type}`
    });

    // Отправляем уведомление в Telegram (неблокирующе)
    try {
      await sendBonusNotification(user, bonus, user.projectId);
    } catch (error) {
      logger.error('Ошибка отправки уведомления о бонусах', {
        userId: data.userId,
        bonusId: bonus.id,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'bonus-service'
      });
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
    // Получаем пользователя для контекста уровня и уведомлений
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { project: true }
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    const currentLevel = await BonusLevelService.calculateUserLevel(
      user.projectId,
      Number(user.totalPurchases)
    );

    const transactions = await db.$transaction(async (tx) => {
      const availableBonuses = await tx.bonus.findMany({
        where: {
          userId,
          isUsed: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
        },
        orderBy: { expiresAt: 'asc' }
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

      const created: Transaction[] = [];
      let remainingAmount = amount;

      for (const bonus of availableBonuses) {
        if (remainingAmount <= 0) break;

        const bonusAmount = Number(bonus.amount);
        const spendFromThisBonus = Math.min(bonusAmount, remainingAmount);

        const transaction = await tx.transaction.create({
          data: {
            userId,
            bonusId: bonus.id,
            amount: spendFromThisBonus,
            type: 'SPEND',
            description: description || 'Списание бонусов',
            metadata,
            userLevel: currentLevel?.name,
            appliedPercent: currentLevel?.paymentPercent
          },
          include: { user: true, bonus: true }
        });

        created.push(transaction);

        const newAmount = bonusAmount - spendFromThisBonus;
        if (newAmount <= 0) {
          await tx.bonus.update({
            where: { id: bonus.id },
            data: { isUsed: true }
          });
        } else {
          await tx.bonus.update({
            where: { id: bonus.id },
            data: { amount: newAmount }
          });
        }

        remainingAmount -= spendFromThisBonus;
      }

      return created;
    });

    // Неблокирующее уведомление
    if (transactions.length > 0) {
      try {
        await sendBonusSpentNotification(
          user,
          amount,
          description || 'Списание бонусов',
          user.projectId
        );
      } catch (error) {
        logger.error('Ошибка отправки уведомления о списании бонусов', {
          userId,
          amount,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка',
          component: 'bonus-service'
        });
      }
    }

    return transactions;
  }

  // Создание транзакции
  static async createTransaction(
    data: CreateTransactionInput
  ): Promise<Transaction> {
    const transaction = await db.transaction.create({
      data,
      include: {
        user: true,
        bonus: true
      }
    });

    return transaction;
  }

  // Начисление за покупку с учётом уровня и реферальной системы
  static async awardPurchaseBonus(
    userId: string,
    purchaseAmount: number,
    orderId: string,
    description?: string,
    bonusType: BonusType = 'PURCHASE',
    metadata?: Record<string, any>
  ): Promise<{
    bonus: Bonus;
    levelInfo: {
      currentLevel: string;
      bonusPercent: number;
      levelChanged: boolean;
    };
    referralInfo?: {
      bonusAwarded: boolean;
      referrerBonus?: number;
      referrerUser?: User;
    };
  }> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { project: true }
    });

    if (!user || !user.project) {
      throw new Error('Пользователь или проект не найден');
    }

    // Обновляем общую сумму покупок и уровень пользователя
    const newTotalPurchases = Number(user.totalPurchases) + purchaseAmount;
    const levelUpdateResult = await BonusLevelService.updateUserLevel(
      userId,
      newTotalPurchases
    );

    // Определяем процент бонуса на основе уровня
    let bonusPercent = Number(user.project.bonusPercentage); // Базовый процент

    if (levelUpdateResult.newLevel) {
      const currentLevel = await BonusLevelService.calculateUserLevel(
        user.projectId,
        newTotalPurchases
      );
      if (currentLevel) {
        bonusPercent = currentLevel.bonusPercent;
      }
    }

    const bonusAmount = (purchaseAmount * bonusPercent) / 100;

    // Начисляем основной бонус
    const bonus = await this.awardBonus({
      userId,
      amount: bonusAmount,
      type: bonusType,
      description:
        description ||
        `Бонус за покупку на сумму ${purchaseAmount}₽ (заказ ${orderId})`
    });

    // Дополнительная EARN-транзакция не создаётся, чтобы избежать дублирования.
    // Подробности покупки уже отражены в описании бонуса.

    // Обрабатываем реферальную систему
    const referralInfo = await ReferralService.processReferralBonus(
      userId,
      purchaseAmount,
      user.utmSource || undefined,
      undefined // referencalCode из пользователя уже обработан при регистрации
    );

    logger.info('Начислен бонус за покупку', {
      userId,
      purchaseAmount,
      bonusAmount,
      bonusPercent,
      currentLevel: levelUpdateResult.newLevel,
      levelChanged: levelUpdateResult.levelChanged,
      referralBonusAwarded: referralInfo.bonusAwarded,
      component: 'bonus-service'
    });

    return {
      bonus,
      levelInfo: {
        currentLevel: levelUpdateResult.newLevel || 'Базовый',
        bonusPercent,
        levelChanged: levelUpdateResult.levelChanged
      },
      referralInfo: referralInfo.bonusAwarded ? referralInfo : undefined
    };
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
      description: `Бонус ко дню рождения`
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
          bonus: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      db.transaction.count({
        where: { userId }
      })
    ]);

    return { transactions, total };
  }
}
