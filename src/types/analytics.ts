/**
 * @file: src/types/analytics.ts
 * @description: TypeScript типы для аналитических данных
 * @project: SaaS Bonus System
 * @dependencies: TypeScript, ReferralStats
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import type { ReferralStats } from './bonus';

export interface ProjectAnalytics {
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
    dailyActivity: DailyActivityData[];
    transactionTypes: TransactionTypeData[];
  };
  topUsers: TopUserData[];
  userLevels: UserLevelData[];
  bonusLevels: BonusLevelConfigData[];
  referralStats: ReferralStats;
}

export interface DailyActivityData {
  date: string;
  earnedTransactions: number;
  spentTransactions: number;
  earnedAmount: number;
  spentAmount: number;
}

export interface TransactionTypeData {
  type: 'EARN' | 'SPEND';
  count: number;
  amount: number;
}

export interface TopUserData {
  id: string;
  name: string;
  contact: string;
  transactionCount: number;
  totalEarned: number;
  totalSpent: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface MetricChange {
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
}

export interface UserLevelData {
  level: string;
  userCount: number;
  avgPurchases: number;
}

export interface BonusLevelConfigData {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number | null;
  bonusPercent: number;
  paymentPercent: number;
  order: number;
}
