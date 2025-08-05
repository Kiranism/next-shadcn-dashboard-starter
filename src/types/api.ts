/**
 * @file: api.ts
 * @description: Типы для API responses и requests
 * @project: SaaS Bonus System
 * @dependencies: base types
 * @created: 2025-01-27
 * @author: AI Assistant + User
 */

// ===== БАЗОВЫЕ API ТИПЫ =====

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: PaginationMeta;
  filters?: Record<string, any>;
  meta?: Record<string, any>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ===== ОШИБКИ API =====

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST'
  | 'FORBIDDEN'
  | 'PROJECT_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'INSUFFICIENT_BONUSES'
  | 'INVALID_TOKEN'
  | 'WEBHOOK_SECRET_INVALID';

// ===== ПРОЕКТЫ =====

export interface Project {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  bonusPercentage: number;
  bonusExpiryDays: number;
  isActive: boolean;
  webhookSecret: string;
  createdAt: Date;
  updatedAt: Date;

  // Статистика
  _count?: {
    users: number;
    bonuses: number;
    transactions: number;
  };

  // Связанные данные
  botSettings?: BotSettings;
  bonusLevels?: BonusLevel[];
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  domain?: string;
  bonusPercentage?: number;
  bonusExpiryDays?: number;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}

export interface ProjectsResponse extends ApiResponse<Project[]> {
  data: Project[];
}

export interface ProjectResponse extends ApiResponse<Project> {
  data: Project;
}

// ===== ПОЛЬЗОВАТЕЛИ =====

export interface User {
  id: string;
  projectId: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  name: string; // Computed field
  birthDate?: Date;
  registeredAt: Date;
  updatedAt: Date;

  // Telegram
  telegramId?: bigint;

  // Бонусы
  bonusBalance: number;
  totalEarned: number;
  totalSpent: number;

  // Уровень
  currentLevel?: string;
  bonusLevel?: BonusLevel;

  // Реферальная система
  referralCode?: string;
  referredById?: string;
  referredBy?: User;
  referrals?: User[];

  // UTM метки
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;

  // UI данные
  avatar?: string;
  lastActivity?: Date;
}

export interface CreateUserRequest {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referralCode?: string;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {}

export interface UsersQuery extends PaginationQuery {
  level?: string;
  minBalance?: number;
  maxBalance?: number;
  registeredAfter?: string;
  registeredBefore?: string;
  hasReferrals?: boolean;
  isActive?: boolean;
}

export interface UsersResponse extends ApiResponse<User[]> {
  data: User[];
  pagination: PaginationMeta;
  filters: Record<string, any>;
}

export interface UserResponse extends ApiResponse<User> {
  data: User;
}

export interface UserBalance {
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  expiringSoon: number;
  pendingBonuses: number;
}

// ===== БОНУСЫ =====

export interface Bonus {
  id: string;
  userId: string;
  projectId: string;
  amount: number;
  description: string;
  orderId?: string;
  type: BonusType;
  status: BonusStatus;
  expiresAt?: Date;
  awardedAt: Date;
  spentAt?: Date;

  // Связанные данные
  user?: User;
  transactions?: Transaction[];
}

export type BonusType =
  | 'PURCHASE'
  | 'REFERRAL'
  | 'MANUAL'
  | 'LEVEL_UP'
  | 'PROMOTIONAL';
export type BonusStatus = 'ACTIVE' | 'SPENT' | 'EXPIRED' | 'PENDING';

export interface BonusAction {
  userId?: string;
  userIds?: string[];
  amount: number;
  description: string;
  expiresAt?: string;
  orderId?: string;
}

export interface BulkBonusAction {
  operation: 'bulk_bonus_award' | 'bulk_bonus_deduct' | 'bulk_notification';
  userIds: string[];
  amount?: number;
  description?: string;
  message?: string;
  expiresAt?: string;
}

// ===== ТРАНЗАКЦИИ =====

export interface Transaction {
  id: string;
  userId: string;
  projectId: string;
  bonusId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  orderId?: string;
  createdAt: Date;

