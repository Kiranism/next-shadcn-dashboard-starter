/**
 * @file: src/lib/with-project-access.ts
 * @description: HOF-обёртка для роутов /api/projects/[id]/** — единая проверка
 *   авторизации и владения проектом (мультитенантная изоляция).
 * @project: SaaS Bonus System
 * @dependencies: next/server, @/lib/auth, ProjectService
 * @created: 2026-05-29
 *
 * Зачем: middleware проверяет только наличие валидного JWT, но НЕ владение
 * проектом. Без этой обёртки любой залогиненный админ мог читать/менять
 * данные чужого проекта (cross-tenant IDOR). Обёртка:
 *   1. Достаёт текущего админа (401, если нет сессии).
 *   2. Резолвит `params.id` (projectId).
 *   3. Вызывает ProjectService.verifyProjectAccess → 403, если проект не
 *      существует ИЛИ не принадлежит админу.
 *   4. Прокидывает в хендлер исходный `params` (Promise — чтобы тела вида
 *      `await params` / `await context.params` продолжали работать) плюс
 *      готовые `admin` и `projectId`.
 *
 * Совместимо с rate-limit: `withApiRateLimit(withProjectAccess(handler))`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, type JwtPayload } from '@/lib/auth';
import { ProjectService } from '@/lib/services/project.service';
import { logger } from '@/lib/logger';

export type ProjectAccessContext<P extends { id: string } = { id: string }> = {
  /** Исходный Promise параметров маршрута (как в нативном Next-хендлере). */
  params: Promise<P>;
  /** Текущий авторизованный админ. */
  admin: JwtPayload;
  /** Уже зарезолвленный и проверенный id проекта. */
  projectId: string;
};

export function withProjectAccess<P extends { id: string } = { id: string }>(
  handler: (
    request: NextRequest,
    context: ProjectAccessContext<P>
  ) => Promise<NextResponse> | NextResponse
) {
  return async (
    request: NextRequest,
    ctx: { params: Promise<P> }
  ): Promise<NextResponse> => {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let projectId: string;
    try {
      const params = await ctx.params;
      projectId = params.id;
    } catch {
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    try {
      await ProjectService.verifyProjectAccess(projectId, admin.sub);
    } catch (error) {
      // verifyProjectAccess бросает 'FORBIDDEN' и для несуществующего, и для
      // чужого проекта — отвечаем 403, не раскрывая факт существования.
      if (error instanceof Error && error.message === 'FORBIDDEN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      logger.error('withProjectAccess: unexpected error verifying access', {
        projectId,
        adminId: admin.sub,
        error: error instanceof Error ? error.message : String(error)
      });
      return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
        { status: 500 }
      );
    }

    return handler(request, { params: ctx.params, admin, projectId });
  };
}

/**
 * Императивный guard для ретрофита существующих хендлеров с минимальным диффом.
 *
 * Использование в начале хендлера (паттерн раннего возврата):
 *
 *   const access = await requireProjectAccess(params);
 *   if (access instanceof NextResponse) return access;
 *   const { admin, projectId } = access;
 *
 * Возвращает либо `{ admin, projectId }`, либо готовый `NextResponse`
 * (401/403/400/500), который хендлер должен сразу вернуть.
 *
 * Принимает как Promise параметров (Next 15+), так и уже зарезолвленный объект.
 */
export async function requireProjectAccess(
  params: Promise<{ id: string }> | { id: string }
): Promise<{ admin: JwtPayload; projectId: string } | NextResponse> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let projectId: string;
  try {
    const resolved = await params;
    projectId = resolved.id;
  } catch {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }

  if (!projectId) {
    return NextResponse.json(
      { error: 'projectId is required' },
      { status: 400 }
    );
  }

  try {
    await ProjectService.verifyProjectAccess(projectId, admin.sub);
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    logger.error('requireProjectAccess: unexpected error verifying access', {
      projectId,
      adminId: admin.sub,
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }

  return { admin, projectId };
}
