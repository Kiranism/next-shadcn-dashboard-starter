/**
 * @file: referral.service.ts
 * @description: Сервис для работы с реферальной системой
 * @project: SaaS Bonus System
 * @dependencies: db, Prisma types, bonus types, BonusService
 * @created: 2025-01-23
 * @author: AI Assistant + User
 */

import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type {
  ReferralProgram,
  CreateReferralProgramInput,
  UpdateReferralProgramInput,
  User,
  ReferralStats,
  ReferralLevel,
  ReferralLevelInput
} from '@/types/bonus';
import { BonusService } from './user.service';
import { PartnerTeamService } from './partner-team.service';
// Crypto импорт только для server-side

type ReferralProgramEntity = Prisma.ReferralProgramGetPayload<{
  include: { project: true; levels: true };
}>;

type ReferrerNode = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  referredBy?: string | null;
};

type ReferralBonusPayout = {
  level: number;
  amount: number;
  referrerId: string;
  referrer?: Omit<ReferrerNode, 'referredBy'>;
  bonusId: string;
};

export class ReferralService {
  /**
   * Получить настройки реферальной программы проекта
   */
  static async getReferralProgram(
    projectId: string
  ): Promise<ReferralProgram | null> {
    try {
      const program = await db.referralProgram.findUnique({
        where: { projectId },
        include: {
          project: true,
          levels: {
            orderBy: { level: 'asc' }
          }
        }
      });

      return this.mapReferralProgram(program);
    } catch (error) {
      logger.error('Ошибка получения реферальной программы', {
        projectId,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'referral-service'
      });
      throw error;
    }
  }

  /**
   * Создать или обновить реферальную программу
   */
  static async createOrUpdateReferralProgram(
    input: CreateReferralProgramInput
  ): Promise<ReferralProgram> {
    try {
      const program = await db.$transaction(async (tx) => {
        const existingProgram = await tx.referralProgram.findUnique({
          where: { projectId: input.projectId },
          include: {
            project: true,
            levels: true
          }
        });

        const data = this.buildProgramData(input, existingProgram ?? undefined);

        let savedProgram: ReferralProgramEntity;

        if (existingProgram) {
          savedProgram = await tx.referralProgram.update({
            where: { projectId: input.projectId },
            data,
            include: {
              project: true,
              levels: true
            }
          });
        } else {
          savedProgram = await tx.referralProgram.create({
            data: {
              ...data,
              projectId: input.projectId
            },
            include: {
              project: true,
              levels: true
            }
          });
        }

        await this.syncReferralLevels(
          tx,
          savedProgram,
          input.levels,
          input.referrerBonus
        );

        return tx.referralProgram.findUnique({
          where: { projectId: input.projectId },
          include: {
            project: true,
            levels: { orderBy: { level: 'asc' } }
          }
        });
      });

      logger.info('Реферальная программа сохранена', {
        projectId: input.projectId,
        component: 'referral-service'
      });

      return this.mapReferralProgram(program)!;
    } catch (error) {
      logger.error('Ошибка создания/обновления реферальной программы', {
        input,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'referral-service'
      });
      throw error;
    }
  }

  /**
   * Обновить реферальную программу
   */
  static async updateReferralProgram(
    projectId: string,
    input: UpdateReferralProgramInput
  ): Promise<ReferralProgram> {
    try {
      const program = await db.$transaction(async (tx) => {
        const existingProgram = await tx.referralProgram.findUnique({
          where: { projectId },
          include: { project: true, levels: true }
        });

        if (!existingProgram) {
          throw new Error('Реферальная программа не найдена');
        }

        const data = this.buildProgramData(input, existingProgram);

        const updatedProgram = await tx.referralProgram.update({
          where: { projectId },
          data,
          include: { project: true, levels: true }
        });

        await this.syncReferralLevels(
          tx,
          updatedProgram,
          input.levels,
          input.referrerBonus
        );

        return tx.referralProgram.findUnique({
          where: { projectId },
          include: {
            project: true,
            levels: { orderBy: { level: 'asc' } }
          }
        });
      });

      logger.info('Обновлена реферальная программа', {
        projectId,
        updates: input,
        component: 'referral-service'
      });

      return this.mapReferralProgram(program)!;
    } catch (error) {
      logger.error('Ошибка обновления реферальной программы', {
        projectId,
        input,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'referral-service'
      });
      throw error;
    }
  }

