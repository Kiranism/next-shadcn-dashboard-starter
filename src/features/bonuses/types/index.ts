export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bonusBalance: number;
  totalEarned: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BonusTransaction {
  id: string;
  userId: string;
  type: 'EARN' | 'SPEND' | 'EXPIRE' | 'ADMIN_ADJUST';
  amount: number;
  description: string;
  expiresAt?: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface BonusRule {
  id: string;
  name: string;
  type: 'PURCHASE' | 'REGISTRATION' | 'REFERRAL' | 'SPECIAL';
  amount: number;
  percentage?: number;
  minPurchase?: number;
  maxBonus?: number;
  expirationDays?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface BulkUserAction {
  userIds: string[];
  action: 'ADD_BONUS' | 'DEDUCT_BONUS' | 'SET_BALANCE' | 'SEND_NOTIFICATION';
  amount?: number;
  description: string;
  expirationDays?: number;
}

export interface BonusNotification {
  id: string;
  userId: string;
  type: 'EXPIRING_SOON' | 'EXPIRED' | 'EARNED' | 'SPENT';
  title: string;
  message: string;
  bonusAmount?: number;
  expiresAt?: Date;
  isRead: boolean;
  createdAt: Date;
}

export interface BonusStats {
  totalUsers: number;
  totalActiveBonuses: number;
  totalExpiredThisMonth: number;
  averageBalance: number;
  totalEarnedThisMonth: number;
  totalSpentThisMonth: number;
}
