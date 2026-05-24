export interface DisplayUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bonusBalance: number;
  totalEarned: number;
  createdAt: Date;
  updatedAt: Date;
  firstName?: string;
  lastName?: string;
  telegramId?: string;
  telegramUsername?: string;
  isActive?: boolean;
  currentLevel?: string;
  referralCode?: string;
  referredBy?: string;
  totalPurchases?: number;
  projectId?: string;
  birthDate?: Date | null;
  registeredAt?: Date;
  /** Партнёрская роль (b2b-referral-hierarchy). По умолчанию `CLIENT`. */
  partnerRole?: 'CLIENT' | 'TRAINER' | 'MANAGER' | 'DIRECTOR';
  /** Outbound-план комиссий, который применяется к приглашённым этим партнёром. */
  outboundReferralPlanId?: string | null;
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
