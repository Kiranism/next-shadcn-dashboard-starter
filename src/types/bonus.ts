// Основные типы для бонусной системы
export interface Project {
  id: string;
  name: string;
  domain?: string | null;
  webhookSecret: string;
  bonusPercentage: number;
  bonusExpiryDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  botSettings?: BotSettings | null;
  users?: User[];
  webhookLogs?: WebhookLog[];
  _count?: {
    users: number;
  };
}

export interface BotSettings {
  id: string;
  projectId: string;
  botToken: string;
  botUsername: string | null;
  isActive: boolean;
  welcomeMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
}

export interface User {
  id: string;
  projectId: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: Date | null;
  telegramId?: bigint | null;
  telegramUsername?: string | null;
  isActive: boolean;
  registeredAt: Date;
  updatedAt: Date;
  project?: Project;
  bonuses?: Bonus[];
  transactions?: Transaction[];
}

export interface Bonus {
  id: string;
  userId: string;
  amount: number;
  type: BonusType;
  description?: string | null;
  expiresAt?: Date | null;
  isUsed: boolean;
  createdAt: Date;
  user?: User;
  transactions?: Transaction[];
}

export interface Transaction {
  id: string;
  userId: string;
  bonusId?: string | null;
  amount: number;
  type: TransactionType;
  description?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  user?: User;
  bonus?: Bonus | null;
}

export interface WebhookLog {
  id: string;
  projectId: string;
  endpoint: string;
  method: string;
  headers?: Record<string, any>;
  body?: Record<string, any>;
  response?: Record<string, any>;
  status: number;
  success: boolean;
  createdAt: Date;
  project?: Project;
}

// Enums
export type BonusType = 'PURCHASE' | 'BIRTHDAY' | 'MANUAL' | 'REFERRAL' | 'PROMO';
export type TransactionType = 'EARN' | 'SPEND' | 'EXPIRE' | 'REFUND';

// Типы для API
export interface CreateProjectInput {
  name: string;
  domain?: string;
  bonusPercentage?: number;
  bonusExpiryDays?: number;
}

export interface UpdateProjectInput {
  name?: string;
  domain?: string;
  bonusPercentage?: number;
  bonusExpiryDays?: number;
  isActive?: boolean;
}

export interface CreateUserInput {
  projectId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
}

export interface CreateBonusInput {
  userId: string;
  amount: number;
  type: BonusType;
  description?: string;
  expiresAt?: Date;
}

export interface CreateTransactionInput {
  userId: string;
  bonusId?: string;
  amount: number;
  type: TransactionType;
  description?: string;
  metadata?: Record<string, any>;
}

// Webhook типы
export interface WebhookRegisterUserPayload {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
}

export interface WebhookPurchasePayload {
  userEmail?: string;
  userPhone?: string;
  purchaseAmount: number;
  orderId: string;
  description?: string;
}

export interface WebhookSpendBonusesPayload {
  userEmail?: string;
  userPhone?: string;
  bonusAmount: number;
  orderId: string;
  description?: string;
}

// Telegram Bot типы
export interface TelegramUserContext {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  projectId?: string;
}

// Dashboard типы для статистики
export interface ProjectStats {
  totalUsers: number;
  totalBonuses: number;
  totalTransactions: number;
  activeBonuses: number;
  expiredBonuses: number;
  spentBonuses: number;
}

export interface UserBalance {
  totalEarned: number;
  totalSpent: number;
  currentBalance: number;
  expiringSoon: number; // бонусы, которые истекают в течение 30 дней
} 