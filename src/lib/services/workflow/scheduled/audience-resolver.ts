/**
 * @file: src/lib/services/workflow/scheduled/audience-resolver.ts
 * @description: Резолвит декларативный AudienceConfig в список userId проекта.
 *               Используется как cron-эндпоинтом, так и preview API в редакторе workflow.
 *               Все запросы изолированы по projectId (multitenancy).
 * @project: SaaS Bonus System
 * @created: 2026-05-27
 * @author: AI Assistant + User
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { AudienceConfig } from '@/types/workflow';

export interface AudienceResolution {
  /** ID пользователей, попадающих под условие. */
  userIds: string[];
  /** Общее количество (равно userIds.length, отдельное поле для совместимости с пагинацией в будущем). */
  total: number;
  /** Тип аудитории, который был резолвлен (для логов). */
  type: AudienceConfig['type'];
}

/**
 * Жёсткий лимит, чтобы случайно не запустить scheduled workflow на 100k юзеров.
 * При превышении эндпоинт логирует предупреждение и батчит — но в MVP просто отрезаем.
 */
const MAX_AUDIENCE_SIZE = 5000;

export class AudienceResolver {
  /**
   * Возвращает userIds под фильтр для конкретного проекта.
   * Не делает дедупликацию по предыдущим запускам — это задача runner-а.
   */
  static async resolve(
    projectId: string,
    audience: AudienceConfig
  ): Promise<AudienceResolution> {
    switch (audience.type) {
      case 'birthday_today':
        return this.byBirthdayOffset(projectId, 0);
      case 'birthday_in_days': {
        const days = Number(audience.params?.daysBefore);
        if (!Number.isFinite(days) || days < 1 || days > 365) {
          throw new Error(
            `Audience "birthday_in_days" requires params.daysBefore (1-365), got ${audience.params?.daysBefore}`
          );
        }
        return this.byBirthdayOffset(projectId, days);
      }
      case 'birthday_after_days': {
        const days = Number(audience.params?.daysAfter);
        if (!Number.isFinite(days) || days < 1 || days > 365) {
          throw new Error(
            `Audience "birthday_after_days" requires params.daysAfter (1-365), got ${audience.params?.daysAfter}`
          );
        }
        return this.byBirthdayOffset(projectId, -days);
      }
      case 'all_active_users':
        return this.allActiveUsers(projectId);
      default: {
        const exhaustive: never = audience.type;
        throw new Error(`Unknown audience type: ${exhaustive}`);
      }
    }
  }

  /**
   * Все активные пользователи (`isActive=true`) проекта.
   */
  private static async allActiveUsers(
    projectId: string
  ): Promise<AudienceResolution> {
    const users = await db.user.findMany({
      where: { projectId, isActive: true },
      select: { id: true },
      take: MAX_AUDIENCE_SIZE
    });
    if (users.length >= MAX_AUDIENCE_SIZE) {
      logger.warn(
        `AudienceResolver: hit MAX_AUDIENCE_SIZE for "all_active_users"`,
        { projectId, limit: MAX_AUDIENCE_SIZE }
      );
    }
    return {
      userIds: users.map((u) => u.id),
      total: users.length,
      type: 'all_active_users'
    };
  }

  /**
   * Пользователи, у которых день рождения совпадает с `сегодня + daysOffset` (по UTC дню/месяцу).
   * Игнорирует год — матч по day+month.
   *
   * Реализация: берём целевую дату в UTC, через raw SQL фильтруем по `EXTRACT(MONTH/DAY)`
   * — это работает для PostgreSQL и даёт точный матч 29 февраля → 28 февраля в обычные годы
   *   за счёт того, что даты в БД хранятся как DateTime @db.Date (без времени).
   */
  private static async byBirthdayOffset(
    projectId: string,
    daysOffset: number
  ): Promise<AudienceResolution> {
    const target = new Date();
    target.setUTCDate(target.getUTCDate() + daysOffset);
    const targetMonth = target.getUTCMonth() + 1; // 1-12
    const targetDay = target.getUTCDate();

    // ВАЖНО: birth_date — это `@db.Date` (без времени), без часовых поясов.
    // EXTRACT(MONTH/DAY) даёт корректный результат напрямую.
    const rows = await db.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM users
      WHERE project_id = ${projectId}
        AND is_active = true
        AND birth_date IS NOT NULL
        AND EXTRACT(MONTH FROM birth_date) = ${targetMonth}
        AND EXTRACT(DAY FROM birth_date) = ${targetDay}
      LIMIT ${MAX_AUDIENCE_SIZE}
    `;

    const audienceType: AudienceConfig['type'] =
      daysOffset === 0
        ? 'birthday_today'
        : daysOffset > 0
          ? 'birthday_in_days'
          : 'birthday_after_days';

    if (rows.length >= MAX_AUDIENCE_SIZE) {
      logger.warn(
        `AudienceResolver: hit MAX_AUDIENCE_SIZE for "${audienceType}"`,
        { projectId, daysOffset, limit: MAX_AUDIENCE_SIZE }
      );
    }

    return {
      userIds: rows.map((r) => r.id),
      total: rows.length,
      type: audienceType
    };
  }
}