  // Связанные данные
  user?: User;
  bonus?: Bonus;
}

export type TransactionType =
  | 'BONUS_AWARDED'
  | 'BONUS_SPENT'
  | 'BONUS_EXPIRED'
  | 'BONUS_REFUNDED';

export interface TransactionsQuery extends PaginationQuery {
  userId?: string;
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

// ===== УРОВНИ БОНУСОВ =====

export interface BonusLevel {
  id: string;
  projectId: string;
  name: string;
  minAmount: number;
  maxAmount?: number;
  bonusPercentage: number;
  maxBonusUsage: number;
  color: string;
  description?: string;
  isDefault: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;

  // Статистика
  _count?: {
    users: number;
  };
}

export interface CreateBonusLevelRequest {
  name: string;
  minAmount: number;
  maxAmount?: number;
  bonusPercentage: number;
  maxBonusUsage?: number;
  color?: string;
  description?: string;
  isDefault?: boolean;
}

// ===== TELEGRAM BOT =====

export interface BotSettings {
  id: string;
  projectId: string;
  botToken?: string;
  botUsername?: string;
  isActive: boolean;
  webhookUrl?: string;
  lastUpdate?: Date;

  // Настройки сообщений
  messageSettings: {
    welcomeMessage?: string;
    balanceMessage?: string;
    helpMessage?: string;
    linkSuccessMessage?: string;
    linkErrorMessage?: string;
  };

  // Настройки функционала
  functionalSettings: {
    showBalance: boolean;
    showLevel: boolean;
    showReferral: boolean;
    showHistory: boolean;
    showHelp: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateBotSettingsRequest {
  botToken?: string;
  botUsername?: string;
  messageSettings?: Partial<BotSettings['messageSettings']>;
  functionalSettings?: Partial<BotSettings['functionalSettings']>;
}

export interface BotStatus {
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'NOT_CONFIGURED';
  configured: boolean;
  webhookSet: boolean;
  lastUpdate?: Date;
  message: string;
  bot?: {
    id: number;
    username: string;
    firstName: string;
  };
}

// ===== WEBHOOK =====

export interface WebhookRequest {
  action: 'register_user' | 'purchase' | 'spend_bonuses';
  email?: string;
  phone?: string;
  amount?: number;
  orderId?: string;
  description?: string;
  firstName?: string;
  lastName?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referralCode?: string;
}

export interface TildaWebhookRequest {
  name: string;
  email?: string;
  phone?: string;
  payment: {
    amount: string;
    orderid: string;
    products?: Array<{
      name: string;
      price: string;
      quantity?: string;
    }>;
  };
  utm_ref?: string;
}

export interface WebhookResponse extends ApiResponse {
  order?: {
    id: string;
    amount: number;
    products?: number;
  };
  bonus?: {
    id: string;
    amount: number;
    expiresAt?: Date;
  };
  user?: {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
    currentBalance: number;
    totalEarned: number;
  };
  levelInfo?: any;
  referralInfo?: any;
}

// ===== АНАЛИТИКА =====

export interface ProjectAnalytics {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    growthRate: number;
  };
  bonuses: {
    totalAwarded: number;
    totalSpent: number;
    currentBalance: number;
    expiringSoon: number;
    averagePerUser: number;
  };
  transactions: {
    total: number;
    thisMonth: number;
    averageAmount: number;
  };
  levels: {
    distribution: Record<string, number>;
    conversionRates: Record<string, number>;
  };
  referrals: {
    totalReferred: number;
    conversionRate: number;
    topReferrers: Array<{
      user: User;
      referralsCount: number;
    }>;
  };
  timeline: Array<{
    date: string;
    users: number;
    bonuses: number;
    transactions: number;
  }>;
}

// ===== УВЕДОМЛЕНИЯ =====

export interface NotificationRequest {
  userIds: string[];
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export interface NotificationResponse extends ApiResponse {
  data: {
    sent: number;
    failed: number;
    total: number;
  };
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ТИПЫ =====

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FilterOption extends SelectOption {
  count?: number;
}

export interface BulkOperationResult {
  successful: number;
  failed: number;
  total: number;
  results: Array<{
    userId: string;
    success: boolean;
    error?: string;
  }>;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  fields?: string[];
  filters?: Record<string, any>;
}

// ===== ТИПЫ ДЛЯ СОСТОЯНИЯ ПРИЛОЖЕНИЯ =====

export interface AppState {
  currentProject: Project | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'manager' | 'viewer';
  } | null;
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
}

export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}

// ===== ЭКСПОРТ ВСЕХ ТИПОВ =====
// Экспорты убраны, чтобы избежать конфликтов - используйте именованные импорты