  /**
   * Генерировать уникальный реферальный код для пользователя
   */
  static generateReferralCode(userId: string): string {
    // Создаём короткий уникальный код на основе userId
    if (typeof window === 'undefined') {
      // Server-side
      const { createHash } = require('crypto');
      const hash = createHash('md5').update(userId).digest('hex');
      return hash.substring(0, 8).toUpperCase();
    } else {
      // Client-side fallback
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
  }

  /**
   * Установить реферальный код пользователю (если его нет)
   */
  static async ensureUserReferralCode(userId: string): Promise<string> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, referralCode: true }
      });

      if (!user) {
        throw new Error('Пользователь не найден');
      }

      if (user.referralCode) {
        return user.referralCode;
      }

      // Генерируем и сохраняем новый код
      const referralCode = this.generateReferralCode(userId);

      await db.user.update({
        where: { id: userId },
        data: { referralCode }
      });

      logger.info('Создан реферальный код пользователя', {
        userId,
        referralCode,
        component: 'referral-service'
      });

      return referralCode;
    } catch (error) {
      logger.error('Ошибка создания реферального кода', {
        userId,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'referral-service'
      });
      throw error;
    }
  }

  /**
   * Найти рефера ТОЛЬКО по utm_ref (ID пользователя).
   *
   * Когда у проекта включён `enablePartnerRoles`, реферером может быть
   * только пользователь с `partnerRole IN (TRAINER, MANAGER, DIRECTOR)`.
   * При `enablePartnerRoles = false` поведение совпадает с прежней c2c-логикой.
   *
   * Если в b2b-режиме как `utm_ref` приходит существующий CLIENT — пишем
   * `logger.warn`, чтобы администратор проекта мог увидеть такие попытки
   * (например, клиент случайно скопировал собственную UTM-метку).
   *
   * @see B2B Referral Hierarchy → Requirements 2.1, 2.2
   */
  static async findReferrer(
    projectId: string,
    utmRef?: string
  ): Promise<User | null> {
    try {
      if (!utmRef) return null;

      // Читаем флаг проекта, чтобы решить, нужно ли применять role-фильтр
      const project = await db.project.findUnique({
        where: { id: projectId },
        select: { enablePartnerRoles: true }
      });

      // Один запрос без role-фильтра — нужно отличить «CLIENT отсёкся» от
      // «такого пользователя нет» для корректного предупреждения в логе.
      const user = await db.user.findFirst({
        where: {
          projectId,
          id: utmRef,
          isActive: true
        }
      });

      if (!user) {
        // Пользователь не существует / неактивен — без warning, обычный кейс.
        return null;
      }

      // В b2b-режиме CLIENT не может выступать реферером.
      if (project?.enablePartnerRoles && user.partnerRole === 'CLIENT') {
        logger.warn('Referrer not found or has CLIENT role', {
          projectId,
          utmRef,
          reason: 'client_role_excluded',
          component: 'referral-service'
        });
        return null;
      }

      return {
        ...user,
        totalPurchases: Number(user.totalPurchases)
      };
    } catch (error) {
      logger.error('Ошибка поиска рефера', {
        projectId,
        utmRef,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'referral-service'
      });
      return null; // Не выбрасываем ошибку, так как рефер может не существовать
    }
  }

  /**
   * Обработать реферальное начисление при покупке
   */
  static async processReferralBonus(
    userId: string,
    purchaseAmount: number
  ): Promise<{
    bonusAwarded: boolean;
    totalBonus?: number;
    payouts?: ReferralBonusPayout[];
  }> {
    try {
      // Получаем пользователя и проект
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          project: true,
          referralAttribution: {
            include: {
              commissionPlan: {
                include: {
                  levels: { orderBy: { level: 'asc' } }
                }
              }
            }
          }
        }
      });

      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // Получаем настройки реферальной программы
      const referralProgram = await this.getReferralProgram(user.projectId);

      if (!referralProgram || !referralProgram.isActive) {
        return { bonusAwarded: false };
      }

      if (referralProgram.minPurchaseAmount > 0) {
        const minAmount = Number(referralProgram.minPurchaseAmount);
        if (purchaseAmount < minAmount) {
          return { bonusAwarded: false };
        }
      }

      if (!user.referredBy) {
        return { bonusAwarded: false };
      }

      let levelMap = new Map<number, number>();
      let maxPayoutDepth = 3;

      const projectRow = user.project as {
        referralPlansEnabled?: boolean;
      } | null;
      const attribution = user.referralAttribution;
      const useCommissionPlan =
        Boolean(projectRow?.referralPlansEnabled) &&
        Boolean(attribution?.commissionPlan?.levels?.length);

      if (useCommissionPlan && attribution?.commissionPlan) {
        const plan = attribution.commissionPlan;
        maxPayoutDepth = Math.min(Math.max(1, plan.maxPayoutDepth), 10);
        plan.levels
          .filter(
            (level) =>
              level.level >= 1 &&
              level.level <= maxPayoutDepth &&
              level.isActive &&
              Number(level.percent) > 0
          )
          .forEach((level) => {
            levelMap.set(level.level, Number(level.percent));
          });
      } else {
        (referralProgram.levels || [])
          .filter(
            (level) =>
              level.level >= 1 &&
              level.level <= 3 &&
              level.isActive &&
              Number(level.percent) > 0
          )
          .forEach((level) => {
            levelMap.set(level.level, Number(level.percent));
          });
      }

      if (!levelMap.size && referralProgram.referrerBonus > 0) {
        levelMap.set(1, referralProgram.referrerBonus);
      }

      if (!levelMap.size) {
        return { bonusAwarded: false };
      }

      const chainDepth = Math.min(
        maxPayoutDepth,
        levelMap.size || maxPayoutDepth
      );

      const projectFlags = await db.project.findUnique({
        where: { id: user.projectId },
        select: { enablePartnerRoles: true }
      });

      const chain = projectFlags?.enablePartnerRoles
        ? await PartnerTeamService.resolvePayoutChain(
            user.referredBy,
            user.projectId,
            chainDepth
          )
        : await this.resolveReferrerChain(
            user.referredBy,
            user.projectId,
            chainDepth
          );

      if (!chain.length) {
        return { bonusAwarded: false };
      }

      const payouts: ReferralBonusPayout[] = [];

      for (let index = 0; index < chain.length; index++) {
        const referrer = chain[index];
        const level = index + 1;
        const percent =
          levelMap.get(level) ??
          (level === 1 ? referralProgram.referrerBonus : 0);

        if (!percent || percent <= 0) continue;

        const bonusAmount = (purchaseAmount * percent) / 100;

        if (bonusAmount <= 0) continue;

        const bonus = await BonusService.awardBonus({
          userId: referrer.id,
          amount: bonusAmount,
          type: 'REFERRAL',
          description: `Реферальный бонус ${level}-го уровня за покупку пользователя ${
            user.firstName || user.lastName
              ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
              : user.email || user.phone || user.id
          }`,
          metadata: {
            source: 'referral_bonus',
            referredUserId: userId,
            referralLevel: level,
            purchaseAmount,
            ...(user.referralAttribution?.commissionPlanId && {
              referralCommissionPlanId:
                user.referralAttribution.commissionPlanId
            })
          },
          referralLevel: level,
          isReferralBonus: true,
          referralUserId: userId
        });

        const { referredBy, ...referrerDetails } = referrer;

        payouts.push({
          level,
          amount: bonusAmount,
          referrerId: referrer.id,
          referrer: referrerDetails,
          bonusId: bonus.id
        });
      }

      if (!payouts.length) {
        return { bonusAwarded: false };
      }

      const totalBonus = payouts.reduce((sum, entry) => sum + entry.amount, 0);

      logger.info('Начислены многоуровневые реферальные бонусы', {
        userId,
        purchaseAmount,
        totalBonus,
        payouts: payouts.map((p) => ({
          level: p.level,
          amount: p.amount,
          referrerId: p.referrerId
        })),
        component: 'referral-service'
      });

      return {
        bonusAwarded: true,
        totalBonus,
        payouts
      };
    } catch (error) {
      logger.error('Ошибка обработки реферального бонуса', {
        userId,
        purchaseAmount,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'referral-service'
      });
      // Не выбрасываем ошибку, чтобы не сломать основную покупку
      return { bonusAwarded: false };
    }
  }

  /**
   * Получить реферальную статистику конкретного пользователя
   * ✅ НОВОЕ: Возвращает статистику пользователя, а не всего проекта
   */
  static async getUserReferralStats(
    userId: string,
    projectId: string
  ): Promise<{
    referralCount: number;
    referralBonusTotal: number;
  }> {
    try {
      logger.debug('Getting user referral stats', { userId, projectId });

      // Количество рефералов пользователя
      const referralCount = await db.user.count({
        where: {
          referredBy: userId,
          projectId: projectId,
          isActive: true
        }
      });

      // Сумма реферальных бонусов, полученных пользователем
      const referralBonusesResult = await db.transaction.aggregate({
        where: {
          userId: userId,
          isReferralBonus: true,
          type: 'EARN'
        },
        _sum: { amount: true }
      });

      const referralBonusTotal = Number(referralBonusesResult._sum.amount || 0);

      logger.debug('User referral stats calculated', {
        userId,
        referralCount,
        referralBonusTotal
      });

      return {
        referralCount,
        referralBonusTotal
      };
    } catch (error) {
      logger.error('Error getting user referral stats', {
        userId,
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        referralCount: 0,
        referralBonusTotal: 0
      };
    }
  }

  /**
   * Получить статистику реферальной программы (для всего проекта)
   */
  static async getReferralStats(projectId: string): Promise<ReferralStats> {
    try {
      // Общая статистика
      const totalReferrals = await db.user.count({
        where: {
          projectId,
          referredBy: { not: null },
          isActive: true
        }
      });

      const activeReferrals = await db.user.count({
        where: {
          projectId,
          referredBy: { not: null },
          isActive: true,
          totalPurchases: { gt: 0 }
        }
      });

      // Общая сумма реферальных бонусов
      const referralBonusesSum = await db.transaction.aggregate({
        where: {
          user: { projectId },
          isReferralBonus: true,
          type: 'EARN'
        },
        _sum: { amount: true }
      });

      const totalReferralBonuses = Number(referralBonusesSum._sum.amount || 0);

      // Метрики за последние 30 дней
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [periodReferralsCount, periodBonusSum] = await Promise.all([
        db.user.count({
          where: {
            projectId,
            referredBy: { not: null },
            isActive: true,
            registeredAt: { gte: since }
          }
        }),
        db.transaction.aggregate({
          where: {
            user: { projectId },
            isReferralBonus: true,
            type: 'EARN',
            createdAt: { gte: since }
          },
          _sum: { amount: true }
        })
      ]);

      const periodBonusPaid = Number(periodBonusSum._sum.amount || 0);

      // Средний чек по проекту за период — по EARN из покупок (MANUAL/REFERRAL не учитываем)
      const earmsForAvg = await db.transaction.findMany({
        where: {
          user: { projectId },
          type: 'EARN',
          isReferralBonus: false,
          createdAt: { gte: since }
        },
        select: { amount: true }
      });
      const averageOrderValue =
        earmsForAvg.length > 0
          ? earmsForAvg.reduce((s: number, t: any) => s + Number(t.amount), 0) /
            earmsForAvg.length
          : 0;

      // Топ рефереров
      const topReferrersRaw = await db.user.findMany({
        where: {
          projectId,
          referrals: { some: {} }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          referralCode: true,
          _count: { select: { referrals: true } },
          transactions: {
            where: { isReferralBonus: true, type: 'EARN' },
            select: { amount: true }
          }
        },
        orderBy: {
          referrals: { _count: 'desc' }
        },
        take: 10
      });

      const topReferrers = topReferrersRaw.map((user: any) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        referralCount: user._count.referrals,
        totalBonus: user.transactions.reduce(
          (sum: number, t: { amount: unknown }) =>
            sum + Number((t as any).amount),
          0
        )
      }));

      const levelBreakdownRaw = await db.transaction.groupBy({
        by: ['referralLevel'],
        where: {
          user: { projectId },
          isReferralBonus: true,
          type: 'EARN',
          referralLevel: { not: null }
        },
        _sum: { amount: true },
        _count: { _all: true }
      });

      const levelBreakdown = levelBreakdownRaw
        .filter(
          (row) =>
            typeof row.referralLevel === 'number' && row.referralLevel !== null
        )
        .map((row) => ({
          level: Number(row.referralLevel),
          totalBonus: Number(row._sum.amount || 0),
          payouts: Number(row._count._all || 0)
        }))
        .sort((a, b) => a.level - b.level);

      // UTM источники (по пользователям с referredBy)
      const utmGrouped = await db.user.groupBy({
        by: ['utmSource', 'utmMedium', 'utmCampaign'],
        where: { projectId, referredBy: { not: null } },
        _count: { _all: true }
      });

      const utmSources = utmGrouped.map((g: any) => ({
        utm_source: g.utmSource,
        utm_medium: g.utmMedium,
        utm_campaign: g.utmCampaign,
        count: Number(g._count?._all || 0)
      }));

      return {
        totalReferrals,
        periodReferrals: periodReferralsCount,
        activeReferrers: activeReferrals,
        totalBonusPaid: totalReferralBonuses,
        periodBonusPaid,
        averageOrderValue,
        topReferrers,
        utmSources,
        levelBreakdown
      };
    } catch (error) {
      logger.error('Ошибка получения статистики реферальной программы', {
        projectId,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'referral-service'
      });
      throw error;
    }
  }

  /**
   * Генерировать реферальную ссылку для пользователя.
   *
   * Когда у проекта включён `enablePartnerRoles`, ссылка доступна только
   * партнёрам (`partnerRole IN (TRAINER, MANAGER, DIRECTOR)`). Для CLIENT
   * метод бросает ошибку. При `enablePartnerRoles = false` поведение
   * совпадает с прежней c2c-логикой.
   *
   * @see B2B Referral Hierarchy → Requirement 2.4
   */
  static async generateReferralLink(
    userId: string,
    baseUrl: string,
    additionalParams?: Record<string, string>
  ): Promise<string> {
    try {
      // Проверяем роль пользователя в рамках b2b-режима
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          partnerRole: true,
          organizationId: true,
          organization: { select: { slug: true, isActive: true } },
          project: { select: { enablePartnerRoles: true } }
        }
      });

      if (user?.project?.enablePartnerRoles && user.partnerRole === 'CLIENT') {
        throw new Error('Реферальная ссылка доступна только партнёрам');
      }

      let base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      // Добавляем протокол если его нет
      if (!base.startsWith('http://') && !base.startsWith('https://')) {
        base = `https://${base}`;
      }
      const url = new URL(base);
      // Новая схема: utm_ref с userId (+ utm_org для мульти-сетей)
      url.searchParams.set('utm_ref', userId);
      if (user?.organization?.isActive && user.organization.slug) {
        url.searchParams.set('utm_org', user.organization.slug);
      }

      // Добавляем дополнительные параметры
      if (additionalParams) {
        Object.entries(additionalParams).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
      }

      return url.toString();
    } catch (error) {
      logger.error('Ошибка генерации реферальной ссылки', {
        userId,
        baseUrl,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        component: 'referral-service'
      });
      throw error;
    }
  }

  private static async resolveReferrerChain(
    startReferrerId: string | null,
    projectId: string,
    depth: number
  ): Promise<ReferrerNode[]> {
    const chain: ReferrerNode[] = [];
    const visited = new Set<string>();
    let currentId = startReferrerId;

    while (currentId && chain.length < depth && !visited.has(currentId)) {
      const referrer = await db.user.findFirst({
        where: { id: currentId, projectId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          referredBy: true
        }
      });

      if (!referrer) {
        break;
      }

      chain.push(referrer);
      visited.add(currentId);
      currentId = referrer.referredBy || null;
    }

    return chain;
  }

  private static buildProgramData(
    input: Partial<CreateReferralProgramInput & UpdateReferralProgramInput> & {
      projectId?: string;
    },
    existing?: ReferralProgramEntity
  ) {
    const toDecimal = (
      value: number | undefined,
      fallback?: Prisma.Decimal | number,
      defaultValue = 0
    ) =>
      new Prisma.Decimal(
        value !== undefined
          ? value
          : fallback !== undefined
            ? Number(fallback)
            : defaultValue
      );

    return {
      isActive: input.isActive ?? existing?.isActive ?? true,
      bonusPercent:
        input.refereeBonus !== undefined
          ? Number(input.refereeBonus)
          : (existing?.bonusPercent ?? 0),
      referrerBonus: toDecimal(input.referrerBonus, existing?.referrerBonus, 0),
      minPurchaseAmount: toDecimal(
        input.minPurchaseAmount,
        existing?.minPurchaseAmount,
        0
      ),
      cookieLifetime:
        input.cookieLifetime !== undefined
          ? input.cookieLifetime
          : (existing?.cookieLifetime ?? 30),
      welcomeBonus: toDecimal(input.welcomeBonus, existing?.welcomeBonus, 0),
      welcomeRewardType:
        input.welcomeRewardType ?? existing?.welcomeRewardType ?? 'BONUS',
      firstPurchaseDiscountPercent:
        input.firstPurchaseDiscountPercent ??
        existing?.firstPurchaseDiscountPercent ??
        0,
      description:
        input.description !== undefined
          ? input.description
          : (existing?.description ?? null)
    };
  }

  private static async syncReferralLevels(
    tx: Prisma.TransactionClient,
    program: ReferralProgramEntity,
    levels?: ReferralLevelInput[],
    fallbackPercent = 0
  ) {
    let preparedLevels =
      levels && levels.length ? this.prepareLevels(levels) : null;

    if (!preparedLevels) {
      const existingCount = await tx.referralLevel.count({
        where: { projectId: program.projectId }
      });

      if (existingCount > 0) {
        return;
      }

      preparedLevels = this.prepareLevels(
        this.getDefaultLevels(
          fallbackPercent || Number(program.referrerBonus) || 0
        )
      );
    }

    await tx.referralLevel.deleteMany({
      where: { projectId: program.projectId }
    });

    if (!preparedLevels.length) {
      return;
    }

    await tx.referralLevel.createMany({
      data: preparedLevels.map((level, index) => ({
        projectId: program.projectId,
        referralProgramId: program.id,
        level: level.level,
        percent: new Prisma.Decimal(level.percent),
        isActive: level.isActive ?? level.percent > 0,
        order: index
      }))
    });
  }

  private static prepareLevels(
    levels: ReferralLevelInput[]
  ): ReferralLevelInput[] {
    const byLevel = new Map<number, ReferralLevelInput>();

    levels.forEach((lvl) => {
      const level = Math.min(Math.max(Math.trunc(lvl.level), 1), 3);
      byLevel.set(level, {
        level,
        percent: Math.max(0, Number(lvl.percent ?? 0)),
        isActive:
          lvl.isActive !== undefined
            ? lvl.isActive
            : Number(lvl.percent ?? 0) > 0
      });
    });

    const ordered = Array.from(byLevel.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, value]) => value);

    return ordered.slice(0, 3);
  }

  private static getDefaultLevels(basePercent: number): ReferralLevelInput[] {
    return [
      { level: 1, percent: basePercent, isActive: basePercent > 0 },
      { level: 2, percent: 0, isActive: false },
      { level: 3, percent: 0, isActive: false }
    ];
  }

  private static mapReferralProgram(
    program: ReferralProgramEntity | null
  ): ReferralProgram | null {
    if (!program) return null;

    const levels: ReferralLevel[] = (program.levels || [])
      .map((level) => ({
        id: level.id,
        projectId: level.projectId,
        referralProgramId: level.referralProgramId,
        level: level.level,
        percent: Number(level.percent),
        isActive: level.isActive,
        order: level.order,
        createdAt: level.createdAt,
        updatedAt: level.updatedAt
      }))
      .sort((a, b) => a.level - b.level);

    return {
      id: program.id,
      projectId: program.projectId,
      isActive: program.isActive,
      referrerBonus: Number(program.referrerBonus),
      refereeBonus: Number(program.bonusPercent),
      minPurchaseAmount: Number(program.minPurchaseAmount),
      cookieLifetime: program.cookieLifetime,
      welcomeBonus: Number(program.welcomeBonus),
      welcomeRewardType: program.welcomeRewardType as 'BONUS' | 'DISCOUNT',
      firstPurchaseDiscountPercent: program.firstPurchaseDiscountPercent,
      description: program.description,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
      project: program.project
        ? {
            ...program.project,
            bonusPercentage: Number(program.project.bonusPercentage),
            welcomeBonus: Number(program.project.welcomeBonus),
            firstPurchaseDiscountPercent: Number(
              program.project.firstPurchaseDiscountPercent
            )
          }
        : undefined,
      levels
    };
  }
}
