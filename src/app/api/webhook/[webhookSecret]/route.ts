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
import type {
  WebhookRegisterUserPayload,
  WebhookPurchasePayload,
  WebhookSpendBonusesPayload,
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
        success,
      },
    });
  } catch (error) {
    // TODO: заменить на логгер
    // console.error('Ошибка логирования webhook:', error);
  }
}

// Обработчик POST запросов
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ webhookSecret: string }> }
) {
  const { webhookSecret } = await params;
  const method = request.method;
  const endpoint = request.url;

  // Получаем заголовки (упрощенная версия)
  const requestHeaders: Record<string, string> = {
    'content-type': request.headers.get('content-type') || '',
    'user-agent': request.headers.get('user-agent') || '',
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

    // Определяем тип операции по action в теле запроса
    const { action, ...payload } = body;

    switch (action) {
      case 'register_user':
        response = await handleRegisterUser(project.id, payload as WebhookRegisterUserPayload);
        status = 201;
        success = true;
        break;

      case 'purchase':
        response = await handlePurchase(project.id, payload as WebhookPurchasePayload);
        status = 200;
        success = true;
        break;

      case 'spend_bonuses':
        response = await handleSpendBonuses(project.id, payload as WebhookSpendBonusesPayload);
        status = 200;
        success = true;
        break;

      default:
        response = { error: `Неизвестное действие: ${action}` };
        status = 400;
    }

    return NextResponse.json(response, { status });
  } catch (error) {
    // TODO: заменить на логгер
    // console.error('Ошибка webhook:', error);
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
  const { email, phone, firstName, lastName, birthDate } = payload;

  if (!email && !phone) {
    throw new Error('Должен быть указан email или телефон');
  }

  // Проверяем, не существует ли уже такой пользователь
  const existingUser = await UserService.findUserByContact(projectId, email, phone);
  if (existingUser) {
    return {
      success: true,
      message: 'Пользователь уже существует',
      user: {
        id: existingUser.id,
        email: existingUser.email,
        phone: existingUser.phone,
      },
    };
  }

  // Создаем нового пользователя
  const user = await UserService.createUser({
    projectId,
    email,
    phone,
    firstName,
    lastName,
    birthDate: birthDate ? new Date(birthDate) : undefined,
  });

  return {
    success: true,
    message: 'Пользователь успешно зарегистрирован',
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
    },
  };
}

// Обработчик покупки (начисление бонусов)
async function handlePurchase(
  projectId: string,
  payload: WebhookPurchasePayload
) {
  const { userEmail, userPhone, purchaseAmount, orderId, description } = payload;

  if (!userEmail && !userPhone) {
    throw new Error('Должен быть указан email или телефон пользователя');
  }

  // Находим пользователя
  const user = await UserService.findUserByContact(projectId, userEmail, userPhone);
  if (!user) {
    throw new Error('Пользователь не найден');
  }

  // Начисляем бонусы за покупку
  const bonus = await BonusService.awardPurchaseBonus(
    user.id,
    purchaseAmount,
    orderId,
    description
  );

  return {
    success: true,
    message: 'Бонусы успешно начислены',
    bonus: {
      id: bonus.id,
      amount: Number(bonus.amount),
      expiresAt: bonus.expiresAt,
    },
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
    },
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
  const user = await UserService.findUserByContact(projectId, userEmail, userPhone);
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
      transactionsCount: transactions.length,
    },
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
    },
  };
}

// Обработчик GET запросов (для проверки)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ webhookSecret: string }> }
) {
  const { webhookSecret } = await params;
  
  const project = await ProjectService.getProjectByWebhookSecret(webhookSecret);
  
  if (!project) {
    return NextResponse.json({ error: 'Неверный webhook secret' }, { status: 401 });
  }

  return NextResponse.json({
    project: project.name,
    status: project.isActive ? 'active' : 'inactive',
    webhookEndpoint: `/api/webhook/${webhookSecret}`,
    supportedActions: [
      'register_user',
      'purchase', 
      'spend_bonuses'
    ],
  });
}
