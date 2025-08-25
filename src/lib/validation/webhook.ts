/**
 * @file: webhook.ts
 * @description: Схемы валидации для webhook запросов
 * @project: SaaS Bonus System
 * @dependencies: zod
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import { z } from 'zod';

// Схема для продукта Tilda
const TildaProductSchema = z.object({
  name: z.string(),
  quantity: z.number().optional(),
  amount: z.number().optional(),
  price: z.number().optional()
});

// Схема для платежа Tilda
const TildaPaymentSchema = z.object({
  amount: z.string().or(z.number()),
  orderid: z.string().optional(),
  systranid: z.string().optional(),
  products: z.array(TildaProductSchema).optional()
});

// Схема для заказа Tilda
export const TildaOrderSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  payment: TildaPaymentSchema,
  utm_ref: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional()
});

// Схема для регистрации пользователя
export const RegisterUserSchema = z.object({
  action: z.literal('register_user'),
  payload: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    birthDate: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    utmContent: z.string().optional(),
    utmTerm: z.string().optional(),
    referralCode: z.string().optional()
  })
});

// Схема для покупки
export const PurchaseSchema = z.object({
  action: z.literal('purchase'),
  payload: z.object({
    userEmail: z.string().email().optional(),
    userPhone: z.string().optional(),
    purchaseAmount: z.number().positive(),
    orderId: z.string(),
    description: z.string().optional()
  })
});

// Схема для списания бонусов
export const SpendBonusesSchema = z.object({
  action: z.literal('spend_bonuses'),
  payload: z.object({
    userEmail: z.string().email().optional(),
    userPhone: z.string().optional(),
    bonusAmount: z.number().positive(),
    orderId: z.string(),
    description: z.string().optional()
  })
});

// Общая схема webhook запроса
export const WebhookRequestSchema = z.discriminatedUnion('action', [
  RegisterUserSchema,
  PurchaseSchema,
  SpendBonusesSchema
]);

// Типы для TypeScript
export type TildaOrder = z.infer<typeof TildaOrderSchema>;
export type TildaProduct = z.infer<typeof TildaProductSchema>;
export type TildaPayment = z.infer<typeof TildaPaymentSchema>;
export type RegisterUserPayload = z.infer<typeof RegisterUserSchema>['payload'];
export type PurchasePayload = z.infer<typeof PurchaseSchema>['payload'];
export type SpendBonusesPayload = z.infer<typeof SpendBonusesSchema>['payload'];
export type WebhookRequest = z.infer<typeof WebhookRequestSchema>;

// Функция валидации с детальными ошибками
export function validateWebhookRequest(data: unknown): WebhookRequest {
  try {
    return WebhookRequestSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (e) => `${e.path.join('.')}: ${e.message}`
      );
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
}

// Функция валидации Tilda заказа
export function validateTildaOrder(data: unknown): TildaOrder {
  try {
    return TildaOrderSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (e) => `${e.path.join('.')}: ${e.message}`
      );
      throw new Error(
        `Tilda order validation failed: ${errorMessages.join(', ')}`
      );
    }
    throw error;
  }
}
