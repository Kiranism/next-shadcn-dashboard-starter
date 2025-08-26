/**
 * @file: api-schemas.ts
 * @description: Zod схемы для валидации API запросов
 * @project: SaaS Bonus System
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import { z } from 'zod';

// Схема создания проекта
export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Название проекта обязательно').max(100),
  domain: z.string().url('Некорректный URL домена').optional(),
  bonusPercentage: z.number().min(0).max(100).default(1.0),
  bonusExpiryDays: z.number().min(1).max(3650).default(365)
});

// Схема обновления проекта
export const UpdateProjectSchema = CreateProjectSchema.partial();

// Схема создания пользователя
export const CreateUserSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Некорректный номер телефона')
      .optional(),
    firstName: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
    birthDate: z.string().datetime().optional(),
    referralCode: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    utmContent: z.string().optional(),
    utmTerm: z.string().optional()
  })
  .refine((data) => data.email || data.phone, {
    message: 'Необходимо указать email или телефон'
  });

// Схема начисления бонусов
export const AwardBonusSchema = z.object({
  userId: z.string().cuid(),
  amount: z.number().positive('Сумма должна быть положительной'),
  type: z.enum([
    'REGISTRATION',
    'PURCHASE',
    'BIRTHDAY',
    'REFERRAL',
    'MANUAL',
    'OTHER'
  ]),
  description: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional()
});

// Схема списания бонусов
export const SpendBonusesSchema = z.object({
  userId: z.string().cuid(),
  amount: z.number().positive('Сумма должна быть положительной'),
  orderId: z.string().optional(),
  description: z.string().max(500).optional()
});

// Схема массового начисления
export const BulkAwardBonusSchema = z.object({
  userIds: z
    .array(z.string().cuid())
    .min(1, 'Выберите хотя бы одного пользователя'),
  amount: z.number().positive('Сумма должна быть положительной'),
  type: z.enum([
    'REGISTRATION',
    'PURCHASE',
    'BIRTHDAY',
    'REFERRAL',
    'MANUAL',
    'OTHER'
  ]),
  description: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional()
});

// Схема настройки бота
export const BotSettingsSchema = z.object({
  botToken: z.string().regex(/^\d+:[\w-]+$/, 'Некорректный токен бота'),
  botUsername: z.string().min(1).max(32),
  isActive: z.boolean().default(true),
  welcomeMessage: z.any().optional(),
  messageSettings: z.any().optional(),
  functionalSettings: z.any().optional()
});

// Схема уровня бонусов
export const BonusLevelSchema = z.object({
  name: z.string().min(1).max(50),
  minAmount: z.number().min(0),
  bonusPercent: z.number().min(0).max(100),
  description: z.string().max(500).optional()
});

// Схема реферальной программы
export const ReferralProgramSchema = z.object({
  isActive: z.boolean(),
  bonusPercent: z.number().min(0).max(100),
  referrerBonus: z.number().min(0),
  description: z.string().max(500).optional()
});

// Схема массовой рассылки
export const BulkNotificationSchema = z.object({
  userIds: z.array(z.string().cuid()).min(1),
  message: z.string().min(1).max(4096),
  imageUrl: z.string().url().optional(),
  buttons: z
    .array(
      z.object({
        text: z.string().min(1).max(64),
        url: z.string().url()
      })
    )
    .max(10)
    .optional()
});

// Хелпер для валидации
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    throw error;
  }
}
