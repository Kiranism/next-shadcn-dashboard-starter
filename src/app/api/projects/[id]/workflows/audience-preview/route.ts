/**
 * @file: src/app/api/projects/[id]/workflows/audience-preview/route.ts
 * @description: Preview API для редактора workflow — возвращает размер аудитории
 *               для заданного AudienceConfig. Помогает админу убедиться, что под
 *               условие попадает ожидаемое число пользователей перед активацией.
 * @project: SaaS Bonus System
 * @created: 2026-05-27
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getCurrentAdmin } from '@/lib/auth';
import { ProjectService } from '@/lib/services/project.service';
import { AudienceResolver } from '@/lib/services/workflow/scheduled/audience-resolver';

const audienceSchema = z.object({
  type: z.enum([
    'birthday_today',
    'birthday_in_days',
    'birthday_after_days',
    'all_active_users'
  ]),
  params: z
    .object({
      daysBefore: z.number().int().min(1).max(365).optional(),
      daysAfter: z.number().int().min(1).max(365).optional()
    })
    .optional()
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await context.params;
    await ProjectService.verifyProjectAccess(projectId, admin.sub);

    const body = await request.json();
    const parsed = audienceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid audience config',
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const result = await AudienceResolver.resolve(projectId, parsed.data);

    return NextResponse.json({
      type: result.type,
      total: result.total,
      // Возвращаем только превью идентификаторов (первые 10) — для UI достаточно
      sampleUserIds: result.userIds.slice(0, 10)
    });
  } catch (error) {
    logger.error('Audience preview failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      {
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
