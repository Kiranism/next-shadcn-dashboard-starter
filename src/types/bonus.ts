// Основные типы для бонусной системы
export interface Project {
  id: string;
  name: string;
  domain?: string | null;
  webhookSecret: string;
  bonusPercentage: number;
  bonusExpiryDays: number;
  bonusMode?: 'SIMPLE' | 'LEVELS'; // ✨ НОВОЕ: Режим начисления бонусов
  // bonusBehavior: 'SPEND_AND_EARN' | 'SPEND_ONLY' | 'EARN_ONLY';
  operationMode?: 'WITH_BOT' | 'WITHOUT_BOT';
  /** B2B иерархия партнёров (b2b-referral-hierarchy Phase 1). Опт-ин per project. */
  enablePartnerRoles?: boolean;
  welcomeBonus: number;
  welcomeRewardType: WelcomeRewardType;
  firstPurchaseDiscountPercent: number;
  maxPaymentPercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Мультитенантность
  ownerId?: string | null;

  // Настройки бота (самостоятельная настройка владельцем)
  botToken?: string | null;
  botUsername?: string | null;
  botStatus: BotStatus;

  // Связи
  botSettings?: BotSettings | null; // Deprecated, для совместимости
  users?: User[];
  webhookLogs?: WebhookLog[];
  bonusLevels?: BonusLevel[];
  referralProgram?: ReferralProgram | null;
  referralLevels?: ReferralLevel[];
  owner?: {
    id: string;
    email: string;
  };

  _count?: {
    users: number;
    bonusLevels: number;
  };
}

// Уровни бонусной программы
export interface BonusLevel {
  id: string;
  projectId: string;
  name: string; // "Базовый", "Серебряный", "Золотой"
  minAmount: number;
  maxAmount?: number | null; // null для последнего уровня
  bonusPercent: number; // 5, 7, 10
  paymentPercent: number; // 10, 15, 20
  order: number; // Порядок сортировки
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
}

// Тип приветственного вознаграждения
export type WelcomeRewardType = 'BONUS' | 'DISCOUNT';

// Реферальная программа
export interface ReferralProgram {
  id: string;
  projectId: string;
  isActive: boolean;
  referrerBonus: number; // % бонуса рефереру от покупки
  refereeBonus: number; // % бонуса новому пользователю от покупки
  minPurchaseAmount: number; // минимальная сумма покупки для начисления бонусов
  cookieLifetime: number; // время жизни cookie в днях
  welcomeBonus: number; // фиксированный бонус при регистрации
  welcomeRewardType: WelcomeRewardType; // тип приветственного вознаграждения
  firstPurchaseDiscountPercent: number; // % скидки на первую покупку (если тип DISCOUNT)
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  levels?: ReferralLevel[];
}

