/**
 * @file: src/app/api/projects/[id]/route.ts
 * @description: API для работы с отдельным проектом (GET, PUT, DELETE)
 * @project: SaaS Bonus System
 * @dependencies: Next.js App Router, Prisma, ProjectService
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ProjectService } from '@/lib/services/project.service';
import { getCurrentAdmin } from '@/lib/auth';
import { botManager } from '@/lib/telegram/bot-manager';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let admin: Awaited<ReturnType<typeof getCurrentAdmin>> = null;
  let projectId: string = '';

  try {
    admin = await getCurrentAdmin();
    if (!admin) {
      logger.warn('GET /api/projects/[id]: Unauthorized - admin not found', {
        component: 'projects-api',
        action: 'GET'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    projectId = id;

    logger.info('GET /api/projects/[id]: начало запроса', {
      projectId: id,
      adminId: admin.sub,
      component: 'projects-api'
    });

    // Проверяем доступ к проекту
    await ProjectService.verifyProjectAccess(id, admin.sub);

    // Получаем проект со связанными данными
    // Безопасная загрузка referralProgram - если его нет или есть ошибка, просто не включаем
    let project;
    try {
      project = await db.project.findUnique({
        where: { id },
        include: {
          referralProgram: {
            include: {
              levels: true
            }
          }
        }
      });
    } catch (dbError) {
      // Если ошибка при загрузке referralProgram, пробуем загрузить без него
      logger.warn(
        'Ошибка при загрузке referralProgram, загружаем проект без него',
        {
          projectId: id,
          error: dbError instanceof Error ? dbError.message : String(dbError),
          component: 'projects-api'
        }
      );

      project = await db.project.findUnique({
        where: { id }
      });

      if (project) {
        (project as any).referralProgram = null;
      }
    }

    if (!project) {
      logger.warn('GET /api/projects/[id]: проект не найден', {
        projectId: id,
        adminId: admin.sub,
        component: 'projects-api'
      });
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Подсчитываем количество пользователей отдельно
    const userCount = await db.user.count({
      where: { projectId: id }
    });

    // Читаем bonusMode через raw SQL (Prisma-клиент может не знать о колонке
    // если миграция 20260309_add_bonus_mode не применена)
    let bonusModeValue: string | undefined;
    try {
      const bonusModeResult = await db.$queryRaw<
        Array<{ bonus_mode: string }>
      >`SELECT bonus_mode FROM projects WHERE id = ${id}`;
      if (bonusModeResult.length > 0 && bonusModeResult[0].bonus_mode) {
        // Маппинг из БД-значения в enum-значение приложения
        const dbValue = bonusModeResult[0].bonus_mode;
        bonusModeValue = dbValue === 'levels' ? 'LEVELS' : 'SIMPLE';
      }
    } catch {
      // Колонка не существует — не добавляем bonusMode в ответ
      logger.warn(
        'Не удалось прочитать bonusMode из БД (возможно миграция не применена)',
        { projectId: id, component: 'projects-api' }
      );
    }

    // Возвращаем проект с подсчетом пользователей и bonusMode
    const response = {
      ...project,
      ...(bonusModeValue !== undefined && { bonusMode: bonusModeValue }),
      _count: {
        users: userCount
      }
    };

    logger.info('GET /api/projects/[id]: успешно', {
      projectId: id,
      adminId: admin.sub,
      bonusMode: bonusModeValue,
      component: 'projects-api'
    });

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Неизвестная ошибка';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Обработка ошибок доступа
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      logger.warn('GET /api/projects/[id]: Forbidden', {
        projectId: projectId,
        adminId: admin?.sub,
        component: 'projects-api'
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Безопасное логирование
    try {
      logger.error('Ошибка получения проекта', {
        projectId: projectId,
        adminId: admin?.sub,
        error: errorMessage,
        stack: errorStack,
        component: 'projects-api',
        action: 'GET'
      });
    } catch (logError) {
      console.error('Ошибка получения проекта', {
        projectId: projectId,
        adminId: admin?.sub,
        error: errorMessage,
        stack: errorStack
      });
    }

    // В development режиме возвращаем детали ошибки
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: 'Внутренняя ошибка сервера',
        ...(isDev && { details: errorMessage, stack: errorStack })
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let id = '';
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    id = params.id;

    // Проверяем доступ к проекту
    await ProjectService.verifyProjectAccess(id, admin.sub);

    // Фиксируем текущий проект
    const existingProject = await db.project.findUnique({
      where: { id },
      select: { operationMode: true, domain: true }
    });

    const body = await request.json();

    logger.info('PUT /api/projects/[id]: получены данные', {
      projectId: id,
      adminId: admin.sub,
      bonusMode: body.bonusMode,
      bonusBehavior: body.bonusBehavior,
      operationMode: body.operationMode,
      welcomeRewardType: body.welcomeRewardType,
      component: 'projects-api'
    });

    // Валидация operationMode
    const validOperationModes = ['WITH_BOT', 'WITHOUT_BOT'];
    if (
      body.operationMode &&
      !validOperationModes.includes(body.operationMode)
    ) {
      return NextResponse.json(
        {
          error:
            'Недопустимое значение operationMode. Допустимые значения: WITH_BOT, WITHOUT_BOT'
        },
        { status: 400 }
      );
    }

    // Валидация bonusBehavior
    const validBonusBehaviors = ['SPEND_AND_EARN', 'SPEND_ONLY', 'EARN_ONLY'];
    if (
      body.bonusBehavior &&
      !validBonusBehaviors.includes(body.bonusBehavior)
    ) {
      return NextResponse.json(
        {
          error:
            'Недопустимое значение bonusBehavior. Допустимые значения: SPEND_AND_EARN, SPEND_ONLY, EARN_ONLY'
        },
        { status: 400 }
      );
    }

    // Валидация bonusMode
    const validBonusModes = ['SIMPLE', 'LEVELS'];
    if (body.bonusMode && !validBonusModes.includes(body.bonusMode)) {
      return NextResponse.json(
        {
          error:
            'Недопустимое значение bonusMode. Допустимые значения: SIMPLE, LEVELS'
        },
        { status: 400 }
      );
    }

    // Валидация welcomeRewardType
    const validWelcomeRewardTypes = ['BONUS', 'DISCOUNT'];
    if (
      body.welcomeRewardType &&
      !validWelcomeRewardTypes.includes(body.welcomeRewardType)
    ) {
      return NextResponse.json(
        {
          error:
            'Недопустимое значение welcomeRewardType. Допустимые значения: BONUS, DISCOUNT'
        },
        { status: 400 }
      );
    }

    // Строим объект данных для обновления
    // domain обновляем только если он реально изменился (во избежание unique constraint ошибок)
    const domainUpdate =
      body.domain !== undefined && body.domain !== existingProject?.domain
        ? { domain: body.domain || null }
        : {};

    // Основные поля — без bonusMode (он может отсутствовать если миграция не применена на сервере)
    const updateData: Record<string, unknown> = {
      ...domainUpdate,
      name: body.name,
      bonusPercentage: body.bonusPercentage,
      bonusExpiryDays: body.bonusExpiryDays,
      bonusBehavior: body.bonusBehavior,
      operationMode: body.operationMode,
      isActive: body.isActive,
      welcomeRewardType: body.welcomeRewardType,
      firstPurchaseDiscountPercent: body.firstPurchaseDiscountPercent,
      maxPaymentPercentage: body.maxPaymentPercentage,
      bonusMode: body.bonusMode
    };

    // Числовые поля — только если переданы
    if (body.welcomeBonusAmount !== undefined) {
      updateData.welcomeBonus = body.welcomeBonusAmount;
    }
    if (body.workflowMaxSteps !== undefined) {
      updateData.workflowMaxSteps = body.workflowMaxSteps;
    }
    if (body.workflowTimeoutMs !== undefined) {
      updateData.workflowTimeoutMs = body.workflowTimeoutMs;
    }

    // Основное обновление через Prisma
    const updatedProject = await db.project.update({
      where: { id },
      data: updateData as Parameters<typeof db.project.update>[0]['data']
    });

    // bonusMode обновляем через raw SQL — это обходит ограничение старого Prisma-клиента
    // на production-серверах где миграция 20260309_add_bonus_mode ещё не применена.
    // После применения миграции и пересборки клиента можно убрать этот блок
    // и вернуть bonusMode в updateData выше.
    if (body.bonusMode && ['SIMPLE', 'LEVELS'].includes(body.bonusMode)) {
      try {
        // Маппинг enum — Prisma использует mapped values в БД
        const dbBonusMode = body.bonusMode === 'LEVELS' ? 'levels' : 'simple';
        await db.$executeRawUnsafe(`
          UPDATE projects
          SET bonus_mode = '${dbBonusMode}'::bonus_mode
          WHERE id = '${id}'
        `);
        logger.info('bonusMode обновлён через raw SQL', {
          projectId: id,
          bonusMode: body.bonusMode,
          component: 'projects-api'
        });
      } catch (rawError) {
        // Колонка ещё не существует в БД — логируем предупреждение, не падаем
        logger.warn(
          'Не удалось обновить bonusMode через raw SQL (возможно миграция не применена)',
          {
            projectId: id,
            bonusMode: body.bonusMode,
            error:
              rawError instanceof Error ? rawError.message : String(rawError),
            component: 'projects-api',
            hint: 'Выполните: npx prisma migrate deploy на сервере'
          }
        );
      }
    }

    // Если режим изменился с WITH_BOT на WITHOUT_BOT — останавливаем бот идемпотентно
    if (
      existingProject?.operationMode === 'WITH_BOT' &&
      body.operationMode === 'WITHOUT_BOT'
    ) {
      try {
        await botManager.stopBot(id);
        logger.info('Бот остановлен после переключения на WITHOUT_BOT', {
          projectId: id,
          component: 'projects-api'
        });
      } catch (stopError) {
        logger.warn('Не удалось остановить бота после смены режима', {
          projectId: id,
          error:
            stopError instanceof Error ? stopError.message : String(stopError),
          component: 'projects-api'
        });
      }
    }

    logger.info('Проект обновлен', {
      projectId: id,
      operationMode: body.operationMode,
      welcomeRewardType: body.welcomeRewardType,
      component: 'projects-api'
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorCode = (error as Record<string, unknown>)?.code;
    const errorMeta = (error as Record<string, unknown>)?.meta;

    // Обработка ошибок доступа
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Обработка ошибки уникальности домена
    if (errorCode === 'P2002') {
      logger.warn('Домен уже занят другим проектом', {
        projectId: id,
        error: errorMeta,
        component: 'projects-api'
      });
      return NextResponse.json(
        { error: 'Этот домен уже используется другим проектом' },
        { status: 409 }
      );
    }

    try {
      logger.error('Ошибка обновления проекта', {
        projectId: id,
        error: errorMessage,
        code: errorCode,
        meta: errorMeta,
        stack: errorStack,
        component: 'projects-api'
      });
    } catch (logError) {
      console.error('Ошибка обновления проекта', {
        projectId: id,
        error: errorMessage,
        code: errorCode,
        stack: errorStack
      });
    }

    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: 'Внутренняя ошибка сервера',
        ...(isDev && {
          details: errorMessage,
          code: errorCode,
          stack: errorStack
        })
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id] — частичное обновление полей проекта.
 *
 * (b2b-referral-hierarchy Phase 6.15) — позволяет переключать
 * `enablePartnerRoles` со страницы настроек одной мутацией, без
 * дополнительных эндпоинтов и без отправки всей формы.
 *
 * Поддерживаемые поля (перечисляются явно — никакого `passthrough`):
 *  - `enablePartnerRoles: boolean`
 *
 * Расширять список можно по мере появления небольших точечных тогглов.
 * Для общих изменений (имя, домен, тариф и т.д.) использовать PUT выше.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let id = '';
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    id = params.id;

    await ProjectService.verifyProjectAccess(id, admin.sub);

    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (typeof body.enablePartnerRoles === 'boolean') {
      updateData.enablePartnerRoles = body.enablePartnerRoles;
    }

    if (typeof body.enablePartnerTeamManagement === 'boolean') {
      updateData.enablePartnerTeamManagement = body.enablePartnerTeamManagement;
    }

    if (typeof body.referralJoinRequiresApproval === 'boolean') {
      updateData.referralJoinRequiresApproval =
        body.referralJoinRequiresApproval;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Нет поддерживаемых полей для обновления' },
        { status: 400 }
      );
    }

    const updated = await db.project.update({
      where: { id },
      data: updateData as Parameters<typeof db.project.update>[0]['data']
    });

    logger.info('PATCH /api/projects/[id]: фрагмент обновлён', {
      projectId: id,
      adminId: admin.sub,
      fields: Object.keys(updateData),
      component: 'projects-api'
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    logger.error('PATCH /api/projects/[id]: ошибка', {
      projectId: id,
      error: error instanceof Error ? error.message : String(error),
      component: 'projects-api'
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Проверяем доступ к проекту
    await ProjectService.verifyProjectAccess(id, admin.sub);

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Удаляем проект (каскадное удаление настроено в схеме)
    await db.project.delete({
      where: { id }
    });

    logger.info('Проект удален', { projectId: id, projectName: project.name });

    return NextResponse.json(
      { message: 'Проект успешно удален' },
      { status: 200 }
    );
  } catch (error) {
    const { id } = await context.params;

    // Обработка ошибок доступа
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    logger.error('Ошибка удаления проекта', { projectId: id, error });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
