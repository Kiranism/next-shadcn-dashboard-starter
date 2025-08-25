/**
 * @file: api-responses.ts
 * @description: Типы для API ответов
 * @project: SaaS Bonus System
 * @dependencies: none
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

// Базовый тип для успешного ответа
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

// Базовый тип для ошибки
export interface ApiErrorResponse {
  success: false;
  error: {
    type: string;
    message: string;
    code?: string;
    details?: unknown;
  };
}

// Объединенный тип ответа
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Типы для аналитики
export interface DailyActivity {
  date: string;
  earnedTransactions: number;
  spentTransactions: number;
  earnedAmount: number;
  spentAmount: number;
}

export interface TransactionTypeStats {
  type: string;
  count: number;
  amount: number;
}

export interface TopUser {
  id: string;
  name: string;
  contact: string;
  transactionCount: number;
  totalEarned: number;
  totalSpent: number;
}

export interface UserLevelStats {
  level: string;
  userCount: number;
  avgPurchases: number;
}

export interface BonusLevelConfig {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number | null;
  bonusPercent: number;
  paymentPercent: number;
  order: number;
}

export interface AnalyticsResponse {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalBonuses: number;
    activeBonuses: number;
    totalTransactions: number;
    newUsersLast30Days: number;
    newUsersLast7Days: number;
    transactionsLast30Days: number;
    transactionsLast7Days: number;
    expiringBonuses: {
      amount: number;
      count: number;
    };
  };
  charts: {
    dailyActivity: DailyActivity[];
    transactionTypes: TransactionTypeStats[];
  };
  topUsers: TopUser[];
  userLevels: UserLevelStats[];
  bonusLevels: BonusLevelConfig[];
  referralStats?: unknown;
}

// Типы для webhook логов
export interface WebhookLogEntry {
  id: string;
  projectId: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  response: unknown;
  status: number;
  success: boolean;
  createdAt: Date;
}