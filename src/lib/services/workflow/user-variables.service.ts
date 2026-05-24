/**
 * @file: src/lib/services/workflow/user-variables.service.ts
 * @description: Сервис для работы с переменными пользователя в workflow
 * @project: SaaS Bonus System
 * @dependencies: Prisma, QueryExecutor
 * @created: 2025-10-15
 * @updated: 2026-05-24 — Phase 4: Bot Partner Cabinet (партнёрские переменные)
 * @author: AI Assistant + User
 */

import { PrismaClient } from '@prisma/client';
import { QueryExecutor } from './query-executor';
import { logger } from '@/lib/logger';
import { ReferralService } from '../referral.service';
import { BonusLevelService } from '../bonus-level.service';
import { cachedGetDescendantTree } from '../referral-commission.service';

export interface UserProfileData {
  // Основная информация
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  telegramId?: string;
  telegramUsername?: string;

  // Финансовая информация
  balance: number;
  totalEarned: number;
  totalSpent: number;
  totalPurchases: number;

  // Уровень и рефералы
  currentLevel: string;
  referralCode?: string;
  referredBy?: string;
  referrerName?: string;

  // Даты
  registeredAt: Date;
  updatedAt: Date;

  // История
  transactionHistory: any[];
  activeBonuses: any[];
  transactionCount: number;
  bonusCount: number;
}

export interface ReferralLinkData {
  referralCode: string;
  referralLink: string;
  projectName: string;
}

/**
 * Сервис для работы с переменными пользователя
 */
export class UserVariablesService {
  /**
   * Получить все переменные пользователя для использования в сообщениях
   */
  static async getUserVariables(
    db: PrismaClient,
    userId: string,
    projectId: string
  ): Promise<Record<string, any>> {
    logger.debug('UserVariablesService.getUserVariables called', {
      userId,
      projectId
    });

    // ✅ КРИТИЧНО: Логируем projectId для отладки на сервере
    logger.debug('projectId validation', {
      projectId,
      projectIdType: typeof projectId,
      projectIdLength: projectId?.length,
      isValidFormat: /^[a-z0-9_-]+$/.test(projectId || '')
    });

    try {
      console.log('🔍 UserVariablesService.getUserVariables started', {
        userId,
        projectId
      });

      // ✅ Проверяем кеш user variables
      const { WorkflowRuntimeService } = await import(
        '@/lib/services/workflow-runtime.service'
      );
      const cachedVariables =
        await WorkflowRuntimeService.getCachedUserVariables(projectId, userId);
      if (cachedVariables) {
        console.log('✅ Returning cached user variables', {
          userId,
          projectId,
          variablesCount: Object.keys(cachedVariables).length
        });
        return cachedVariables;
      }

      // Получаем полный профиль пользователя
      const profileStartTime = Date.now();
      const profile = await QueryExecutor.execute(db, 'get_user_profile', {
        userId
      });
      logger.info(
        `🚀 [PERF] get_user_profile took ${Date.now() - profileStartTime}ms`,
        { userId }
      );

      if (!profile) {
        logger.warn('User profile not found', { userId });
        return {};
      }

      logger.debug('✅ Profile data received', {
        firstName: profile.firstName,
        balance: profile.balance,
        totalEarned: profile.totalEarned,
        totalSpent: profile.totalSpent,
        transactionCount: profile.transactionCount
      });

      // Получаем реферальную ссылку
      const referralLinkStartTime = Date.now();
      let referralData;
      try {
        referralData = await QueryExecutor.execute(db, 'get_referral_link', {
          userId,
          projectId
        });
        logger.info(
          `🚀 [PERF] get_referral_link took ${Date.now() - referralLinkStartTime}ms`,
          { userId, projectId }
        );
      } catch (error) {
        console.error('❌ Failed to get referral data', error);
        referralData = null;
      }

      // Получаем инормацию об уровнях
      const progressStartTime = Date.now();
      let progressData;
      try {
        progressData = await BonusLevelService.calculateProgressToNextLevel(
          projectId,
          profile.totalPurchases
        );
        logger.info(
          `🚀 [PERF] calculateProgressToNextLevel took ${Date.now() - progressStartTime}ms`,
          { projectId }
        );
      } catch (error) {
        console.error('❌ Failed to get progress data', error);
        progressData = {
          currentLevel: null,
          nextLevel: null,
          amountNeeded: 0,
          progressPercent: 0
        };
      }

      // Форматируем даты для отображения
      const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date(date));
      };

