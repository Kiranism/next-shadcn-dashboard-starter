/**
 * @file: src/app/api/projects/[id]/hierarchy/export/route.ts
 * @description: GET — CSV-экспорт партнёрской иерархии.
 *               Колонки: id, name, role, parent_name, registered_at,
 *               total_purchases, commission_earned.
 *               (b2b-referral-hierarchy Phase 6.13)
 *
 *               Заголовки строк — на русском, разделитель — точка с запятой
 *               (для корректного открытия в Excel с RU-локалью). Кодировка
 *               UTF-8 с BOM, чтобы Excel не уродовал кириллицу.
 *
 * @project: SaaS Bonus System
 * @dependencies: getHierarchyTree
 * @created: 2026-05-24
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';

import { getCurrentAdmin } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ProjectService } from '@/lib/services/project.service';
import {
  getHierarchyTree,
  type HierarchyPeriod
} from '@/app/dashboard/projects/[id]/referral/hierarchy/data-access';

const VALID_PERIODS: HierarchyPeriod[] = ['today', '7d', '30d', 'all'];

const ROLE_LABEL: Record<string, string> = {
  CLIENT: 'Клиент',
  TRAINER: 'Тренер',
  MANAGER: 'Менеджер',
  DIRECTOR: 'Руководитель'
};

/**
 * Экранирует значение для CSV (RFC 4180): оборачивает в кавычки если есть
 * запятая, точка с запятой, перевод строки или кавычка; кавычки внутри
 * удваиваются.
 */
function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[;,"\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = await context.params;
  try {
    await ProjectService.verifyProjectAccess(projectId, admin.sub);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const periodParam = (url.searchParams.get('period') ||
    '30d') as HierarchyPeriod;
  const period: HierarchyPeriod = VALID_PERIODS.includes(periodParam)
    ? periodParam
    : '30d';

  try {
    const tree = await getHierarchyTree(projectId, { period });

    // Маппинг id → name для подстановки parent_name.
    const nameById = new Map(tree.nodes.map((n) => [n.id, n.name]));

    const header = [
      'id',
      'Имя',
      'Роль',
      'Родитель',
      'Дата регистрации',
      'Сумма покупок',
      'Заработанная комиссия'
    ];

    const rows = tree.nodes.map((n) => [
      n.id,
      n.name,
      ROLE_LABEL[n.partnerRole] ?? n.partnerRole,
      n.parentId ? (nameById.get(n.parentId) ?? n.parentId) : '',
      // YYYY-MM-DD HH:mm — компактно для отчёта
      new Date(n.registeredAt).toISOString().replace('T', ' ').slice(0, 16),
      n.totalPurchasesPeriod.toFixed(2),
      n.commissionEarned.toFixed(2)
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map(csvEscape).join(';'))
      .join('\r\n');

    // BOM + UTF-8 — чтобы Excel правильно показывал кириллицу.
    const body = '\uFEFF' + csv;
    const date = new Date().toISOString().slice(0, 10);
    const filename = `hierarchy-${projectId}-${date}.csv`;

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    logger.error('GET /api/projects/[id]/hierarchy/export failed', {
      projectId,
      error: error instanceof Error ? error.message : String(error),
      component: 'hierarchy-export-api'
    });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
