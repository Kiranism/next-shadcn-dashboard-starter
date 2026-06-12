/**
 * @file: src/lib/services/workflow/handlers/wait-for-input-handler.ts
 * @description: Унифицированный обработчик для ожидания ввода пользователя (waitForInput)
 * @project: SaaS Bonus System
 * @dependencies: ExecutionContext, ExecutionContextManager, WorkflowRuntimeService
 * @created: 2026-01-06
 * @author: AI Assistant + User
 */

import type { ExecutionContext, WorkflowNode } from '@/types/workflow';

/**
 * Тип ожидаемого ввода от пользователя
 */
export type WaitType = 'contact' | 'callback' | 'input' | 'location' | 'poll';

/**
 * Конфигурация для ожидания ввода пользователя
 */
export interface WaitForInputConfig {
  /** Тип ожидаемого ввода */
  waitType: WaitType;
  /** ID ноды, которая ожидает ввод */
  nodeId: string;
  /** Имя переменной для сохранения результата */
  variableName?: string;
  /** Таймаут ожидания в миллисекундах */
  timeoutMs?: number;
  /** Конфигурация клавиатуры (если есть) */
  keyboard?: any;
  /** Флаг явного ожидания ввода */
  waitForInput?: boolean;
  /** Дополнительные данные */
  metadata?: Record<string, any>;
}

/**
 * Результат проверки необходимости ожидания
 */
export interface WaitCheckResult {
  /** Нужно ли ждать ввода */
  shouldWait: boolean;
  /** Тип ожидания */
  waitType: WaitType | null;
  /** Причина ожидания (для логирования) */
  reason?: string;
}

/**
 * Результат установки состояния ожидания
 */
export interface WaitStateResult {
  /** Успешно ли установлено состояние */
  success: boolean;
  /** ID выполнения */
  executionId: string;
  /** Тип ожидания */
  waitType: WaitType;
  /** Ошибка (если есть) */
  error?: string;
}

/**
 * Специальное значение, возвращаемое при установке состояния ожидания
 */
export const WAITING_FOR_USER_INPUT = '__WAITING_FOR_USER_INPUT__';

/**
 * Унифицированный обработчик для ожидания ввода пользователя
 *
 * Централизует логику определения необходимости ожидания и установки
 * состояния waiting для различных типов нод (message, keyboard и т.д.)
 */
export class WaitForInputHandler {
  /**
   * Проверяет, нужно ли ждать ввода пользователя на основе конфигурации ноды
   *
   * @param node - Нода workflow
   * @param keyboardConfig - Конфигурация клавиатуры (опционально)
   * @returns Результат проверки с типом ожидания
   */
  static checkIfNeedsWaiting(
    node: WorkflowNode,
    keyboardConfig?: any
  ): WaitCheckResult {
    // 1. Проверяем явный флаг waitForInput в конфигурации сообщения
    const messageConfig = node.data?.config?.message;
    const explicitWaitForInput = messageConfig?.waitForInput === true;

    if (explicitWaitForInput) {
      return {
        shouldWait: true,
        waitType: 'input',
        reason: 'Explicit waitForInput flag set to true'
      };
    }

    // 2. Проверяем клавиатуру на необходимость ожидания
    if (keyboardConfig) {
      const keyboardResult = this.checkKeyboardForWaiting(keyboardConfig);
      if (keyboardResult.shouldWait) {
        return keyboardResult;
      }
    }

    // 3. Проверяем тип ноды
    const nodeType = node.type;

    // Ноды с inline клавиатурой всегда ждут callback
    if (nodeType === 'message.keyboard.inline') {
      return {
        shouldWait: true,
        waitType: 'callback',
        reason: 'Inline keyboard node always waits for callback'
      };
    }

    // Ноды с reply клавиатурой ждут ввода
    if (nodeType === 'message.keyboard.reply') {
      const replyConfig = node.data?.config?.['message.keyboard.reply'];
      const replyKeyboardResult = this.checkKeyboardForWaiting({
        type: 'reply',
        buttons: replyConfig?.buttons
      });
      return replyKeyboardResult;
    }

    // Ноды запроса контакта
    if (nodeType === 'action.request_contact') {
      return {
        shouldWait: true,
        waitType: 'contact',
        reason: 'Request contact action always waits for contact'
      };
    }

    return {
      shouldWait: false,
      waitType: null
    };
  }

