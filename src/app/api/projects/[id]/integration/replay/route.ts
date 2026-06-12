/**
 * @file: route.ts
 * @description: API endpoint для повторного выполнения webhook запросов из логов
 * @project: SaaS Bonus System
 * @dependencies: Next.js, Prisma, logger
 * @created: 2025-09-23
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import type { NextRequest as NextRequestType } from 'next/server';
import { db } from '@/lib/db';
import { requireProjectAccess } from '@/lib/with-project-access';

interface ReplayRequestBody {
  logId: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

// Безопасное усечение больших тел
const safeJson = (obj: any, limit = 10000) => {
  try {
    const str = JSON.stringify(obj);
    if (str.length > limit) {
      return { _truncated: true, preview: str.slice(0, limit) } as any;
    }
    return obj;
  } catch {
    return { _error: 'serialization_failed' } as any;
  }
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const projectId = resolvedParams.id;

  const access = await requireProjectAccess(params);
  if (access instanceof NextResponse) return access;

  try {
    // Добавляем базовую проверку на валидность запроса
    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'INVALID_REQUEST',
            message: 'ID проекта не указан'
          }
        },
        { status: 400 }
      );
    }

    let body: ReplayRequestBody;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Ошибка парсинга JSON:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'INVALID_JSON',
            message: 'Неверный JSON в запросе'
          }
        },
        { status: 400 }
      );
    }

    const { logId, endpoint, method, headers, body: requestBody } = body;

    if (!logId || !endpoint || !method || !headers || !requestBody) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'INVALID_REQUEST',
            message: 'Недостаточно данных для повторного выполнения'
          }
        },
        { status: 400 }
      );
    }

    // Получаем проект
    let project;
    try {
      project = await db.project.findUnique({
        where: { id: projectId },
        select: { id: true, webhookSecret: true, name: true }
      });
    } catch (dbError) {
      console.error('❌ Ошибка при получении проекта из БД:', {
        projectId,
        error: dbError instanceof Error ? dbError.message : String(dbError),
        component: 'webhook-replay'
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'DATABASE_ERROR',
            message: 'Ошибка при получении проекта из базы данных',
            details:
              dbError instanceof Error ? dbError.message : String(dbError)
          }
        },
        { status: 500 }
      );
    }

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: { type: 'NOT_FOUND', message: 'Проект не найден' }
        },
        { status: 404 }
      );
    }

    // Логируем начало повторного выполнения
    console.log('🔄 Начинаем повторное выполнение webhook запроса', {
      projectId,
      logId,
      endpoint,
      method,
      component: 'webhook-replay'
    });

    // Выполняем повторный запрос на сервере с правильной конфигурацией
    // Определяем URL для повторного запроса
    // Если endpoint уже абсолютный (начинается с http/https), используем его напрямую
    let targetUrl = endpoint;
    let baseUrl: string | undefined;

    if (!/^https?:\/\//i.test(endpoint)) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL;

      if (!baseUrl) {
        const host = request.headers.get('host') || '';
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        if (host) {
          baseUrl = `${protocol}://${host}`;
        } else {
          // Fallback: если host не указан, используем env или localhost
          baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        }
      }

      targetUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    }

    console.log('🔍 Определение URL для replay:', {
      envAppUrl: process.env.NEXT_PUBLIC_APP_URL,
      requestHost: request.headers.get('host'),
      requestProto: request.headers.get('x-forwarded-proto'),
      finalBaseUrl: baseUrl,
      endpoint,
      targetUrl,
      component: 'webhook-replay'
    });

    // Выполняем запрос с правильной конфигурацией для Node.js
    let response;
    let responseBody;

    // Готовим заголовки: удаляем опасные поля и фиксируем content-length
    const sanitizedHeaders: Record<string, string> = { ...headers };
    for (const key of Object.keys(sanitizedHeaders)) {
      const lower = key.toLowerCase();
      if (
        lower === 'content-length' ||
        lower === 'host' ||
        lower === 'connection' ||
        lower === 'accept-encoding'
      ) {
        delete sanitizedHeaders[key];
      }
    }

    const methodUpper = method.toUpperCase();
    const hasBody =
      requestBody !== undefined &&
      requestBody !== null &&
      methodUpper !== 'GET' &&
      methodUpper !== 'HEAD';

    const bodyString = hasBody
      ? typeof requestBody === 'string'
        ? requestBody
        : JSON.stringify(requestBody)
      : undefined;

    if (hasBody) {
      const hasContentType = Object.keys(sanitizedHeaders).some(
        (key) => key.toLowerCase() === 'content-type'
      );
      if (!hasContentType) {
        sanitizedHeaders['Content-Type'] = 'application/json';
      }
    }

    console.log('🚀 Начинаем fetch запрос:', {
      targetUrl,
      method: methodUpper,
      hasBody,
      headers: sanitizedHeaders,
      component: 'webhook-replay'
    });

    // ✅ КРИТИЧНО: Добавляем специальный заголовок для обхода проверки idempotency
    // Это позволяет replay запросам обрабатываться повторно, даже если orderId уже обработан
    sanitizedHeaders['X-Webhook-Replay'] = 'true';
    sanitizedHeaders['X-Replay-Log-Id'] = logId;

    try {
      response = await fetch(targetUrl, {
        method: methodUpper,
        headers: sanitizedHeaders,
        body: hasBody ? bodyString : undefined
      });

      console.log('✅ Fetch запрос завершен:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        component: 'webhook-replay'
      });

      // Читаем ответ
      try {
        responseBody = await response.json();
        console.log('✅ Тело ответа прочитано:', {
          hasBody: !!responseBody,
          bodyType: typeof responseBody,
          component: 'webhook-replay'
        });
      } catch (jsonError) {
        console.error('⚠️ Ошибка чтения JSON ответа:', {
          error:
            jsonError instanceof Error ? jsonError.message : String(jsonError),
          component: 'webhook-replay'
        });
        responseBody = { _error: 'failed_to_parse_response' };
      }
    } catch (fetchError) {
      console.error('❌ Ошибка выполнения fetch запроса:', {
        projectId,
        logId,
        targetUrl,
        method,
        error:
          fetchError instanceof Error ? fetchError.message : String(fetchError),
        errorName: fetchError instanceof Error ? fetchError.name : 'Unknown',
        cause:
          fetchError && typeof fetchError === 'object' && 'cause' in fetchError
            ? (fetchError as any).cause
            : undefined,
        stack: fetchError instanceof Error ? fetchError.stack : undefined,
        component: 'webhook-replay'
      });

      // Определяем тип ошибки
      let errorType = 'FETCH_ERROR';
      let errorMessage = 'Ошибка выполнения запроса';

      if (fetchError instanceof Error) {
        if (fetchError.message.includes('ECONNREFUSED')) {
          errorType = 'CONNECTION_REFUSED';
          errorMessage = 'Сервер недоступен (ECONNREFUSED)';
        } else if (fetchError.message.includes('ENOTFOUND')) {
          errorType = 'DNS_ERROR';
          errorMessage = 'DNS ошибка - хост не найден';
        } else if (fetchError.message.includes('timeout')) {
          errorType = 'TIMEOUT_ERROR';
          errorMessage = 'Таймаут запроса';
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            type: errorType,
            message: errorMessage,
            details:
              fetchError instanceof Error
                ? fetchError.message
                : String(fetchError),
            targetUrl,
            method
          }
        },
        { status: 500 }
      );
    }

    // Если fetch прошел успешно, продолжаем обработку
    console.log('🔄 Продолжаем обработку после успешного fetch', {
      responseStatus: response.status,
      hasResponseBody: !!responseBody,
      component: 'webhook-replay'
    });

    // Логируем результат
    console.log('🔄 Webhook запрос выполнен', {
      projectId,
      logId,
      endpoint,
      method,
      requestStatus: response.status,
      responseSuccess: response.ok,
      responseBody: safeJson(responseBody),
      component: 'webhook-replay'
    });

    // Проверяем, что у нас есть все необходимые данные
    if (!response || responseBody === undefined) {
      console.error(
        '❌ Критическая ошибка: response или responseBody не определены',
        {
          hasResponse: !!response,
          hasResponseBody: responseBody !== undefined,
          component: 'webhook-replay'
        }
      );

      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'INVALID_RESPONSE',
            message: 'Ответ от сервера не получен или поврежден'
          }
        },
        { status: 500 }
      );
    }

    // НЕ создаём лог здесь - webhook handler уже создаёт свой лог при обработке запроса
    // Это предотвращает дублирование логов

    return NextResponse.json({
      success: true,
      message: 'Запрос успешно выполнен',
      result: {
        status: response.status,
        success: response.ok,
        response: responseBody
      }
    });
  } catch (error) {
    console.error('❌ Ошибка при повторном выполнении webhook запроса:', {
      projectId: resolvedParams?.id || 'undefined',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      component: 'webhook-replay'
    });

    // Логируем ошибку
    console.error('❌ Ошибка при повторном выполнении webhook запроса:', {
      projectId: resolvedParams?.id || 'undefined',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      component: 'webhook-replay'
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'REPLAY_ERROR',
          message:
            error instanceof Error ? error.message : 'Неизвестная ошибка',
          details: error instanceof Error ? error.stack : String(error)
        }
      },
      { status: 500 }
    );
  }
}