export interface ReferralLevel {
  id: string;
  projectId: string;
  referralProgramId: string;
  level: number; // 1, 2, 3
  percent: number; // % от покупки, начисляемый рефереру на уровне
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralLevelInput {
  level: number;
  percent: number;
  isActive?: boolean;
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
  maxId?: bigint | null;
  isActive: boolean;
  registeredAt: Date;
  updatedAt: Date;

  // Статистика для уровней бонусов
  totalPurchases: number;
  currentLevel: string;

  // Реферальная система
  referredBy?: string | null; // ID пользователя-рефера
  referralCode?: string | null; // Уникальный реферальный код

  // Партнёрская иерархия (b2b-referral-hierarchy Phase 1)
  partnerRole?: PartnerRole;
  outboundReferralPlanId?: string | null;

  // UTM метки при регистрации
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;

  // Связи
  project?: Project;
  bonuses?: Bonus[];
  transactions?: Transaction[];
  referrer?: User | null;
  referrals?: User[];
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
  referralLevel?: number | null;
  externalId?: string | null;
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
  externalId?: string | null;

  // Контекст уровня пользователя
  userLevel?: string | null; // Уровень пользователя на момент операции
  appliedPercent?: number | null; // Применённый процент бонусов

  // Реферальная система
  isReferralBonus: boolean;
  referralUserId?: string | null; // Кому начислен реферальный бонус
  referralLevel?: number | null; // Уровень (1-3)

  // Связи
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
export type BotStatus = 'INACTIVE' | 'ACTIVE' | 'ERROR';
export type BonusType =
  | 'PURCHASE'
  | 'BIRTHDAY'
  | 'MANUAL'
  | 'REFERRAL'
  | 'PROMO'
  | 'WELCOME'; // ✨ НОВОЕ: Приветственные бонусы
export type TransactionType = 'EARN' | 'SPEND' | 'EXPIRE' | 'REFUND';
export type BonusMode = 'SIMPLE' | 'LEVELS'; // ✨ НОВОЕ: Режим начисления бонусов
export type PartnerRole = 'CLIENT' | 'TRAINER' | 'MANAGER' | 'DIRECTOR';

// Типы для API
export interface CreateProjectInput {
  name: string;
  domain?: string;
  bonusPercentage?: number;
  bonusExpiryDays?: number;
  botToken?: string;
  botUsername?: string;
}

export interface UpdateProjectInput {
  name?: string;
  domain?: string;
  bonusPercentage?: number;
  bonusExpiryDays?: number;
  bonusMode?: BonusMode; // ✨ НОВОЕ: Режим начисления бонусов
  isActive?: boolean;
  botToken?: string;
  botUsername?: string;
  botStatus?: BotStatus;
  maxPaymentPercentage?: number;
}

export interface CreateUserInput {
  projectId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: Date;

  // UTM метки
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;

  // Реферальная система
  referralCode?: string;
}

export interface CreateBonusInput {
  userId: string;
  amount: number;
  type: BonusType;
  description?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  referralLevel?: number;
  isReferralBonus?: boolean;
  referralUserId?: string;
}

export interface CreateTransactionInput {
  userId: string;
  bonusId?: string;
  amount: number;
  type: TransactionType;
  description?: string;
  metadata?: Record<string, any>;
  userLevel?: string;
  appliedPercent?: number;
  isReferralBonus?: boolean;
  referralUserId?: string;
  referralLevel?: number;
}

// Bonus Level API
export interface CreateBonusLevelInput {
  projectId: string;
  name: string;
  minAmount: number;
  maxAmount?: number;
  bonusPercent: number;
  paymentPercent: number;
  order?: number;
  isActive?: boolean;
}

export interface UpdateBonusLevelInput {
  name?: string;
  minAmount?: number;
  maxAmount?: number;
  bonusPercent?: number;
  paymentPercent?: number;
  order?: number;
  isActive?: boolean;
}

// Referral Program API
export interface CreateReferralProgramInput {
  projectId: string;
  isActive?: boolean;
  referrerBonus: number;
  refereeBonus: number;
  minPurchaseAmount?: number;
  cookieLifetime?: number;
  welcomeBonus?: number;
  welcomeRewardType?: WelcomeRewardType;
  firstPurchaseDiscountPercent?: number;
  description?: string;
  levels?: ReferralLevelInput[];
}

export interface UpdateReferralProgramInput {
  isActive?: boolean;
  referrerBonus?: number;
  refereeBonus?: number;
  minPurchaseAmount?: number;
  cookieLifetime?: number;
  welcomeBonus?: number;
  welcomeRewardType?: WelcomeRewardType;
  firstPurchaseDiscountPercent?: number;
  description?: string;
  levels?: ReferralLevelInput[];
}

// Bot Setup API
export interface BotSetupInput {
  botToken: string;
}

export interface BotStatusResponse {
  status: BotStatus;
  username?: string;
  isRunning: boolean;
  lastError?: string;
  webhookUrl?: string;
}

// Webhook типы с UTM поддержкой
export interface WebhookRegisterUserPayload {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;

  // UTM метки для реферальной системы
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;

  // Реферальный код (опционально)
  referralCode?: string;
}

export interface WebhookPurchasePayload {
  userEmail?: string;
  userPhone?: string;
  purchaseAmount: number;
  orderId: string;
  description?: string;

  // UTM метки покупки
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
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

  // Статистика по уровням
  usersByLevel: Record<string, number>;

  // Реферальная статистика
  totalReferrals: number;
  referralBonusesEarned: number;
}

export interface UserBalance {
  totalEarned: number;
  totalSpent: number;
  currentBalance: number;
  expiringSoon: number; // бонусы, которые истекают в течение 30 дней
}

// Расширенный тип пользователя с подсчётом бонусов
export interface UserWithBonuses extends User {
  activeBonuses: number;
  totalEarned: number;
  totalSpent: number;
  totalBonuses: number; // Общее количество заработанных бонусов
  level?: BonusLevel;
  progressToNext?: {
    nextLevel: BonusLevel;
    amountNeeded: number;
    progressPercent: number;
  };
}

// Реферальная статистика
export interface ReferralStats {
  totalReferrals: number;
  periodReferrals: number;
  activeReferrers: number;
  totalBonusPaid: number;
  periodBonusPaid: number;
  averageOrderValue: number;
  topReferrers: Array<{
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    referralCount: number;
    totalBonus: number;
  }>;
  utmSources: Array<{
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    count: number;
  }>;
  levelBreakdown: Array<{
    level: number;
    totalBonus: number;
    payouts: number;
  }>;
}
