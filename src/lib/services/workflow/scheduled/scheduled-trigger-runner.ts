/**
 * @file: src/lib/services/workflow/scheduled/scheduled-trigger-runner.ts
 * @description: Запускает workflow с trigger.schedule для конкретного пользователя.
 *               Используется cron-эндпоинтом `/api/cron/scheduled-triggers`.
 *               Делает дедупликацию через Redis (CacheService) — гарантия "не запустить дважды".
 * @project: SaaS Bonus System
 * @created: 2026-05-27
 * @author: AI Assistant + User
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { CacheService } from '@/lib/redis';
import { ExecutionContextManager } from '../execution-context-manager';
import { SimpleWorkflowProcessor } from '../../simple-workflow-processor';
import { initializeNodeHandlers } from '../handlers';
import { normalizeNodes } from '../utils/node-utils';
import { parseCron, cronMatches } from './cron-matcher';
import { AudienceResolver } from './audience-resolver';
import type {
  ScheduleTriggerConfig,
  WorkflowVersion,
  WorkflowNode,
  WorkflowConnection
} from '@/types/workflow';

const DEFAULT_TIMEZONE = 'UTC';

/** TTL дедупликации в секундах. */
const DEDUPE_TTL_SECONDS: Record<
  NonNullable<ScheduleTriggerConfig['dedupeWindow']>,
  number
> = {
  day: 26 * 60 * 60, // 26 часов — небольшой запас, чтобы пропустить ровно одно срабатывание
  week: 7 * 24 * 60 * 60 + 3600,
  month: 31 * 24 * 60 * 60,
  year: 366 * 24 * 60 * 60,
  none: 0
};

/** Дефолтное окно дедупликации для каждой аудитории. */
function defaultDedupeWindow(
  audienceType: string
): NonNullable<ScheduleTriggerConfig['dedupeWindow']> {
  return audienceType === 'birthday_today' ? 'year' : 'day';
}

interface ScheduledRunStats {
  /** Сколько активных workflow с trigger.schedule в системе. */
  workflowsScanned: number;
  /** Сколько workflow подходят под cron-расписание прямо сейчас. */
  workflowsMatched: number;
  /** Сколько уникальных запусков (один на пару workflow+user). */
  executionsStarted: number;
  /** Сколько пропусков из-за дедупликации. */
  dedupeSkipped: number;
  /** Сколько failed запусков. */
  executionsFailed: number;
}

interface ScheduledWorkflowEntry {
  workflowId: string;
  projectId: string;
  versionId: string;
  versionNumber: number;
  triggerNodeId: string;
  triggerConfig: ScheduleTriggerConfig;
  nodes: Record<string, WorkflowNode>;
  connections: WorkflowConnection[];
}

