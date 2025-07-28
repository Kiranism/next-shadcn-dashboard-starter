/**
 * @file: bonus-level.service.ts
 * @description: Сервис для работы с уровнями бонусной программы
 * @project: SaaS Bonus System
 * @dependencies: db, Prisma types, bonus types
 * @created: 2025-01-23
 * @author: AI Assistant + User
 */

import { db } from '@/lib/db';
import type {
  BonusLevel,
  CreateBonusLevelInput,
  UpdateBonusLevelInput,
  User
} from '@/types/bonus';
import { logger } from '@/lib/logger';

export class BonusLevelService {
  /**
   * Получить все уровни для проекта
   */
  static async getBonusLevels(projectId: string): Promise<BonusLevel[]> {
    try {
      const levels = await db.bonusLevel.findMany({
        where: { projectId, isActive: true },
        orderBy: { order: 'asc' },
        include: { project: true }
      });

      return levels.map((level) => ({
        ...level,
        minAmount: Number(level.minAmount),
        maxAmount: level.maxAmount ? Number(level.maxAmount) : null,
        project: level.project
          ? {
              ...level.project,
              bonusPercentage: Number(level.project.bonusPercentage)
            }
          : undefined
      }));
    } catch (error) {
      logger.error('Ошибка получения уровней бонусов', {
        projectId,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'bonus-level-service'
      });
      throw error;
    }
  }

  /**
   * Создать уровень бонусной программы
   */
  static async createBonusLevel(
    input: CreateBonusLevelInput
  ): Promise<BonusLevel> {
    try {
      // Проверяем, что проект существует
      const project = await db.project.findUnique({
        where: { id: input.projectId }
      });

      if (!project) {
        throw new Error('Проект не найден');
      }

      // Проверяем уникальность имени уровня в рамках проекта
      const existingLevel = await db.bonusLevel.findFirst({
        where: {
          projectId: input.projectId,
          name: input.name,
          isActive: true
        }
      });

      if (existingLevel) {
        throw new Error(
          `Уровень "${input.name}" уже существует в этом проекте`
        );
      }

      // Определяем порядок, если не указан
      let order = input.order;
      if (order === undefined) {
        const maxOrder = await db.bonusLevel.findFirst({
          where: { projectId: input.projectId },
          orderBy: { order: 'desc' }
        });
        order = (maxOrder?.order || 0) + 1;
      }

      const level = await db.bonusLevel.create({
        data: {
          projectId: input.projectId,
          name: input.name,
          minAmount: input.minAmount,
          maxAmount: input.maxAmount,
          bonusPercent: input.bonusPercent,
          paymentPercent: input.paymentPercent,
          order
        },
        include: { project: true }
      });

      logger.info('Создан новый уровень бонусной программы', {
        projectId: input.projectId,
        levelId: level.id,
        levelName: level.name,
        component: 'bonus-level-service'
      });

      return {
        ...level,
        minAmount: Number(level.minAmount),
        maxAmount: level.maxAmount ? Number(level.maxAmount) : null,
        project: level.project
          ? {
              ...level.project,
              bonusPercentage: Number(level.project.bonusPercentage)
            }
          : undefined
      };
    } catch (error) {
      logger.error('Ошибка создания уровня бонусной программы', {
        input,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'bonus-level-service'
      });
      throw error;
    }
  }

  /**
   * Обновить уровень бонусной программы
   */
  static async updateBonusLevel(
    levelId: string,
    input: UpdateBonusLevelInput
  ): Promise<BonusLevel> {
    try {
      const level = await db.bonusLevel.update({
        where: { id: levelId },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.minAmount !== undefined && { minAmount: input.minAmount }),
          ...(input.maxAmount !== undefined && { maxAmount: input.maxAmount }),
          ...(input.bonusPercent !== undefined && {
            bonusPercent: input.bonusPercent
          }),
          ...(input.paymentPercent !== undefined && {
            paymentPercent: input.paymentPercent
          }),
          ...(input.order !== undefined && { order: input.order }),
          ...(input.isActive !== undefined && { isActive: input.isActive })
        },
        include: { project: true }
      });

      logger.info('Обновлён уровень бонусной программы', {
        levelId,
        updates: input,
        component: 'bonus-level-service'
      });

