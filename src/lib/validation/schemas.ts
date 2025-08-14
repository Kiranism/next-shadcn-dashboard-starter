/**
 * @file: schemas.ts
 * @description: Централизованные Zod схемы валидации для SaaS Bonus System
 * @project: SaaS Bonus System
 * @dependencies: zod
 * @created: 2025-01-27
 * @author: AI Assistant + User
 */

import { z } from 'zod';

// ===== БАЗОВЫЕ ТИПЫ =====

// Поддерживаем как UUID, так и CUID (используется в Prisma @default(cuid()))
export const uuidSchema = z.string().refine(
  (val) =>
    // UUID v1-5
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      val
    ) ||
    // CUID-подобные идентификаторы (начинаются с 'c', далее латиница/цифры, длина >= 21)
    /^c[0-9a-z]{20,}$/i.test(val),
  'Неверный формат идентификатора'
);

export const emailSchema = z
  .string()
  .email('Неверный формат email')
  .min(5, 'Email слишком короткий')
  .max(255, 'Email слишком длинный');

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Неверный формат телефона')
  .min(10, 'Номер телефона слишком короткий')
  .max(20, 'Номер телефона слишком длинный');

export const nameSchema = z
  .string()
  .min(1, 'Имя не может быть пустым')
  .max(100, 'Имя слишком длинное')
  .regex(/^[a-zA-Zа-яА-ЯёЁ\s\-']+$/, 'Имя содержит недопустимые символы');

export const amountSchema = z
  .number()
  .positive('Сумма должна быть положительной')
  .max(1000000, 'Сумма не может превышать 1,000,000')
  .multipleOf(0.01, 'Сумма должна быть с точностью до копеек');

export const percentageSchema = z
  .number()
  .min(0, 'Процент не может быть отрицательным')
  .max(100, 'Процент не может превышать 100%');

export const dateSchema = z
  .string()
  .datetime('Неверный формат даты')
  .or(z.date());

// ===== ПРОЕКТ =====

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Название проекта обязательно')
    .max(100, 'Название проекта слишком длинное')
    .regex(/^[a-zA-Zа-яА-ЯёЁ0-9\s\-_.]+$/, 'Недопустимые символы в названии'),

  description: z.string().max(500, 'Описание слишком длинное').optional(),

  domain: z.string().url('Неверный формат домена').optional(),

  bonusPercentage: percentageSchema.default(5),

  bonusExpiryDays: z
    .number()
    .int('Количество дней должно быть целым числом')
    .min(1, 'Минимум 1 день')
    .max(3650, 'Максимум 10 лет')
    .default(365),

  isActive: z.boolean().default(true)
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectIdSchema = z.object({
  id: uuidSchema
});

// ===== ПОЛЬЗОВАТЕЛЬ =====

export const createUserSchema = z
  .object({
    projectId: uuidSchema,

    email: emailSchema.optional(),

    phone: phoneSchema.optional(),

    firstName: nameSchema.optional(),

    lastName: nameSchema.optional(),

    birthDate: dateSchema.optional(),

    // UTM метки
    utmSource: z.string().max(100).optional(),
    utmMedium: z.string().max(100).optional(),
    utmCampaign: z.string().max(100).optional(),
    utmContent: z.string().max(100).optional(),
    utmTerm: z.string().max(100).optional(),

    // Реферальная система
    referralCode: z
      .string()
      .regex(/^[A-Z0-9]{6,12}$/, 'Неверный формат реферального кода')
      .optional()
  })
  .refine((data) => data.email || data.phone, {
    message: 'Должен быть указан email или телефон',
    path: ['email']
  });

// Сначала убираем рефайн, потом делаем omit и partial
const baseUserSchema = z.object({
  projectId: uuidSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  birthDate: z.union([z.string().datetime(), z.date()]).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmTerm: z.string().max(100).optional(),
  referralCode: z.string().max(20).optional()
});

export const updateUserSchema = baseUserSchema
  .omit({ projectId: true })
  .partial();

export const userContactSchema = z
  .object({
    projectId: uuidSchema,
    email: emailSchema.optional(),
    phone: phoneSchema.optional()
  })
  .refine((data) => data.email || data.phone, {
    message: 'Должен быть указан email или телефон',
    path: ['email']
  });

// ===== БОНУСЫ =====

export const bonusActionSchema = z.object({
  userId: uuidSchema,
  amount: amountSchema,
  description: z
    .string()
    .min(1, 'Описание обязательно')
    .max(500, 'Описание слишком длинное'),
  expiresAt: dateSchema.optional(),
  orderId: z.string().max(100).optional()
});

export const bulkBonusActionSchema = z.object({
  userIds: z.array(uuidSchema).min(1, 'Выберите хотя бы одного пользователя'),
  amount: amountSchema,
  description: z
    .string()
    .min(1, 'Описание обязательно')
    .max(500, 'Описание слишком длинное'),
  expiresAt: dateSchema.optional()
});

export const spendBonusesSchema = z.object({
  userId: uuidSchema,
  amount: amountSchema,
  description: z
    .string()
    .min(1, 'Описание обязательно')
    .max(500, 'Описание слишком длинное'),
  orderId: z.string().max(100).optional()
});

// ===== УРОВНИ БОНУСОВ =====

export const bonusLevelSchema = z.object({
  name: z
    .string()
    .min(1, 'Название уровня обязательно')
    .max(50, 'Название уровня слишком длинное'),

  minAmount: amountSchema.default(0),

  maxAmount: amountSchema.optional(),

  bonusPercentage: percentageSchema,

  maxBonusUsage: percentageSchema.default(20),

  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Неверный формат цвета')
    .default('#3B82F6'),

  description: z.string().max(200).optional(),

  isDefault: z.boolean().default(false)
});

export const createBonusLevelSchema = bonusLevelSchema.extend({
  projectId: uuidSchema
});

export const updateBonusLevelSchema = bonusLevelSchema.partial();

// ===== TELEGRAM BOT =====

export const botTokenSchema = z
  .string()
  .regex(
    /^\d{8,10}:[A-Za-z0-9_-]{35}$/,
    'Неверный формат токена Telegram бота'
  );

export const botSettingsSchema = z.object({
  projectId: uuidSchema,
  botToken: botTokenSchema,
  botUsername: z
    .string()
    .regex(/^[a-zA-Z0-9_]{5,32}$/, 'Неверный формат username бота')
    .optional(),

  // Настройки сообщений
  messageSettings: z
    .object({
      welcomeMessage: z
        .string()
        .max(4096, 'Сообщение слишком длинное')
        .optional(),
      balanceMessage: z
        .string()
        .max(4096, 'Сообщение слишком длинное')
        .optional(),
      helpMessage: z.string().max(4096, 'Сообщение слишком длинное').optional(),
      linkSuccessMessage: z
        .string()
        .max(4096, 'Сообщение слишком длинное')
        .optional(),
      linkErrorMessage: z
        .string()
        .max(4096, 'Сообщение слишком длинное')
        .optional()
    })
    .optional(),

  // Настройки функционала
  functionalSettings: z
    .object({
      showBalance: z.boolean().default(true),
      showLevel: z.boolean().default(true),
      showReferral: z.boolean().default(true),
      showHistory: z.boolean().default(true),
      showHelp: z.boolean().default(true)
    })
    .optional()
});

export const updateBotSettingsSchema = botSettingsSchema
  .partial()
  .omit({ projectId: true });

// ===== WEBHOOK =====

export const webhookRegisterUserSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    firstName: nameSchema.optional(),
    lastName: nameSchema.optional(),
    birthDate: dateSchema.optional(),
    utmSource: z.string().max(100).optional(),
    utmMedium: z.string().max(100).optional(),
    utmCampaign: z.string().max(100).optional(),
    utmContent: z.string().max(100).optional(),
    utmTerm: z.string().max(100).optional(),
    referralCode: z.string().max(50).optional()
  })
  .refine((data) => data.email || data.phone, {
    message: 'Должен быть указан email или телефон'
  });

