/**
 * @file: src/lib/services/workflow/node-handlers-registry.ts
 * @description: Плагинообразная система Node Handlers Registry
 * @project: SaaS Bonus System
 * @dependencies: ExecutionContext, WorkflowNode, ValidationResult
 * @created: 2025-01-13
 * @author: AI Assistant + User
 */

import type {
  NodeHandler,
  ValidationResult,
  WorkflowNode,
  WorkflowNodeType,
  ExecutionContext
} from '@/types/workflow';

/**
 * Реестр обработчиков нод workflow
 * Позволяет регистрировать обработчики по типам нод
 */
export class NodeHandlersRegistry {
  private handlers: Map<WorkflowNodeType, NodeHandler> = new Map();

  /**
   * Регистрирует обработчик для типа ноды
   */
  register(handler: NodeHandler): void {
    // Проверяем какие типы нод может обрабатывать этот handler
    const supportedTypes: WorkflowNodeType[] = [];

    // Проверяем все возможные типы нод
    const allNodeTypes: WorkflowNodeType[] = [
      // Триггеры
      'trigger.command',
      'trigger.message',
      'trigger.callback',
      'trigger.webhook',
      'trigger.contact',
      'trigger.schedule',
      // Сообщения
      'message',
      'message.keyboard.inline',
      'message.keyboard.reply',
      'message.photo',
      'message.video',
      'message.document',
      'message.edit',
      'message.delete',
      // Действия
      'action.api_request',
      'action.database_query',
      'action.set_variable',
      'action.get_variable',
      'action.request_contact',
      'action.send_notification',
      'action.check_user_linked',
      'action.find_user_by_contact',
      'action.link_telegram_account',
      'action.get_user_balance',
      'action.menu_command',
      'action.check_channel_subscription',
      // Партнёрские action-handlers (b2b-иерархия, Phase 4)
      'action.partner_team',
      'action.partner_subject_stats',
      'action.partner_payouts',
      'action.partner_link',
      'action.partner_org_summary',
      // Условия
      'condition',
      // Поток управления
      'flow.delay',
      'flow.loop',
      'flow.sub_workflow',
      'flow.jump',
      'flow.switch',
      'flow.end',
      // Интеграции
      'integration.webhook',
      'integration.analytics'
    ];

    for (const nodeType of allNodeTypes) {
      if (handler.canHandle(nodeType)) {
        supportedTypes.push(nodeType);
      }
    }

    // Регистрируем handler для каждого поддерживаемого типа
    for (const nodeType of supportedTypes) {
      if (this.handlers.has(nodeType)) {
        console.warn(
          `Handler for node type '${nodeType}' is already registered. Overwriting.`
        );
      }
      this.handlers.set(nodeType, handler);
    }

    console.log(
      `Registered handler for node types: ${supportedTypes.join(', ')}`
    );
  }

  /**
   * Получает обработчик для типа ноды
   */
  get(nodeType: WorkflowNodeType): NodeHandler | null {
    return this.handlers.get(nodeType) || null;
  }

  /**
   * Возвращает все зарегистрированные обработчики
   */
  list(): NodeHandler[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Проверяет, зарегистрирован ли обработчик для типа ноды
   */
  has(nodeType: WorkflowNodeType): boolean {
    return this.handlers.has(nodeType);
  }

  /**
   * Очищает реестр
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Глобальный экземпляр реестра
export const nodeHandlersRegistry = new NodeHandlersRegistry();