  /**
   * Проверяет конфигурацию клавиатуры на необходимость ожидания
   *
   * @param keyboardConfig - Конфигурация клавиатуры
   * @returns Результат проверки
   */
  static checkKeyboardForWaiting(keyboardConfig: any): WaitCheckResult {
    if (!keyboardConfig || !keyboardConfig.buttons) {
      return { shouldWait: false, waitType: null };
    }

    const buttons = keyboardConfig.buttons;
    const keyboardType = keyboardConfig.type;

    // Проверяем все кнопки на специальные типы
    for (const row of buttons) {
      if (!Array.isArray(row)) continue;

      for (const button of row) {
        // Кнопка запроса контакта - высший приоритет
        if (button.request_contact) {
          return {
            shouldWait: true,
            waitType: 'contact',
            reason: 'Keyboard contains request_contact button'
          };
        }

        // Кнопка запроса локации
        if (button.request_location) {
          return {
            shouldWait: true,
            waitType: 'location',
            reason: 'Keyboard contains request_location button'
          };
        }

        // Кнопка запроса опроса
        if (button.request_poll) {
          return {
            shouldWait: true,
            waitType: 'poll',
            reason: 'Keyboard contains request_poll button'
          };
        }

        // Inline кнопки с callback_data
        if (button.callback_data && keyboardType === 'inline') {
          return {
            shouldWait: true,
            waitType: 'callback',
            reason: 'Inline keyboard with callback_data buttons'
          };
        }

        // Кнопки с goto_node (переход к другой ноде)
        if (button.goto_node) {
          return {
            shouldWait: true,
            waitType: 'callback',
            reason: 'Keyboard contains goto_node button'
          };
        }
      }
    }

    // Для reply клавиатур без специальных кнопок - ждём обычный ввод
    if (keyboardType === 'reply') {
      return {
        shouldWait: true,
        waitType: 'input',
        reason: 'Reply keyboard waits for text input'
      };
    }

    return { shouldWait: false, waitType: null };
  }