export const webhookPurchaseSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    amount: amountSchema,
    orderId: z.string().max(100),
    description: z.string().max(500).optional()
  })
  .refine((data) => data.email || data.phone, {
    message: 'Должен быть указан email или телефон'
  });

export const webhookSpendBonusesSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    amount: amountSchema,
    orderId: z.string().max(100).optional(),
    description: z.string().max(500).optional()
  })
  .refine((data) => data.email || data.phone, {
    message: 'Должен быть указан email или телефон'
  });

export const webhookActionSchema = z.object({
  action: z.enum(['register_user', 'purchase', 'spend_bonuses']),
  payload: z.union([
    webhookRegisterUserSchema,
    webhookPurchaseSchema,
    webhookSpendBonusesSchema
  ])
});

// ===== TILDA WEBHOOK =====

export const tildaPaymentSchema = z.object({
  orderid: z.string(),
  amount: z.string(),
  products: z
    .array(
      z.object({
        name: z.string(),
        price: z.string(),
        quantity: z.string().optional()
      })
    )
    .optional()
});

export const tildaOrderSchema = z
  .object({
    name: z.string(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    payment: tildaPaymentSchema,
    utm_ref: z.string().optional()
  })
  .refine((data) => data.email || data.phone, {
    message: 'Должен быть указан email или телефон'
  });

// ===== NOTIFICATIONS =====

export const notificationSchema = z.object({
  userIds: z.array(uuidSchema).min(1, 'Выберите хотя бы одного пользователя'),
  message: z
    .string()
    .min(1, 'Сообщение не может быть пустым')
    .max(4096, 'Сообщение слишком длинное'),
  type: z.enum(['info', 'success', 'warning', 'error']).default('info')
});

// ===== API RESPONSES =====

export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional()
    })
    .optional()
});

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// ===== QUERY PARAMS =====