export class ScheduledTriggerRunner {
  /**
   * Главный метод: пройти по всем активным workflow с trigger.schedule и запустить
   * те, чьё cron-выражение совпадает с `now`.
   */
  static async runDueWorkflows(
    now: Date = new Date()
  ): Promise<ScheduledRunStats> {
    initializeNodeHandlers();

    const stats: ScheduledRunStats = {
      workflowsScanned: 0,
      workflowsMatched: 0,
      executionsStarted: 0,
      dedupeSkipped: 0,
      executionsFailed: 0
    };

    const candidates = await this.findScheduledWorkflows();
    stats.workflowsScanned = candidates.length;

    for (const entry of candidates) {
      try {
        const matches = this.cronMatchesNow(entry.triggerConfig, now);
        if (!matches) continue;
        stats.workflowsMatched++;

        await this.runForWorkflow(entry, now, stats);
      } catch (error) {
        stats.executionsFailed++;
        logger.error('Scheduled trigger workflow failed', {
          workflowId: entry.workflowId,
          projectId: entry.projectId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return stats;
  }

  /**
   * Загружает все активные WorkflowVersion и фильтрует только те, у которых entry-нода
   * имеет тип `trigger.schedule`.
   */
  private static async findScheduledWorkflows(): Promise<
    ScheduledWorkflowEntry[]
  > {
    const versions = await db.workflowVersion.findMany({
      where: {
        isActive: true,
        workflow: { isActive: true }
      },
      include: {
        workflow: {
          select: {
            id: true,
            projectId: true,
            connections: true
          }
        }
      }
    });

    const entries: ScheduledWorkflowEntry[] = [];
    for (const v of versions) {
      const nodes = normalizeNodes(v.nodes);
      const entryNode = nodes[v.entryNodeId];
      if (!entryNode || entryNode.type !== 'trigger.schedule') continue;

      const config = entryNode.data?.config?.['trigger.schedule'];
      if (!config) {
        logger.warn('Workflow has trigger.schedule entry node without config', {
          workflowId: v.workflowId,
          versionId: v.id
        });
        continue;
      }

      entries.push({
        workflowId: v.workflowId,
        projectId: v.workflow.projectId,
        versionId: v.id,
        versionNumber: v.version,
        triggerNodeId: v.entryNodeId,
        triggerConfig: config,
        nodes,
        connections: (v.workflow.connections as any) || []
      });
    }

    return entries;
  }

  /**
   * Проверяет cron + tz конфига против `now`.
   * Возвращает false при ошибке парсинга (с логом).
   */
  private static cronMatchesNow(
    config: ScheduleTriggerConfig,
    now: Date
  ): boolean {
    try {
      const parsed = parseCron(config.cron);
      const tz = config.timezone || DEFAULT_TIMEZONE;
      return cronMatches(parsed, now, tz);
    } catch (error) {
      logger.error('Invalid cron expression in scheduled trigger', {
        cron: config.cron,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Запускает workflow для всех пользователей под фильтр аудитории.
   */
  private static async runForWorkflow(
    entry: ScheduledWorkflowEntry,
    now: Date,
    stats: ScheduledRunStats
  ): Promise<void> {
    const audience = await AudienceResolver.resolve(
      entry.projectId,
      entry.triggerConfig.audience
    );

    if (audience.userIds.length === 0) {
      logger.info('Scheduled trigger has empty audience', {
        workflowId: entry.workflowId,
        audienceType: audience.type
      });
      return;
    }

    logger.info('Scheduled trigger running', {
      workflowId: entry.workflowId,
      projectId: entry.projectId,
      audienceType: audience.type,
      audienceSize: audience.total,
      cron: entry.triggerConfig.cron
    });

    const dedupeWindow =
      entry.triggerConfig.dedupeWindow ?? defaultDedupeWindow(audience.type);

    for (const userId of audience.userIds) {
      try {
        const skip = await this.shouldSkipDueDedupe(
          entry,
          userId,
          dedupeWindow,
          now
        );
        if (skip) {
          stats.dedupeSkipped++;
          continue;
        }

        await this.executeForUser(entry, userId);
        stats.executionsStarted++;

        await this.markRun(entry, userId, dedupeWindow, now);
      } catch (error) {
        stats.executionsFailed++;
        logger.error('Scheduled trigger user execution failed', {
          workflowId: entry.workflowId,
          userId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * Запуск workflow для одного пользователя.
   * Создаёт scheduled-context, прогоняет начиная с триггер-ноды через resumeWorkflow.
   */
  private static async executeForUser(
    entry: ScheduledWorkflowEntry,
    userId: string
  ): Promise<void> {
    const context = await ExecutionContextManager.createScheduledContext({
      projectId: entry.projectId,
      workflowId: entry.workflowId,
      version: entry.versionNumber,
      userId,
      triggerNodeId: entry.triggerNodeId
    });

    const workflowVersion: WorkflowVersion = {
      id: entry.versionId,
      workflowId: entry.workflowId,
      version: entry.versionNumber,
      nodes: entry.nodes,
      entryNodeId: entry.triggerNodeId,
      connections: entry.connections,
      isActive: true,
      createdAt: new Date()
    };

    const processor = new SimpleWorkflowProcessor(
      workflowVersion,
      entry.projectId
    );
    await processor.resumeWorkflow(context, entry.triggerNodeId);
  }

  /**
   * Ключ дедупликации для пары workflow+user.
   * Включает версию workflow — если опубликована новая версия, дедуп начинается с нуля.
   */
  private static dedupeKey(
    entry: ScheduledWorkflowEntry,
    userId: string,
    bucket: string
  ): string {
    return `scheduled:${entry.workflowId}:v${entry.versionNumber}:${userId}:${bucket}`;
  }

  /**
   * Bucket — текстовая метка временного окна, в рамках которого запуск считается одним и тем же.
   * Для year — `2026`, для day — `2026-05-27` и т.д.
   */
  private static bucketLabel(
    window: NonNullable<ScheduleTriggerConfig['dedupeWindow']>,
    now: Date
  ): string {
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    switch (window) {
      case 'year':
        return `${y}`;
      case 'month':
        return `${y}-${m}`;
      case 'week': {
        // ISO week через простой подсчёт: четверг текущей недели → год + неделя
        const target = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
        );
        const dayNum = (target.getUTCDay() + 6) % 7;
        target.setUTCDate(target.getUTCDate() - dayNum + 3);
        const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
        const week =
          1 +
          Math.round(
            ((target.getTime() - firstThursday.getTime()) / 86400000 -
              3 +
              ((firstThursday.getUTCDay() + 6) % 7)) /
              7
          );
        return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
      }
      case 'day':
      default:
        return `${y}-${m}-${d}`;
    }
  }

  private static async shouldSkipDueDedupe(
    entry: ScheduledWorkflowEntry,
    userId: string,
    window: NonNullable<ScheduleTriggerConfig['dedupeWindow']>,
    now: Date
  ): Promise<boolean> {
    if (window === 'none') return false;
    const bucket = this.bucketLabel(window, now);
    const key = this.dedupeKey(entry, userId, bucket);
    const existing = await CacheService.get<{ at: string }>(key);
    return existing !== null;
  }

  private static async markRun(
    entry: ScheduledWorkflowEntry,
    userId: string,
    window: NonNullable<ScheduleTriggerConfig['dedupeWindow']>,
    now: Date
  ): Promise<void> {
    if (window === 'none') return;
    const bucket = this.bucketLabel(window, now);
    const key = this.dedupeKey(entry, userId, bucket);
    const ttl = DEDUPE_TTL_SECONDS[window];
    await CacheService.set(key, { at: now.toISOString() }, ttl);
  }
}