      return {
        ...level,
        minAmount: Number(level.minAmount),
        maxAmount: level.maxAmount ? Number(level.maxAmount) : null,
        project: level.project
          ? {
              ...level.project,
              bonusPercentage: Number(level.project.bonusPercentage)
            }
          : undefined
      };
    } catch (error) {
      logger.error('Ошибка обновления уровня бонусной программы', {
        levelId,
        input,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'bonus-level-service'
      });
      throw error;
    }
  }

  /**
   * Удалить уровень бонусной программы (мягкое удаление)
   */
  static async deleteBonusLevel(levelId: string): Promise<void> {
    try {
      await db.bonusLevel.update({
        where: { id: levelId },
        data: { isActive: false }
      });

      logger.info('Деактивирован уровень бонусной программы', {
        levelId,
        component: 'bonus-level-service'
      });
    } catch (error) {
      logger.error('Ошибка деактивации уровня бонусной программы', {
        levelId,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'bonus-level-service'
      });
      throw error;
    }
  }

  /**
   * Определить текущий уровень пользователя на основе общей суммы покупок
   */
  static async calculateUserLevel(
    projectId: string,
    totalPurchases: number
  ): Promise<BonusLevel | null> {
    try {
      const levels = await this.getBonusLevels(projectId);

      if (levels.length === 0) {
        return null;
      }

      // Сортируем уровни по minAmount в убывающем порядке
      const sortedLevels = levels.sort((a, b) => b.minAmount - a.minAmount);

      // Находим подходящий уровень
      for (const level of sortedLevels) {
        if (totalPurchases >= level.minAmount) {
          // Проверяем максимальную границу (если есть)
          if (!level.maxAmount || totalPurchases <= level.maxAmount) {
            return level;
          }
        }
      }

      // Если не нашли подходящий уровень, возвращаем базовый (первый по порядку)
      return levels.sort((a, b) => a.order - b.order)[0];
    } catch (error) {
      logger.error('Ошибка определения уровня пользователя', {
        projectId,
        totalPurchases,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'bonus-level-service'
      });
      throw error;
    }
  }

  /**
   * Рассчитать прогресс пользователя до следующего уровня
   */
  static async calculateProgressToNextLevel(
    projectId: string,
    totalPurchases: number
  ): Promise<{
    currentLevel: BonusLevel | null;
    nextLevel: BonusLevel | null;
    amountNeeded: number;
    progressPercent: number;
  }> {
    try {
      const levels = await this.getBonusLevels(projectId);
      const currentLevel = await this.calculateUserLevel(
        projectId,
        totalPurchases
      );

      if (!currentLevel || levels.length === 0) {
        return {
          currentLevel: null,
          nextLevel: null,
          amountNeeded: 0,
          progressPercent: 0
        };
      }

      // Находим следующий уровень
      const sortedLevels = levels.sort((a, b) => a.minAmount - b.minAmount);
      const currentIndex = sortedLevels.findIndex(
        (level) => level.id === currentLevel.id
      );
      const nextLevel =
        currentIndex < sortedLevels.length - 1
          ? sortedLevels[currentIndex + 1]
          : null;

      if (!nextLevel) {
        // Пользователь уже на максимальном уровне
        return {
          currentLevel,
          nextLevel: null,
          amountNeeded: 0,
          progressPercent: 100
        };
      }

      const amountNeeded = nextLevel.minAmount - totalPurchases;
      const progressRange = nextLevel.minAmount - currentLevel.minAmount;
      const progressMade = totalPurchases - currentLevel.minAmount;
      const progressPercent =
        progressRange > 0
          ? Math.min(100, Math.max(0, (progressMade / progressRange) * 100))
          : 0;

      return {
        currentLevel,
        nextLevel,
        amountNeeded: Math.max(0, amountNeeded),
        progressPercent: Math.round(progressPercent)
      };
    } catch (error) {
      logger.error('Ошибка расчёта прогресса до следующего уровня', {
        projectId,
        totalPurchases,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'bonus-level-service'
      });
      throw error;
    }
  }

  /**
   * Обновить уровень пользователя после покупки
   */
  static async updateUserLevel(
    userId: string,
    newTotalPurchases: number
  ): Promise<{
    user: User;
    levelChanged: boolean;
    oldLevel?: string;
    newLevel?: string;
  }> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { project: true }
      });

      if (!user) {
        throw new Error('Пользователь не найден');
      }

      const oldLevel = user.currentLevel;
      const newLevel = await this.calculateUserLevel(
        user.projectId,
        newTotalPurchases
      );
      const newLevelName = newLevel?.name || 'Базовый';

      // Обновляем данные пользователя
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: {
          totalPurchases: newTotalPurchases,
          currentLevel: newLevelName
        }
      });

      const levelChanged = oldLevel !== newLevelName;

      if (levelChanged) {
        logger.info('Изменился уровень пользователя', {
          userId,
          oldLevel,
          newLevel: newLevelName,
          totalPurchases: newTotalPurchases,
          component: 'bonus-level-service'
        });
      }

      return {
        user: {
          ...updatedUser,
          totalPurchases: Number(updatedUser.totalPurchases)
        },
        levelChanged,
        oldLevel,
        newLevel: newLevelName
      };
    } catch (error) {
      logger.error('Ошибка обновления уровня пользователя', {
        userId,
        newTotalPurchases,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'bonus-level-service'
      });
      throw error;
    }
  }

  /**
   * Создать базовые уровни для нового проекта
   */
  static async createDefaultLevels(projectId: string): Promise<BonusLevel[]> {
    try {
      const defaultLevels = [
        {
          name: 'Базовый',
          minAmount: 0,
          maxAmount: 9999.99,
          bonusPercent: 5,
          paymentPercent: 10,
          order: 1
        },
        {
          name: 'Серебряный',
          minAmount: 10000,
          maxAmount: 19999.99,
          bonusPercent: 7,
          paymentPercent: 15,
          order: 2
        },
        {
          name: 'Золотой',
          minAmount: 20000,
          maxAmount: undefined, // Изменено с null на undefined для совместимости с типом
          bonusPercent: 10,
          paymentPercent: 20,
          order: 3
        }
      ];

      const createdLevels: BonusLevel[] = [];

      for (const levelData of defaultLevels) {
        const level = await this.createBonusLevel({
          projectId,
          ...levelData
        });
        createdLevels.push(level);
      }

      logger.info('Созданы базовые уровни для проекта', {
        projectId,
        levelsCount: createdLevels.length,
        component: 'bonus-level-service'
      });

      return createdLevels;
    } catch (error) {
      logger.error('Ошибка создания базовых уровней', {
        projectId,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'bonus-level-service'
      });
      throw error;
    }
  }
}