      // Форматируем историю транзакций для отображения
      const formatTransactionHistory = (transactions: any[]) => {
        return transactions
          .slice(0, 5)
          .map((t) => {
            const amount = Number(t.amount);
            const sign = t.type === 'EARN' ? '+' : '-';
            const date = formatDate(t.createdAt);
            return `${sign}${amount} бонусов - ${t.description || 'Операция'} (${date})`;
          })
          .join('\n');
      };

      // Форматируем активные бонусы для отображения
      const formatActiveBonuses = (bonuses: any[]) => {
        return bonuses
          .slice(0, 3)
          .map((b) => {
            const amount = Number(b.amount);
            const expires = b.expiresAt
              ? ` (до ${formatDate(b.expiresAt)})`
              : ' (без срока)';
            return `${amount} бонусов${expires}`;
          })
          .join('\n');
      };

      // ✨ НОВОЕ: Генератор прогресс-бара для уровня (использует реальные данные прогресса)
      const generateProgressBar = (progressPercent: number) => {
        // progressPercent уже рассчитан в progressData
        const percent = Math.max(0, Math.min(100, progressPercent));
        const filled = Math.floor(percent / 25); // 4 блока по 25%
        const empty = 4 - filled;

        const bar = '▰'.repeat(filled) + '▱'.repeat(empty);
        return `${bar} (${Math.round(percent)}%)`;
      };