  /**
   * Устанавливает состояние ожидания для выполнения workflow
   *
   * @param context - Контекст выполнения
   * @param config - Конфигурация ожидания
   * @returns Результат установки состояния
   */
  static async setWaitingState(
    context: ExecutionContext,
    config: WaitForInputConfig
  ): Promise<WaitStateResult> {
    try {
      // Импортируем зависимости динамически для избежания циклических импортов
      const { ExecutionContextManager } = await import(
        '../execution-context-manager'
      );
      const { WorkflowRuntimeService } = await import(
        '../../workflow-runtime.service'
      );

      // Формируем payload для ожидания
      const waitPayload = {
        nodeId: config.nodeId,
        keyboard: config.keyboard,
        waitForInput: config.waitForInput,
        variableName: config.variableName,
        timeoutMs: config.timeoutMs,
        requestedAt: new Date(),
        metadata: config.metadata
      };

      // Обновляем состояние выполнения атомарно
      await ExecutionContextManager.updateExecutionState(context, {
        status: 'waiting',
        waitType: config.waitType,
        currentNodeId: config.nodeId,
        waitPayload
      });

      // Кэшируем waiting execution в Redis для быстрого поиска
      await WorkflowRuntimeService.cacheWaitingExecution(
        context.executionId,
        context.projectId,
        context.telegram.chatId || '',
        config.waitType
      );

      console.log(`[WaitForInputHandler] Set waiting state:`, {
        executionId: context.executionId,
        nodeId: config.nodeId,
        waitType: config.waitType
      });

      return {
        success: true,
        executionId: context.executionId,
        waitType: config.waitType
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.error(`[WaitForInputHandler] Failed to set waiting state:`, {
        executionId: context.executionId,
        nodeId: config.nodeId,
        error: errorMessage
      });

      return {
        success: false,
        executionId: context.executionId,
        waitType: config.waitType,
        error: errorMessage
      };
    }
  }

  /**
   * Создает конфигурацию ожидания из ноды и контекста
   *
   * @param node - Нода workflow
   * @param context - Контекст выполнения
   * @param keyboardConfig - Конфигурация клавиатуры (опционально)
   * @returns Конфигурация ожидания или null если ожидание не требуется
   */
  static createWaitConfig(
    node: WorkflowNode,
    context: ExecutionContext,
    keyboardConfig?: any
  ): WaitForInputConfig | null {
    const checkResult = this.checkIfNeedsWaiting(node, keyboardConfig);

    if (!checkResult.shouldWait || !checkResult.waitType) {
      return null;
    }

    const messageConfig = node.data?.config?.message;
    const nodeConfig = node.data?.config as any;

    return {
      waitType: checkResult.waitType,
      nodeId: node.id,
      // Используем опциональные свойства из конфигурации ноды
      variableName: nodeConfig?.variableName || nodeConfig?.assignTo,
      timeoutMs: nodeConfig?.timeoutMs || nodeConfig?.timeout,
      keyboard: keyboardConfig,
      waitForInput: messageConfig?.waitForInput,
      metadata: {
        nodeLabel: node.data?.label,
        nodeType: node.type,
        reason: checkResult.reason
      }
    };
  }

  /**
   * Обрабатывает ожидание ввода для ноды
   * Комбинирует проверку необходимости ожидания и установку состояния
   *
   * @param node - Нода workflow
   * @param context - Контекст выполнения
   * @param keyboardConfig - Конфигурация клавиатуры (опционально)
   * @returns Специальное значение WAITING_FOR_USER_INPUT если установлено ожидание, иначе null
   */
  static async handleWaitForInput(
    node: WorkflowNode,
    context: ExecutionContext,
    keyboardConfig?: any
  ): Promise<string | null> {
    const waitConfig = this.createWaitConfig(node, context, keyboardConfig);

    if (!waitConfig) {
      return null;
    }

    // Логируем для отладки
    console.log(`[WaitForInputHandler] Processing wait for input:`, {
      nodeId: node.id,
      nodeLabel: node.data?.label,
      waitType: waitConfig.waitType,
      reason: waitConfig.metadata?.reason
    });

    const result = await this.setWaitingState(context, waitConfig);

    if (result.success) {
      return WAITING_FOR_USER_INPUT;
    }

    console.error(
      `[WaitForInputHandler] Failed to set waiting state, pausing workflow anyway:`,
      {
        nodeId: node.id,
        error: result.error
      }
    );

    return WAITING_FOR_USER_INPUT;
  }

  /**
   * Определяет приоритетный тип ожидания из нескольких источников
   *
   * @param explicitWaitForInput - Явный флаг waitForInput
   * @param keyboardWaitResult - Результат проверки клавиатуры
   * @returns Приоритетный тип ожидания
   */
  static determineWaitType(
    explicitWaitForInput: boolean,
    keyboardWaitResult: WaitCheckResult
  ): WaitType | null {
    // Приоритет: contact > location > poll > callback > input
    if (keyboardWaitResult.waitType === 'contact') {
      return 'contact';
    }
    if (keyboardWaitResult.waitType === 'location') {
      return 'location';
    }
    if (keyboardWaitResult.waitType === 'poll') {
      return 'poll';
    }
    if (keyboardWaitResult.waitType === 'callback') {
      return 'callback';
    }
    if (explicitWaitForInput) {
      return 'input';
    }
    if (keyboardWaitResult.waitType === 'input') {
      return 'input';
    }
    return null;
  }
}
