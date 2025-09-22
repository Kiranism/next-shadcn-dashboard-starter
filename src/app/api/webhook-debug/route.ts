/**
 * @file: webhook-debug/route.ts
 * @description: Отладочный endpoint для тестирования webhook без проверки secret
 * @project: SaaS Bonus System
 * @dependencies: Next.js API Routes
 * @created: 2025-09-22
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    logger.info('🔧 ОТЛАДОЧНЫЙ webhook endpoint вызван', {
      url: request.url,
      method: request.method,
      contentType: request.headers.get('content-type'),
      userAgent: request.headers.get('user-agent'),
      component: 'webhook-debug'
    });

    // Парсим тело запроса
    const contentType = request.headers.get('content-type') || '';
    let body: any;

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const form = await request.formData();
      const jsonStr = (form.get('data') ||
        form.get('json') ||
        form.get('order')) as string | null;
      if (jsonStr && typeof jsonStr === 'string') {
        try {
          body = JSON.parse(jsonStr);
        } catch {
          body = Object.fromEntries(form.entries());
        }
      } else {
        body = Object.fromEntries(form.entries());
      }
    } else {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    logger.info('🔧 Тело запроса распарсено', {
      bodyType: typeof body,
      bodyKeys: typeof body === 'object' && body ? Object.keys(body) : [],
      bodyPreview:
        typeof body === 'object'
          ? JSON.stringify(body).substring(0, 500)
          : String(body).substring(0, 500),
      component: 'webhook-debug'
    });

    // Проверяем подключение к БД
    await db.$queryRaw`SELECT 1`;
    logger.info('🔧 Подключение к БД работает', { component: 'webhook-debug' });

    // Показываем все проекты
    const projects = await db.project.findMany({
      select: {
        id: true,
        name: true,
        webhookSecret: true,
        isActive: true
      }
    });

    logger.info('🔧 Найденные проекты', {
      count: projects.length,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        webhookSecret: p.webhookSecret,
        isActive: p.isActive
      })),
      component: 'webhook-debug'
    });

    // Анализируем тело запроса на предмет Tilda данных
    const analysis: any = {
      isTildaOrder: false,
      hasEmail: false,
      hasPhone: false,
      hasPayment: false,
      hasPromocode: false,
      hasAppliedBonuses: false
    };

    if (typeof body === 'object' && body) {
      analysis.isTildaOrder = !!(body.Email || body.email || body.payment);
      analysis.hasEmail = !!(body.Email || body.email);
      analysis.hasPhone = !!(body.Phone || body.phone);
      analysis.hasPayment = !!body.payment;
      analysis.hasPromocode = !!(body.payment?.promocode || body.promocode);
      analysis.hasAppliedBonuses = !!(
        body.appliedBonuses || body.applied_bonuses
      );

      if (body.payment?.orderid) {
        analysis.orderId = body.payment.orderid;
      }
    }

    logger.info('🔧 Анализ данных запроса', {
      analysis,
      component: 'webhook-debug'
    });

    return NextResponse.json({
      success: true,
      message: 'Отладочный webhook обработан',
      timestamp: new Date().toISOString(),
      analysis,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        webhookSecret: p.webhookSecret,
        correctUrl: `https://gupil.ru/api/webhook/${p.webhookSecret}`
      })),
      receivedData: {
        contentType,
        bodyType: typeof body,
        bodySize: JSON.stringify(body).length
      }
    });
  } catch (error) {
    logger.error('🔧 Ошибка в отладочном webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      component: 'webhook-debug'
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Отладочный webhook endpoint активен',
    usage: 'Отправьте POST запрос с данными Tilda для анализа',
    timestamp: new Date().toISOString()
  });
}
