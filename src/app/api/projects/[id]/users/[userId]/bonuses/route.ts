/**
 * @file: src/app/api/projects/[id]/users/[userId]/bonuses/route.ts
 * @description: API для управления бонусами пользователя
 * @project: SaaS Bonus System
 * @dependencies: Next.js API Routes, UserService
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService, BonusService } from '@/lib/services/user.service';
import { db } from '@/lib/db';
import { withApiRateLimit } from '@/lib';
import { requireProjectAccess } from '@/lib/with-project-access';

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: projectId, userId } = await params;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;
    const body = await request.json();

    const { amount, type, description } = body;

    // Валидация
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Сумма должна быть больше 0' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Тип бонуса обязателен' },
        { status: 400 }
      );
    }

    // Проверяем существование пользователя в проекте
    const user = await db.user.findFirst({
      where: {
        id: userId,
        projectId: projectId
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден в данном проекте' },
        { status: 404 }
      );
    }

    // Начисляем бонусы через BonusService
    const bonus = await BonusService.awardBonus({
      userId,
      amount,
      type,
      description: description || 'Ручное начисление через админ-панель'
    });

    // Конвертируем BigInt в строки для JSON serialization
    const serializedBonus = {
      ...bonus,
      id: bonus.id,
      userId: bonus.userId,
      amount: bonus.amount.toString(),
      type: bonus.type,
      description: bonus.description,
      expiresAt: bonus.expiresAt ? bonus.expiresAt.toISOString() : null,
      isUsed: bonus.isUsed,
      createdAt: bonus.createdAt.toISOString(),
      user: bonus.user
        ? {
            ...bonus.user,
            id: bonus.user.id,
            projectId: bonus.user.projectId,
            totalPurchases: bonus.user.totalPurchases
              ? bonus.user.totalPurchases.toString()
              : '0',
            currentLevel: bonus.user.currentLevel,
            registeredAt: bonus.user.registeredAt.toISOString(),
            updatedAt: bonus.user.updatedAt.toISOString(),
            // Другие поля без BigInt
            email: bonus.user.email,
            phone: bonus.user.phone,
            firstName: bonus.user.firstName,
            lastName: bonus.user.lastName,
            birthDate: bonus.user.birthDate
              ? bonus.user.birthDate.toISOString()
              : null,
            telegramId: bonus.user.telegramId
              ? bonus.user.telegramId.toString()
              : null, // BigInt
            telegramUsername: bonus.user.telegramUsername,
            isActive: bonus.user.isActive,
            referredBy: bonus.user.referredBy,
            referralCode: bonus.user.referralCode,
            utmSource: bonus.user.utmSource,
            utmMedium: bonus.user.utmMedium,
            utmCampaign: bonus.user.utmCampaign,
            utmContent: bonus.user.utmContent,
            utmTerm: bonus.user.utmTerm
          }
        : undefined,
      transactions:
        bonus.transactions?.map((t) => ({
          ...t,
          id: t.id,
          userId: t.userId,
          bonusId: t.bonusId,
          amount: t.amount.toString(),
          type: t.type,
          description: t.description,
          metadata: t.metadata,
          createdAt: t.createdAt.toISOString(),
          userLevel: t.userLevel,
          appliedPercent: t.appliedPercent,
          isReferralBonus: t.isReferralBonus,
          referralUserId: t.referralUserId
        })) || []
    };

    return NextResponse.json(serializedBonus, { status: 201 });
  } catch (error) {
    console.error('Ошибка начисления бонусов:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: projectId, userId } = await params;

    const access = await requireProjectAccess(params);
    if (access instanceof NextResponse) return access;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const aggregate = searchParams.get('aggregate') !== 'false';

    // Проверяем существование пользователя в проекте
    const user = await db.user.findFirst({
      where: {
        id: userId,
        projectId: projectId
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден в данном проекте' },
        { status: 404 }
      );
    }

    // Если есть параметры пагинации - возвращаем историю транзакций
    if (searchParams.has('page') || searchParams.has('limit')) {
      const { transactions, total } = await UserService.getUserTransactions(
        userId,
        page,
        limit
      );

      // Сериализуем BigInt поля в транзакциях
      const serializedTransactions = transactions.map((t) => ({
        ...t,
        amount: t.amount.toString(),
        // Дополнительная сериализация вложенных объектов, если они содержат BigInt
        user: t.user
          ? {
              ...t.user,
              totalPurchases: t.user.totalPurchases
                ? t.user.totalPurchases.toString()
                : '0',
              telegramId: t.user.telegramId
                ? t.user.telegramId.toString()
                : null
            }
          : undefined,
        bonus: t.bonus
          ? {
              ...t.bonus,
              amount: t.bonus.amount.toString()
            }
          : undefined
      }));

      const { aggregatedTransactions, aggregatedTotal } = aggregate
        ? aggregateTransactionsForResponse(serializedTransactions)
        : {
            aggregatedTransactions: serializedTransactions,
            aggregatedTotal: serializedTransactions.length
          };

      return NextResponse.json({
        transactions: aggregatedTransactions,
        total: aggregatedTotal,
        originalTotal: total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
        aggregated: aggregate,
        pageAggregatedTotal: aggregatedTotal
      });
    }

    // Иначе возвращаем только баланс (для обратной совместимости)
    const balance = await UserService.getUserBalance(userId);

    // Сериализуем BigInt поля в балансе
    const serializedBalance = {
      ...balance,
      currentBalance: balance.currentBalance.toString(),
      totalEarned: balance.totalEarned.toString(),
      totalSpent: balance.totalSpent.toString(),
      expiringSoon: balance.expiringSoon.toString()
    };

    return NextResponse.json(serializedBalance);
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export const POST = withApiRateLimit(postHandler);
export const GET = withApiRateLimit(getHandler);

type SerializedTransaction = {
  id: string;
  userId: string;
  bonusId?: string | null;
  amount: string;
  type: string;
  description?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string | Date;
  user?: Record<string, unknown> | undefined;
  bonus?: Record<string, unknown> | undefined;
};

type AggregatedSerializedTransaction = SerializedTransaction & {
  aggregated?: boolean;
  aggregatedTransactionIds?: string[];
  aggregatedTransactions?: SerializedTransaction[];
};

function aggregateTransactionsForResponse(
  transactions: SerializedTransaction[]
) {
  const spendGroups = new Map<
    string,
    {
      items: SerializedTransaction[];
    }
  >();

  transactions.forEach((transaction, index) => {
    if (transaction.type !== 'SPEND') return;

    const metadata = transaction.metadata;
    if (!metadata || typeof metadata !== 'object') return;

    const batchId =
      metadata.spendBatchId ||
      metadata.spend_batch_id ||
      metadata.spendbatchid ||
      metadata.spend_batchId;

    if (!batchId || typeof batchId !== 'string') return;

    if (!spendGroups.has(batchId)) {
      spendGroups.set(batchId, { items: [] });
    }

    spendGroups.get(batchId)!.items.push(transaction);
  });

  if (spendGroups.size === 0) {
    return {
      aggregatedTransactions: transactions,
      aggregatedTotal: transactions.length
    };
  }

  const processedBatchIds = new Set<string>();
  const aggregatedResult: AggregatedSerializedTransaction[] = [];

  transactions.forEach((transaction) => {
    if (transaction.type !== 'SPEND') {
      aggregatedResult.push(transaction);
      return;
    }

    const metadata = transaction.metadata;
    const batchId =
      metadata?.spendBatchId ||
      metadata?.spend_batch_id ||
      metadata?.spendbatchid ||
      metadata?.spend_batchId;

    if (!batchId || typeof batchId !== 'string') {
      aggregatedResult.push(transaction);
      return;
    }

    if (processedBatchIds.has(batchId)) {
      return;
    }

    const group = spendGroups.get(batchId);
    if (!group) {
      aggregatedResult.push(transaction);
      return;
    }

    processedBatchIds.add(batchId);

    if (group.items.length === 1) {
      aggregatedResult.push(group.items[0]);
      return;
    }

    const baseTransaction = { ...group.items[0] };
    const totalAmount = group.items.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const aggregatedMetadata = {
      ...(typeof baseTransaction.metadata === 'object'
        ? baseTransaction.metadata || {}
        : {}),
      spendBatchId: batchId,
      spendBatchOriginalTransactionIds: group.items.map((item) => item.id),
      spendBatchOriginalAmounts: group.items.map((item) => item.amount),
      spendAggregatedCount: group.items.length,
      spendAggregatedAmount: totalAmount
    };

    const aggregatedTransaction: AggregatedSerializedTransaction = {
      ...baseTransaction,
      id: `batch-${batchId}`,
      amount: totalAmount.toFixed(2),
      metadata: aggregatedMetadata,
      description:
        baseTransaction.description || 'Агрегированное списание бонусов',
      aggregated: true,
      aggregatedTransactionIds: group.items.map((item) => item.id),
      aggregatedTransactions: group.items
    };

    aggregatedResult.push(aggregatedTransaction);
  });

  return {
    aggregatedTransactions: aggregatedResult,
    aggregatedTotal: aggregatedResult.length
  };
}