export const projectUsersQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  level: uuidSchema.optional(),
  minBalance: amountSchema.optional(),
  maxBalance: amountSchema.optional(),
  registeredAfter: dateSchema.optional(),
  registeredBefore: dateSchema.optional()
});

export const transactionsQuerySchema = paginationSchema.extend({
  userId: uuidSchema.optional(),
  type: z.enum(['BONUS_AWARDED', 'BONUS_SPENT', 'BONUS_EXPIRED']).optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  minAmount: amountSchema.optional(),
  maxAmount: amountSchema.optional()
});

// ===== ЭКСПОРТЫ ТИПОВ =====

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type BonusActionInput = z.infer<typeof bonusActionSchema>;
export type BulkBonusActionInput = z.infer<typeof bulkBonusActionSchema>;
export type CreateBonusLevelInput = z.infer<typeof createBonusLevelSchema>;
export type BotSettingsInput = z.infer<typeof botSettingsSchema>;
export type WebhookRegisterUserInput = z.infer<
  typeof webhookRegisterUserSchema
>;
export type WebhookPurchaseInput = z.infer<typeof webhookPurchaseSchema>;
export type TildaOrderInput = z.infer<typeof tildaOrderSchema>;
export type NotificationInput = z.infer<typeof notificationSchema>;
export type ProjectUsersQuery = z.infer<typeof projectUsersQuerySchema>;
export type TransactionsQuery = z.infer<typeof transactionsQuerySchema>;

// ===== ВАЛИДАЦИОННЫЕ УТИЛИТЫ =====

export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');
      throw new Error(`Ошибка валидации: ${errorMessages}`);
    }
    throw error;
  }
}

export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): {
  success: boolean;
  data?: T;
  error?: string;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');
      return { success: false, error: errorMessages };
    }
    return { success: false, error: 'Неизвестная ошибка валидации' };
  }
}

const validationSchemas = {
  // Основные схемы
  createProjectSchema,
  updateProjectSchema,
  createUserSchema,
  updateUserSchema,
  bonusActionSchema,
  bulkBonusActionSchema,
  createBonusLevelSchema,
  botSettingsSchema,

  // Webhook схемы
  webhookRegisterUserSchema,
  webhookPurchaseSchema,
  webhookSpendBonusesSchema,
  tildaOrderSchema,

  // Утилиты
  validateWithSchema,
  safeValidate
};

export default validationSchemas;
