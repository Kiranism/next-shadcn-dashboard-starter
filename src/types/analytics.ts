/**
 * @file: src/types/analytics.ts
 * @description: TypeScript типы для аналитических данных
 * @project: SaaS Bonus System
 * @dependencies: TypeScript
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

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