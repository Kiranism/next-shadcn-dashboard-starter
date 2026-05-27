/**
 * @file: src/lib/services/workflow/handlers/trigger-handlers.ts
 * @description: Обработчики для trigger нод
 * @project: SaaS Bonus System
 * @dependencies: BaseNodeHandler, ExecutionContext
 * @created: 2025-01-13
 * @author: AI Assistant + User
 */

import { BaseNodeHandler } from './base-handler';
import type {
  WorkflowNode,
  WorkflowNodeType,
  ExecutionContext,
  ValidationResult
} from '@/types/workflow';
import { RegexValidator } from '@/lib/security/regex-validator';

/**
 * Обработчик для trigger.command
 */
export class CommandTriggerHandler extends BaseNodeHandler {
  canHandle(nodeType: WorkflowNodeType): boolean {
    return nodeType === 'trigger.command';
  }

  async execute(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<string | null> {
    this.logStep(context, node, 'Executing command trigger', 'debug', {
      command: node.data.config?.['trigger.command']?.command
    });

    // Trigger ноды просто передают управление следующей ноде
    // Логика триггера уже проверена до вызова этого handler'а
    // Следующий нод определяется по connections
    return null;
  }

  async validate(config: any): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!config?.command || typeof config.command !== 'string') {
      errors.push('Command is required and must be a string');
    }

    if (config.command && !config.command.startsWith('/')) {
      errors.push('Command must start with "/"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Обработчик для trigger.message
 */
export class MessageTriggerHandler extends BaseNodeHandler {
  canHandle(nodeType: WorkflowNodeType): boolean {
    return nodeType === 'trigger.message';
  }

  async execute(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<string | null> {
    this.logStep(context, node, 'Executing message trigger', 'debug', {
      pattern: node.data.config?.['trigger.message']?.pattern
    });

    // Следующий нод определяется по connections
    return null;
  }

  async validate(config: any): Promise<ValidationResult> {
    const errors: string[] = [];

    // Message trigger может работать без паттерна (любое сообщение)
    // или с паттерном регулярного выражения
    if (config?.pattern && typeof config.pattern !== 'string') {
      errors.push('Pattern must be a string');
    }

    // ✅ ReDoS защита: валидация regex паттерна
    if (
      config?.pattern &&
      typeof config.pattern === 'string' &&
      config.pattern.trim()
    ) {
      const validation = RegexValidator.validate(config.pattern, config.flags);
      if (!validation.isValid) {
        errors.push(
          `Invalid or unsafe regex pattern: ${validation.error || 'Unknown error'}`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Обработчик для trigger.callback
 */
export class CallbackTriggerHandler extends BaseNodeHandler {
  canHandle(nodeType: WorkflowNodeType): boolean {
    return nodeType === 'trigger.callback';
  }

  async execute(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<string | null> {
    this.logStep(context, node, 'Executing callback trigger', 'debug', {
      callbackData: node.data.config?.['trigger.callback']?.callbackData
    });

    // ✅ Ответ на callback query теперь обрабатывается в middleware (bot.ts)
    // для предотвращения race conditions и дублирования

    // Следующий нод определяется по connections
    return null;
  }

  async validate(config: any): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!config?.callbackData || typeof config.callbackData !== 'string') {
      errors.push('Callback data is required and must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Обработчик для trigger.webhook
 */
export class WebhookTriggerHandler extends BaseNodeHandler {
  canHandle(nodeType: WorkflowNodeType): boolean {
    return nodeType === 'trigger.webhook';
  }

  async execute(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<string | null> {
    this.logStep(context, node, 'Webhook trigger executed', 'debug', {
      method: node.data.config?.['trigger.webhook']?.method || 'POST'
    });

    // Webhook триггеры активируются внешним запросом, handler просто передает управление дальше
    return null;
  }

  async validate(config: any): Promise<ValidationResult> {
    const errors: string[] = [];
    if (!config?.webhookUrl) {
      errors.push('webhookUrl is required');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Обработчик для trigger.contact
 * Срабатывает когда пользователь делится контактом (номером телефона)
 */
export class ContactTriggerHandler extends BaseNodeHandler {
  canHandle(nodeType: WorkflowNodeType): boolean {
    return nodeType === 'trigger.contact';
  }

  async execute(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<string | null> {
    this.logStep(context, node, 'Contact trigger executed', 'debug', {
      hasContact: !!(context as any).telegram?.contact
    });

    // Contact триггер активируется когда пользователь делится контактом
    // Данные контакта уже доступны в context.telegram.contact
    return null;
  }

  async validate(config: any): Promise<ValidationResult> {
    // Contact trigger не требует конфигурации
    return {
      isValid: true,
      errors: []
    };
  }
}

/**
 * Обработчик для trigger.schedule
 * Активируется cron-эндпоинтом `/api/cron/scheduled-triggers`.
 * При выполнении просто пропускает управление дальше — контекст уже подготовлен
 * `ScheduledTriggerRunner` (содержит userId, projectId и пустой Telegram-контекст).
 */
export class ScheduleTriggerHandler extends BaseNodeHandler {
  canHandle(nodeType: WorkflowNodeType): boolean {
    return nodeType === 'trigger.schedule';
  }

  async execute(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<string | null> {
    this.logStep(context, node, 'Schedule trigger executed', 'debug', {
      cron: node.data.config?.['trigger.schedule']?.cron,
      audienceType: node.data.config?.['trigger.schedule']?.audience?.type
    });
    return null;
  }

  async validate(config: any): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!config?.cron || typeof config.cron !== 'string') {
      errors.push('Cron expression is required and must be a string');
    } else {
      // Базовая структурная валидация: 5 полей через пробел
      const parts = config.cron.trim().split(/\s+/);
      if (parts.length !== 5) {
        errors.push(
          `Cron expression must have 5 fields (min hour day month weekday), got ${parts.length}`
        );
      }
    }

    if (!config?.audience || typeof config.audience !== 'object') {
      errors.push('Audience configuration is required');
    } else {
      const validTypes = [
        'birthday_today',
        'birthday_in_days',
        'all_active_users'
      ];
      if (!validTypes.includes(config.audience.type)) {
        errors.push(
          `Audience type must be one of: ${validTypes.join(', ')}, got "${config.audience.type}"`
        );
      }
      if (
        config.audience.type === 'birthday_in_days' &&
        (typeof config.audience.params?.daysBefore !== 'number' ||
          config.audience.params.daysBefore < 1 ||
          config.audience.params.daysBefore > 365)
      ) {
        errors.push(
          'Audience "birthday_in_days" requires params.daysBefore (1-365)'
        );
      }
    }

    if (
      config?.dedupeWindow &&
      !['day', 'week', 'month', 'year', 'none'].includes(config.dedupeWindow)
    ) {
      errors.push('Dedupe window must be one of: day, week, month, year, none');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
