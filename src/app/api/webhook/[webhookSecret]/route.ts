/**
 * @file: route.ts
 * @description: Webhook API для обработки регистрации пользователей, покупок и списания бонусов
 * @project: SaaS Bonus System
 * @dependencies: NextRequest, NextResponse, db, ProjectService, UserService, BonusService
 * @created: 2025-01-23
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ProjectService } from '@/lib/services/project.service';
import { UserService, BonusService } from '@/lib/services/user.service';
import { logger } from '@/lib/logger';
import { withWebhookRateLimit } from '@/lib/with-rate-limit';
import { 
  validateTildaOrder, 
  validateWebhookRequest,
  type TildaOrder,
  type TildaProduct
} from '@/lib/validation/webhook';
import type {
  WebhookRegisterUserPayload,
  WebhookPurchasePayload,
  WebhookSpendBonusesPayload
} from '@/types/bonus';

// Функция логирования webhook запросов
async function logWebhookRequest(
  projectId: string,
  endpoint: string,
  method: string,
  headers: Record<string, string>,
  body: any,
  response: any,
  status: number,
  success: boolean
) {
  try {
    await db.webhookLog.create({
      data: {
        projectId,
        endpoint,
        method,
        headers,
        body,
        response,
        status,
        success
      }
    });
  } catch (error) {
    logger.error('Ошибка логирования webhook', {
      projectId,
      endpoint,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      component: 'webhook-logging'
    });
  }
}

// Обработчик заказа от Tilda
async function handleTildaOrder(projectId: string, orderData: TildaOrder) {
  const { name, email, phone, payment, utm_ref } = orderData;

  if (!email && !phone) {
    throw new Error('Должен быть указан email или телефон пользователя');
  }

  try {
    // Сначала пытаемся найти пользователя
    let user = await UserService.findUserByContact(projectId, email, phone);

    // Если пользователь не найден, создаем его
    if (!user) {
      const nameParts = name ? name.trim().split(' ') : ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      user = await UserService.createUser({
        projectId,
        email: email || '',
        phone: phone || '',
        firstName,
        lastName,
        utmSource: utm_ref || ''
      });
    }

    // Начисляем бонусы за покупку
    const totalAmount = parseInt(payment.amount) || 0;
    const orderId = payment.orderid || payment.systranid || 'tilda_order';

    // Создаем описание заказа с товарами
    const productNames =
      payment.products?.map((p: TildaProduct) => p.name).join(', ') || 'Заказ Tilda';
    const description = `Заказ #${orderId}: ${productNames}`;

    const result = await BonusService.awardPurchaseBonus(
      user.id,
      totalAmount,
      orderId,
      description
    );

    // Получаем баланс пользователя для ответа
    const userBalance = await UserService.getUserBalance(user.id);

    return {
      success: true,
      message: 'Заказ обработан, бонусы начислены',
      order: {
        id: orderId,
        amount: totalAmount,
        products: payment.products?.length || 0
      },
      bonus: {
        id: result.bonus.id,
        amount: Number(result.bonus.amount),
        expiresAt: result.bonus.expiresAt
      },
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: name,
        currentBalance: Number(userBalance.currentBalance),
        totalEarned: Number(userBalance.totalEarned)
      },
      levelInfo: result.levelInfo,
      referralInfo: result.referralInfo
    };
  } catch (error) {
    logger.error('Ошибка обработки заказа Tilda', {
      projectId,
      orderData,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      component: 'tilda-webhook'
    });
    throw error;
  }
}

// Обработчик POST запросов (без rate limiting)
async function handlePOST(
  request: NextRequest,
  { params }: { params: { webhookSecret: string } }
) {
  const { webhookSecret } = params;
  const method = request.method;
  const endpoint = request.url;

  // Получаем заголовки (упрощенная версия)
  const requestHeaders: Record<string, string> = {
    'content-type': request.headers.get('content-type') || '',
    'user-agent': request.headers.get('user-agent') || ''
  };

  let body: any;
  let project: any;
  let response: any = { error: 'Неизвестная ошибка' };
  let status = 500;
  let success = false;

  try {
    // Парсим тело запроса
    body = await request.json();

    // Получаем проект по webhook secret
    project = await ProjectService.getProjectByWebhookSecret(webhookSecret);

    if (!project) {
      response = { error: 'Неверный webhook secret' };
      status = 401;
      return NextResponse.json(response, { status });
    }

    if (!project.isActive) {
      response = { error: 'Проект деактивирован' };
      status = 403;
      return NextResponse.json(response, { status });
    }

    // Проверяем, это webhook от Tilda или наш стандартный webhook
    if (Array.isArray(body) && body.length > 0 && body[0].payment) {
      // Это webhook от Tilda - валидируем данные
      const validatedOrder = validateTildaOrder(body[0]);
      response = await handleTildaOrder(project.id, validatedOrder);
      status = 200;
      success = true;
    } else {
      // Это наш стандартный webhook - валидируем данные
      const validatedRequest = validateWebhookRequest(body);
      const { action, payload } = validatedRequest;

      switch (action) {
        case 'register_user':
          response = await handleRegisterUser(
            project.id,
            payload
          );
          status = 201;
          success = true;
          break;

        case 'purchase':
          response = await handlePurchase(
            project.id,
            payload
          );
          status = 200;
          success = true;
          break;

        case 'spend_bonuses':
          response = await handleSpendBonuses(
            project.id,
            payload
          );
          status = 200;
          success = true;
          break;

        default:
          response = { error: `Неизвестное действие: ${action}` };
          status = 400;
      }
    }

    return NextResponse.json(response, { status });
  } catch (error) {
    logger.error('Ошибка обработки webhook', {
      webhookSecret,
      body,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      component: 'webhook-handler'
    });
    response = {
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
    status = 500;
    return NextResponse.json(response, { status });
  } finally {
    // Логируем запрос
    if (project) {
      await logWebhookRequest(
        project.id,
        endpoint,
        method,
        requestHeaders,
        body,
        response,
        status,
        success
      );
    }
  }
}

// Обработчик регистрации пользователя
async function handleRegisterUser(
  projectId: string,
  payload: WebhookRegisterUserPayload
) {
  const {
    email,
    phone,
    firstName,
    lastName,
    birthDate,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    referralCode
  } = payload;

  if (!email && !phone) {
    throw new Error('Должен быть указан email или телефон');
  }

  // Проверяем, не существует ли уже такой пользователь
  const existingUser = await UserService.findUserByContact(
    projectId,
    email,
    phone
  );
  if (existingUser) {
    return {
      success: true,
      message: 'Пользователь уже существует',
      user: {
        id: existingUser.id,
        email: existingUser.email,
        phone: existingUser.phone
      }
    };
  }

  // Создаем нового пользователя с UTM метками и реферальной системой
  const user = await UserService.createUser({
    projectId,
    email,
    phone,
    firstName,
    lastName,
    birthDate: birthDate ? new Date(birthDate) : undefined,
    // UTM метки
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    // Реферальная система
    referralCode
  });

  return {
    success: true,
    message: 'Пользователь успешно зарегистрирован',
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone
    }
  };
}

// Обработчик покупки (начисление бонусов)
async function handlePurchase(
  projectId: string,
  payload: WebhookPurchasePayload
) {
  const { userEmail, userPhone, purchaseAmount, orderId, description } =
    payload;

  if (!userEmail && !userPhone) {
    throw new Error('Должен быть указан email или телефон пользователя');
  }

  // Находим пользователя
  const user = await UserService.findUserByContact(
    projectId,
    userEmail,
    userPhone
  );
  if (!user) {
    throw new Error('Пользователь не найден');
  }

  // Начисляем бонусы за покупку с учётом уровня и реферальной системы
  const result = await BonusService.awardPurchaseBonus(
    user.id,
    purchaseAmount,
    orderId,
    description
  );

  return {
    success: true,
    message: 'Бонусы успешно начислены',
    bonus: {
      id: result.bonus.id,
      amount: Number(result.bonus.amount),
      expiresAt: result.bonus.expiresAt
    },
    levelInfo: result.levelInfo,
    referralInfo: result.referralInfo,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone
    }
  };
}

// Обработчик списания бонусов
async function handleSpendBonuses(
  projectId: string,
  payload: WebhookSpendBonusesPayload
) {
  const { userEmail, userPhone, bonusAmount, orderId, description } = payload;

  if (!userEmail && !userPhone) {
    throw new Error('Должен быть указан email или телефон пользователя');
  }

  // Находим пользователя
  const user = await UserService.findUserByContact(
    projectId,
    userEmail,
    userPhone
  );
  if (!user) {
    throw new Error('Пользователь не найден');
  }

  // Списываем бонусы
  const transactions = await BonusService.spendBonuses(
    user.id,
    bonusAmount,
    description || `Списание бонусов для заказа ${orderId}`,
    { orderId }
  );

  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    success: true,
    message: 'Бонусы успешно списаны',
    spent: {
      amount: totalSpent,
      transactionsCount: transactions.length
    },
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone
    }
  };
}

// Обработчик GET запросов (для проверки)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ webhookSecret: string }> }
) {
  const { webhookSecret } = await context.params;

  const project = await ProjectService.getProjectByWebhookSecret(webhookSecret);

  if (!project) {
    return NextResponse.json(
      { error: 'Неверный webhook secret' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    project: project.name,
    status: project.isActive ? 'active' : 'inactive',
    webhookEndpoint: `/api/webhook/${webhookSecret}`,
    supportedActions: ['register_user', 'purchase', 'spend_bonuses']
  });
}

// Применяем rate limiting к POST запросам
export const POST = withWebhookRateLimit(handlePOST);