      // ✨ НОВОЕ: Форматтер для истории транзакций с красивым отображением
      const formatTransactionsDetailed = (transactions: any[]) => {
        if (!transactions || transactions.length === 0) {
          return '📭 История операций пуста';
        }

        return transactions
          .slice(0, 10)
          .map((t, index) => {
            const amount = Number(t.amount);
            const icon = t.type === 'EARN' ? '💚' : '💸';
            const sign = t.type === 'EARN' ? '+' : '-';
            const date = new Intl.DateTimeFormat('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }).format(new Date(t.createdAt));

            return `${index + 1}. ${icon} ${sign}${Math.abs(amount)} бонусов • ${t.description || 'Операция'}\n   📅 ${date}`;
          })
          .join('\n\n');
      };

      // ✅ КРИТИЧНО: Реферальная статистика ПОЛЬЗОВАТЕЛЯ, а не проекта!
      const referralStatsStartTime = Date.now();
      let referralCount = 0;
      let referralBonusTotal = 0;
      try {
        const userStats = await ReferralService.getUserReferralStats(
          userId,
          projectId
        );
        referralCount = userStats.referralCount || 0;
        referralBonusTotal = userStats.referralBonusTotal || 0;
        logger.info(
          `🚀 [PERF] getUserReferralStats took ${Date.now() - referralStatsStartTime}ms`,
          { userId, projectId }
        );
      } catch (error) {
        console.error('❌ Error getting user referral stats:', error);
        // игнорируем, не критично для сообщений
      }

      // ✨ Phase 4: Партнёрские переменные (b2b-иерархия)
      // Считаем только если у проекта включён `enablePartnerRoles`.
      const partnerStartTime = Date.now();
      const partnerVariables = await this.computePartnerVariables(
        db,
        userId,
        projectId
      );
      logger.info(
        `🚀 [PERF] computePartnerVariables took ${Date.now() - partnerStartTime}ms`,
        { userId, projectId }
      );

      const result = {
        // Основная информация
        'user.id': profile.userId,
        'user.firstName': profile.firstName || 'Не указано',
        'user.lastName': profile.lastName || 'Не указано',
        'user.fullName':
          `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
          'Не указано',
        'user.email': profile.email || 'Не указано',
        'user.phone': profile.phone || 'Не указано',
        'user.telegramId': profile.telegramId || 'Не указано',
        'user.telegramUsername': profile.telegramUsername || 'Не указано',
        'user.maxId': profile.maxId || 'Не указано',
        'user.maxUsername': profile.maxUsername || 'Не указано',

        // Финансовая информация
        'user.balance': profile.balance,
        'user.balanceFormatted': `${Number(profile.balance).toFixed(2)} бонусов`,
        'user.totalEarned': profile.totalEarned,
        'user.totalEarnedFormatted': `${Number(profile.totalEarned).toFixed(2)} бонусов`,
        'user.totalSpent': profile.totalSpent,
        'user.totalSpentFormatted': `${Number(profile.totalSpent).toFixed(2)} бонусов`,
        'user.totalPurchases': profile.totalPurchases,
        'user.totalPurchasesFormatted': `${profile.totalPurchases} руб.`,
        'user.expiringBonuses': profile.expiringBonuses || 0, // ✨ НОВОЕ
        'user.expiringBonusesFormatted': `${Number(profile.expiringBonuses || 0)} бонусов`,

        // Уровень и рефералы
        // Маппинг для преобразования цифр в названия уровней
        'user.currentLevel': (() => {
          // Используем название из progressData.currentLevel, если доступно, иначе из profile
          const level = progressData.currentLevel?.name || profile.currentLevel;
          if (!level) return 'Базовый';
          // Если это число, преобразуем в название
          const levelMap: Record<string | number, string> = {
            '3': 'Базовый',
            '4': 'Серебряный',
            '5': 'Золотой',
            '6': 'Платиновый'
          };
          if (levelMap[level]) {
            return levelMap[level];
          }
          // Если это уже строка, возвращаем как есть
          return String(level);
        })(),
        'user.progressBar': generateProgressBar(
          progressData.progressPercent || 0
        ), // Используем реальный процент прогресса
        'user.referralCode': profile.referralCode || 'Не сгенерирован',
        'user.referredBy': profile.referredBy || 'Нет',
        'user.referrerName': profile.referrerName || 'Нет',

        // Информация об уровнях
        'user.levelBonusPercent': progressData.currentLevel?.bonusPercent || 0,
        'user.levelPaymentPercent':
          progressData.currentLevel?.paymentPercent || 0,
        'user.nextLevelName':
          progressData.nextLevel?.name ||
          (progressData.currentLevel
            ? 'Максимальный уровень достигнут'
            : 'Уровень не определен'),
        'user.nextLevelAmount': progressData.amountNeeded || 0,
        'user.nextLevelAmountFormatted': progressData.nextLevel
          ? `${progressData.amountNeeded || 0} руб.`
          : '0 руб.',
        'user.progressPercent': progressData.nextLevel
          ? progressData.progressPercent
          : progressData.currentLevel
            ? 100
            : 0,

        // Даты
        'user.registeredAt': formatDate(profile.registeredAt),
        'user.updatedAt': formatDate(profile.updatedAt),

        // История и статистика
        'user.transactionCount': profile.transactionCount,
        'user.bonusCount': profile.bonusCount,
        'user.transactionHistory': formatTransactionHistory(
          profile.transactionHistory
        ),
        'user.activeBonuses': formatActiveBonuses(profile.activeBonuses),
        'transactions.formatted': formatTransactionsDetailed(
          profile.transactionHistory
        ), // ✨ НОВОЕ

        // Реферальная ссылка
        'user.referralLink': referralData?.referralLink || 'Недоступно',
        'user.referralCodeShort': referralData?.referralCode || 'Нет',
        'user.projectName': referralData?.projectName || 'Бонусная система',

        // Реферальная статистика по проекту (для блоков статистики)
        'user.referralCount': referralCount,
        'user.referralBonusTotal': referralBonusTotal,
        'user.referralBonusTotalFormatted': `${referralBonusTotal} бонусов`,

        // ✨ Phase 4: Партнёрские переменные (b2b-иерархия)
        ...partnerVariables,

        // Дополнительные переменные для удобства
        'user.hasReferralCode': profile.referralCode ? 'Да' : 'Нет',
        'user.hasTransactions': profile.transactionCount > 0 ? 'Да' : 'Нет',
        'user.hasBonuses': profile.bonusCount > 0 ? 'Да' : 'Нет',
        'user.isNewUser': profile.transactionCount === 0 ? 'Да' : 'Нет',

        // Статистика для отображения
        'user.stats': {
          balance: profile.balance,
          totalEarned: profile.totalEarned,
          totalSpent: profile.totalSpent,
          transactionCount: profile.transactionCount,
          bonusCount: profile.bonusCount
        }
      };

      // ✅ ДОБАВЛЕНО: Логирование currentLevel для диагностики
      logger.debug('user-variables currentLevel check', {
        userId: profile.userId,
        currentLevel: result['user.currentLevel'],
        currentLevelFromProfile: profile.currentLevel,
        currentLevelFromProgress: progressData.currentLevel?.name,
        nextLevel:
          progressData.nextLevel?.name || 'Максимальный уровень достигнут',
        nextLevelAmount: progressData.amountNeeded,
        progressPercent: progressData.progressPercent,
        progressBar: result['user.progressBar'],
        hasNextLevel: !!progressData.nextLevel
      });

      // ✅ Кешируем результат user variables (импорт уже выполнен выше)
      try {
        const { WorkflowRuntimeService: WRS } = await import(
          '@/lib/services/workflow-runtime.service'
        );
        await WRS.cacheUserVariables(projectId, userId, result);
      } catch (cacheError) {
        console.warn('Failed to cache user variables:', cacheError);
        // Не критично, продолжаем выполнение
      }

      console.log('✅ UserVariablesService.getUserVariables SUCCESS', {
        totalVariables: Object.keys(result).length,
        sampleVariables: {
          balanceFormatted: result['user.balanceFormatted'],
          expiringBonusesFormatted: result['user.expiringBonusesFormatted'],
          referralCount: result['user.referralCount'],
          progressPercent: result['user.progressPercent']
        },
        cached: true
      });

      return result;
    } catch (error) {
      logger.error(
        '❌ Failed to get user variables - RETURNING FALLBACK VALUES',
        {
          userId,
          projectId,
          error: error.message,
          stack: error.stack
        }
      );

      console.log(
        '❌ UserVariablesService.getUserVariables ERROR - returning fallback',
        {
          userId,
          projectId,
          errorMessage: error.message
        }
      );

      // Возвращаем базовые переменные в случае ошибки
      // ⚠️ ВАЖНО: Все переменные должны быть заполнены, даже если с дефолтными значениями
      return {
        'user.firstName': 'Пользователь',
        'user.balanceFormatted': '0 бонусов',
        'user.currentLevel': 'Базовый',
        'user.referralCode': 'Недоступно',
        'user.referralLink': 'Недоступно',
        'user.totalEarnedFormatted': '0 бонусов',
        'user.totalSpentFormatted': '0 бонусов',
        'user.totalPurchasesFormatted': '0 руб.',
        'user.expiringBonusesFormatted': '0 бонусов',
        'user.referralCount': 0,
        'user.referralBonusTotal': 0,
        'user.referralBonusTotalFormatted': '0 бонусов',
        'user.progressPercent': 0,
        'user.progressBar': '▓▓▓▓▓▓▓▓▓▓ 0%',
        'user.levelBonusPercent': 0,
        'user.levelPaymentPercent': 0,
        'user.nextLevelName': 'Максимальный уровень достигнут',
        'user.nextLevelAmountFormatted': '0 руб.',
        'transactions.formatted': '📭 История операций пуста',
        // ✨ Phase 4: Партнёрские переменные (fallback)
        'user.partnerRole': '',
        'user.canRefer': false,
        'user.directReferralsCount': 0,
        'user.indirectReferralsCount': 0,
        'user.teamSize': 0,
        'user.totalCommissionEarned': 0,
        'user.totalCommissionEarnedFormatted': '0 ₽',
        'user.commissionThisMonth': 0,
        'user.commissionThisMonthFormatted': '0 ₽'
      };
    }
  }

  /**
   * ✨ Phase 4: Считает партнёрские переменные для b2b-иерархии.
   *
   * Возвращает набор `user.partnerRole`, `user.canRefer`,
   * `user.directReferralsCount`, `user.indirectReferralsCount`, `user.teamSize`,
   * `user.totalCommissionEarned(+Formatted)`, `user.commissionThisMonth(+Formatted)`.
   *
   * Если у проекта `enablePartnerRoles = false` — возвращает дефолты без обращения
   * к тяжёлым запросам (CTE и aggregate). Не бросает исключения.
   *
   * @see Requirement 6.3
   */
  private static async computePartnerVariables(
    db: PrismaClient,
    userId: string,
    projectId: string
  ): Promise<Record<string, any>> {
    const defaults = {
      'user.partnerRole': '',
      'user.canRefer': false,
      'user.directReferralsCount': 0,
      'user.indirectReferralsCount': 0,
      'user.teamSize': 0,
      'user.totalCommissionEarned': 0,
      'user.totalCommissionEarnedFormatted': '0 ₽',
      'user.commissionThisMonth': 0,
      'user.commissionThisMonthFormatted': '0 ₽'
    };

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          partnerRole: true,
          project: { select: { enablePartnerRoles: true } }
        }
      });

      if (!user) return defaults;

      const partnerRole = user.partnerRole || 'CLIENT';
      const enabled = !!user.project?.enablePartnerRoles;

      // Когда фича выключена — возвращаем минимальный набор без тяжёлых запросов.
      if (!enabled) {
        return {
          ...defaults,
          'user.partnerRole': '' // без режима ролей семантика «не партнёр»
        };
      }

      const canRefer = partnerRole !== 'CLIENT';

      // Считаем direct + descendants и комиссии параллельно.
      const [directCount, descendants, totalAgg, monthAgg] = await Promise.all([
        db.user.count({ where: { projectId, referredBy: userId } }),
        cachedGetDescendantTree(userId, projectId),
        db.transaction.aggregate({
          where: { userId, type: 'EARN', isReferralBonus: true },
          _sum: { amount: true }
        }),
        db.transaction.aggregate({
          where: {
            userId,
            type: 'EARN',
            isReferralBonus: true,
            createdAt: { gte: this.startOfCurrentMonth() }
          },
          _sum: { amount: true }
        })
      ]);

      const teamSize = descendants.length;
      const indirectCount = Math.max(0, teamSize - directCount);
      const totalCommission = Number(totalAgg._sum.amount ?? 0);
      const monthCommission = Number(monthAgg._sum.amount ?? 0);

      return {
        'user.partnerRole': partnerRole,
        'user.canRefer': canRefer,
        'user.directReferralsCount': directCount,
        'user.indirectReferralsCount': indirectCount,
        'user.teamSize': teamSize,
        'user.totalCommissionEarned': totalCommission,
        'user.totalCommissionEarnedFormatted': this.formatRub(totalCommission),
        'user.commissionThisMonth': monthCommission,
        'user.commissionThisMonthFormatted': this.formatRub(monthCommission)
      };
    } catch (error) {
      logger.warn('computePartnerVariables failed, returning defaults', {
        userId,
        projectId,
        error: error instanceof Error ? error.message : String(error)
      });
      return defaults;
    }
  }

  /** Начало текущего месяца (UTC) — для агрегата `commissionThisMonth`. */
  private static startOfCurrentMonth(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  /** Форматирование суммы в рублях для бот-уведомлений. */
  private static formatRub(amount: number): string {
    try {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
      }).format(amount);
    } catch {
      return `${Math.round(amount)} ₽`;
    }
  }

  /**
   * Получить только основные переменные пользователя (для быстрого доступа)
   */
  static async getBasicUserVariables(
    db: PrismaClient,
    userId: string
  ): Promise<Record<string, any>> {
    try {
      const profile = await QueryExecutor.execute(db, 'get_user_profile', {
        userId
      });

      if (!profile) {
        return {};
      }

      return {
        'user.firstName': profile.firstName || 'Пользователь',
        'user.balance': profile.balance,
        'user.balanceFormatted': `${Number(profile.balance).toFixed(2)} бонусов`,
        'user.currentLevel': profile.currentLevel,
        'user.referralCode': profile.referralCode || 'Нет'
      };
    } catch (error) {
      logger.error('Failed to get basic user variables', { userId, error });
      return {};
    }
  }

  /**
   * Получить переменные для отображения истории транзакций
   */
  static async getTransactionHistoryVariables(
    db: PrismaClient,
    userId: string,
    limit: number = 10
  ): Promise<Record<string, any>> {
    try {
      const transactions = await QueryExecutor.execute(db, 'get_transactions', {
        userId,
        limit
      });

      if (!transactions || transactions.length === 0) {
        return {
          'user.transactionHistory': 'История транзакций пуста',
          'user.transactionCount': 0
        };
      }

      const formatTransaction = (t: any) => {
        const amount = Number(t.amount);
        const sign = t.type === 'EARN' ? '+' : '-';
        const date = new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date(t.createdAt));

        return `${sign}${amount} бонусов - ${t.description || 'Операция'} (${date})`;
      };

      return {
        'user.transactionHistory': transactions
          .map(formatTransaction)
          .join('\n'),
        'user.transactionCount': transactions.length,
        'user.lastTransaction': transactions[0]
          ? formatTransaction(transactions[0])
          : 'Нет'
      };
    } catch (error) {
      logger.error('Failed to get transaction history variables', {
        userId,
        error
      });
      return {};
    }
  }

  /**
   * Получить переменные для отображения реферальной информации
   */
  static async getReferralVariables(
    db: PrismaClient,
    userId: string,
    projectId: string
  ): Promise<Record<string, any>> {
    try {
      const referralData = await QueryExecutor.execute(
        db,
        'get_referral_link',
        {
          userId,
          projectId
        }
      );

      if (!referralData) {
        return {
          'user.referralCode': 'Недоступно',
          'user.referralLink': 'Недоступно',
          'user.hasReferralCode': 'Нет'
        };
      }

      return {
        'user.referralCode': referralData.referralCode,
        'user.referralLink': referralData.referralLink,
        'user.projectName': referralData.projectName,
        'user.hasReferralCode': 'Да'
      };
    } catch (error) {
      logger.error('Failed to get referral variables', { userId, error });
      return {};
    }
  }
}

export default UserVariablesService;
