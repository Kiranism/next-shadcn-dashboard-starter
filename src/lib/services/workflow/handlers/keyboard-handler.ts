/**
 * @file: src/lib/services/workflow/handlers/keyboard-handler.ts
 * @description: Централизованные обработчики для клавиатур (inline и reply)
 * @project: SaaS Bonus System
 * @dependencies: BaseNodeHandler, ExecutionContext, WaitForInputHandler, ProjectVariablesService
 * @created: 2025-10-14
 * @updated: 2026-01-06
 * @author: AI Assistant + User
 *
 * ВАЖНО: Вся логика построения клавиатур централизована в этом файле.
 * MessageHandler и другие обработчики должны делегировать построение клавиатур
 * статическим методам KeyboardBuilder.
 */

import { BaseNodeHandler } from './base-handler';
import { ProjectVariablesService } from '@/lib/services/project-variables.service';
import {
  ButtonActionsExecutor,
  type ButtonAction
} from '../button-actions-executor';
import { ButtonActionsRegistry } from '../button-actions-registry';
import {
  WaitForInputHandler,
  WAITING_FOR_USER_INPUT
} from './wait-for-input-handler';
import type {
  WorkflowNode,
  WorkflowNodeType,
  ExecutionContext,
  ValidationResult
} from '@/types/workflow';
import { sendPlatformMessage } from '../platform-messaging';

/**
 * Типы кнопок для inline клавиатуры
 */
export interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: { url: string };
  login_url?: { url: string };
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
  pay?: boolean;
  goto_node?: string; // ← Прямая связь с нодой (альтернатива триггерам)
}

/**
 * Конфигурация inline клавиатуры
 */
export interface InlineKeyboardConfig {
  text: string;
  buttons: InlineButton[][]; // Массив рядов кнопок
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_web_page_preview?: boolean;
}

/**
 * Дополнительные переменные для резолва в клавиатурах
 */
export interface KeyboardVariables {
  username?: string;
  first_name?: string;
  user_id?: string;
  chat_id?: string;
  workflow_id?: string;
  execution_id?: string;
  session_id?: string;
  [key: string]: string | undefined;
}

/**
 * ✨ ЦЕНТРАЛИЗОВАННЫЙ BUILDER ДЛЯ КЛАВИАТУР
 * Все обработчики должны использовать эти статические методы
 * для построения клавиатур вместо дублирования логики.
 */
export class KeyboardBuilder {
  /**
   * Построение inline клавиатуры с резолвом переменных
   * @param buttons - Массив рядов кнопок
   * @param projectId - ID проекта для резолва переменных
   * @param additionalVariables - Дополнительные переменные для подстановки
   * @returns Объект inline_keyboard для Telegram API
   */
  static async buildInlineKeyboard(
    buttons: InlineButton[][],
    projectId: string,
    additionalVariables: KeyboardVariables = {}
  ): Promise<{ inline_keyboard: InlineButton[][] }> {
    const processedRows: InlineButton[][] = [];

    for (const row of buttons) {
      const processedRow: InlineButton[] = [];

      for (const button of row) {
        const processedButton = await KeyboardBuilder.processInlineButton(
          button,
          projectId,
          additionalVariables
        );
        processedRow.push(processedButton);
      }

      processedRows.push(processedRow);
    }

    return { inline_keyboard: processedRows };
  }

  /**
   * Обработка одной inline кнопки с резолвом переменных
   */
  private static async processInlineButton(
    button: InlineButton,
    projectId: string,
    additionalVariables: KeyboardVariables
  ): Promise<InlineButton> {
    // Резолвим текст кнопки
    const resolvedText = await ProjectVariablesService.replaceVariablesInText(
      projectId,
      button.text,
      additionalVariables as Record<string, string>
    );

    const processedButton: InlineButton = {
      text: resolvedText
    };

    // Обрабатываем различные типы кнопок
    if (button.callback_data) {
      processedButton.callback_data =
        await ProjectVariablesService.replaceVariablesInText(
          projectId,
          button.callback_data,
          additionalVariables as Record<string, string>
        );
    }

    if (button.url) {
      processedButton.url =
        await ProjectVariablesService.replaceVariablesInText(
          projectId,
          button.url,
          additionalVariables as Record<string, string>
        );
    }

    if (button.web_app) {
      processedButton.web_app = {
        url: await ProjectVariablesService.replaceVariablesInText(
          projectId,
          button.web_app.url,
          additionalVariables as Record<string, string>
        )
      };
    }

    if (button.login_url) {
      processedButton.login_url = {
        url: await ProjectVariablesService.replaceVariablesInText(
          projectId,
          button.login_url.url,
          additionalVariables as Record<string, string>
        )
      };
    }

    if (button.switch_inline_query !== undefined) {
      processedButton.switch_inline_query =
        await ProjectVariablesService.replaceVariablesInText(
          projectId,
          button.switch_inline_query,
          additionalVariables as Record<string, string>
        );
    }

    if (button.switch_inline_query_current_chat !== undefined) {
      processedButton.switch_inline_query_current_chat =
        await ProjectVariablesService.replaceVariablesInText(
          projectId,
          button.switch_inline_query_current_chat,
          additionalVariables as Record<string, string>
        );
    }

    if (button.pay) {
      processedButton.pay = true;
    }

    // Для goto_node используем callback_data с префиксом
    if (button.goto_node) {
      processedButton.callback_data = `goto:${button.goto_node}`;
    }

    return processedButton;
  }

  /**
   * Построение reply клавиатуры с резолвом переменных
   * @param buttons - Массив рядов кнопок
   * @param config - Дополнительные настройки клавиатуры
   * @param projectId - ID проекта для резолва переменных
   * @param additionalVariables - Дополнительные переменные для подстановки
   * @returns Объект reply_markup для Telegram API
   */
  static async buildReplyKeyboard(
    buttons: ReplyButton[][],
    config: {
      resize_keyboard?: boolean;
      one_time_keyboard?: boolean;
      input_field_placeholder?: string;
      selective?: boolean;
    },
    projectId: string,
    additionalVariables: KeyboardVariables = {}
  ): Promise<{
    keyboard: ReplyButton[][];
    resize_keyboard: boolean;
    one_time_keyboard: boolean;
    input_field_placeholder?: string;
    selective: boolean;
  }> {
    const processedRows: ReplyButton[][] = [];

    for (const row of buttons) {
      const processedRow: ReplyButton[] = [];

      for (const button of row) {
        const processedButton = await KeyboardBuilder.processReplyButton(
          button,
          projectId,
          additionalVariables
        );
        processedRow.push(processedButton);
      }

      processedRows.push(processedRow);
    }

    return {
      keyboard: processedRows,
      resize_keyboard: config.resize_keyboard !== false, // По умолчанию true
      one_time_keyboard: config.one_time_keyboard || false,
      input_field_placeholder: config.input_field_placeholder,
      selective: config.selective || false
    };
  }

  /**
   * Обработка одной reply кнопки с резолвом переменных
   */
  private static async processReplyButton(
    button: ReplyButton,
    projectId: string,
    additionalVariables: KeyboardVariables
  ): Promise<ReplyButton> {
    // Резолвим текст кнопки
    const resolvedText = await ProjectVariablesService.replaceVariablesInText(
      projectId,
      button.text,
      additionalVariables as Record<string, string>
    );

    const processedButton: ReplyButton = {
      text: resolvedText
    };

    if (button.request_contact) {
      processedButton.request_contact = true;
    }

    if (button.request_location) {
      processedButton.request_location = true;
    }

    if (button.request_poll) {
      processedButton.request_poll = button.request_poll;
    }

    if (button.web_app) {
      processedButton.web_app = {
        url: await ProjectVariablesService.replaceVariablesInText(
          projectId,
          button.web_app.url,
          additionalVariables as Record<string, string>
        )
      };
    }

    // Сохраняем actions для регистрации
    if (button.actions) {
      processedButton.actions = button.actions;
    }

    return processedButton;
  }

  /**
   * Универсальный метод для построения клавиатуры любого типа
   * @param config - Конфигурация клавиатуры с типом и кнопками
   * @param projectId - ID проекта
   * @param additionalVariables - Дополнительные переменные
   * @returns Объект reply_markup для Telegram API или null
   */
  static async buildKeyboard(
    config:
      | {
          type?: 'inline' | 'reply' | 'remove';
          buttons?: InlineButton[][] | ReplyButton[][];
          resize_keyboard?: boolean;
          one_time_keyboard?: boolean;
          input_field_placeholder?: string;
          selective?: boolean;
        }
      | null
      | undefined,
    projectId: string,
    additionalVariables: KeyboardVariables = {}
  ): Promise<any | null> {
    if (!config) {
      return null;
    }

    if (config.type === 'remove') {
      return { remove_keyboard: true };
    }

    if (!config.buttons || !Array.isArray(config.buttons)) {
      return null;
    }

    const keyboardType = config.type || 'inline';

    if (keyboardType === 'inline') {
      return await KeyboardBuilder.buildInlineKeyboard(
        config.buttons as InlineButton[][],
        projectId,
        additionalVariables
      );
    } else if (keyboardType === 'reply') {
      return await KeyboardBuilder.buildReplyKeyboard(
        config.buttons as ReplyButton[][],
        {
          resize_keyboard: config.resize_keyboard,
          one_time_keyboard: config.one_time_keyboard,
          input_field_placeholder: config.input_field_placeholder,
          selective: config.selective
        },
        projectId,
        additionalVariables
      );
    }

    return null;
  }

  /**
   * Создание стандартных переменных из ExecutionContext
   */
  static getContextVariables(context: ExecutionContext): KeyboardVariables {
    return {
      username: context.telegram.username || '',
      first_name: context.telegram.firstName || '',
      user_id: context.telegram.userId || '',
      chat_id: context.telegram.chatId || '',
      workflow_id: context.workflowId,
      execution_id: context.executionId,
      session_id: context.sessionId
    };
  }
}

/**
 * Обработчик для message.keyboard.inline
 */
export class InlineKeyboardHandler extends BaseNodeHandler {
  canHandle(nodeType: WorkflowNodeType): boolean {
    return nodeType === 'message.keyboard.inline';
  }

  async execute(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<string | null> {
    try {
      const config = node.data?.config?.[
        'message.keyboard.inline'
      ] as InlineKeyboardConfig;

      if (!config) {
        throw new Error('Inline keyboard configuration is missing');
      }

      // Получаем стандартные переменные из контекста
      const additionalVariables = KeyboardBuilder.getContextVariables(context);

      // Разрешаем переменные в тексте сообщения
      let messageText = await ProjectVariablesService.replaceVariablesInText(
        context.projectId,
        config.text,
        additionalVariables as Record<string, string>
      );

      // ✨ ИСПОЛЬЗУЕМ ЦЕНТРАЛИЗОВАННЫЙ KeyboardBuilder
      const inlineKeyboard = await KeyboardBuilder.buildInlineKeyboard(
        config.buttons,
        context.projectId,
        additionalVariables
      );

      this.logStep(
        context,
        node,
        'Sending message with inline keyboard',
        'info',
        {
          text: messageText.substring(0, 50),
          buttonRows: config.buttons.length,
          totalButtons: config.buttons.reduce((sum, row) => sum + row.length, 0)
        }
      );

      // Отправляем сообщение с клавиатурой через платформо-независимый хелпер
      await sendPlatformMessage(context, messageText, {
        replyMarkup: inlineKeyboard,
        parseMode: config.parse_mode || 'HTML'
      });

      this.logStep(context, node, 'Inline keyboard sent successfully', 'info');

      // ✨ Используем унифицированный WaitForInputHandler для установки состояния ожидания
      const keyboardConfig = {
        type: 'inline',
        buttons: config.buttons
      };

      const waitResult = await WaitForInputHandler.handleWaitForInput(
        node,
        context,
        keyboardConfig
      );

      if (waitResult === WAITING_FOR_USER_INPUT) {
        this.logStep(
          context,
          node,
          'Waiting for callback via WaitForInputHandler',
          'info',
          { nodeId: node.id }
        );
        return WAITING_FOR_USER_INPUT;
      }

      // Следующий нод определяется по connections
      return null;
    } catch (error) {
      this.logStep(context, node, 'Failed to send inline keyboard', 'error', {
        error
      });
      throw error;
    }
  }

  /**
   * @deprecated Use KeyboardBuilder.buildInlineKeyboard instead
   * Kept for backward compatibility
   */
  private async processButtons(
    buttons: InlineButton[][],
    context: ExecutionContext
  ): Promise<InlineButton[][]> {
    const additionalVariables = KeyboardBuilder.getContextVariables(context);
    const result = await KeyboardBuilder.buildInlineKeyboard(
      buttons,
      context.projectId,
      additionalVariables
    );
    return result.inline_keyboard;
  }

  async validate(config: any): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!config) {
      errors.push('Inline keyboard configuration is required');
      return { isValid: false, errors };
    }

    if (!config.text || typeof config.text !== 'string') {
      errors.push('Message text is required and must be a string');
    }

    if (!config.buttons || !Array.isArray(config.buttons)) {
      errors.push('Buttons are required and must be an array');
    } else {
      // Валидируем структуру кнопок
      for (let rowIndex = 0; rowIndex < config.buttons.length; rowIndex++) {
        const row = config.buttons[rowIndex];

        if (!Array.isArray(row)) {
          errors.push(`Button row ${rowIndex} must be an array`);
          continue;
        }

        if (row.length === 0) {
          errors.push(`Button row ${rowIndex} is empty`);
        }

        for (let btnIndex = 0; btnIndex < row.length; btnIndex++) {
          const button = row[btnIndex];

          if (!button.text || typeof button.text !== 'string') {
            errors.push(
              `Button [${rowIndex}][${btnIndex}] must have a text property`
            );
          }

          // Проверяем, что есть хотя бы одно действие
          const hasAction = !!(
            button.callback_data ||
            button.url ||
            button.web_app ||
            button.login_url ||
            button.switch_inline_query !== undefined ||
            button.switch_inline_query_current_chat !== undefined ||
            button.pay
          );

          if (!hasAction) {
            errors.push(
              `Button [${rowIndex}][${btnIndex}] must have at least one action ` +
                `(callback_data, url, web_app, etc.)`
            );
          }
        }
      }
    }

    if (
      config.parse_mode &&
      !['HTML', 'Markdown', 'MarkdownV2'].includes(config.parse_mode)
    ) {
      errors.push('parse_mode must be one of: HTML, Markdown, MarkdownV2');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Типы кнопок для reply клавиатуры
 */
export interface ReplyButton {
  text: string;
  request_contact?: boolean;
  request_location?: boolean;
  request_poll?: {
    type?: 'quiz' | 'regular';
  };
  web_app?: { url: string };
  actions?: ButtonAction[]; // ← НОВОЕ: Встроенные действия при нажатии кнопки
}

/**
 * Конфигурация reply клавиатуры
 */
export interface ReplyKeyboardConfig {
  text: string;
  buttons: ReplyButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  input_field_placeholder?: string;
  selective?: boolean;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}

/**
 * Обработчик для message.keyboard.reply
 */
export class ReplyKeyboardHandler extends BaseNodeHandler {
  canHandle(nodeType: WorkflowNodeType): boolean {
    return nodeType === 'message.keyboard.reply';
  }

  async execute(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<string | null> {
    try {
      const config = node.data?.config?.[
        'message.keyboard.reply'
      ] as ReplyKeyboardConfig;

      if (!config) {
        throw new Error('Reply keyboard configuration is missing');
      }

      // Получаем стандартные переменные из контекста
      const additionalVariables = KeyboardBuilder.getContextVariables(context);

      // Разрешаем переменные в тексте
      let messageText = await ProjectVariablesService.replaceVariablesInText(
        context.projectId,
        config.text,
        additionalVariables as Record<string, string>
      );

      // Обрабатываем кнопки (поддерживаем оба варианта: buttons и keyboard)
      const buttons = (config as any).buttons || (config as any).keyboard;
      if (!buttons) {
        throw new Error('Keyboard buttons are required');
      }

      // ✨ ИСПОЛЬЗУЕМ ЦЕНТРАЛИЗОВАННЫЙ KeyboardBuilder
      const replyKeyboard = await KeyboardBuilder.buildReplyKeyboard(
        buttons,
        {
          resize_keyboard: config.resize_keyboard,
          one_time_keyboard: config.one_time_keyboard,
          input_field_placeholder: config.input_field_placeholder,
          selective: config.selective
        },
        context.projectId,
        additionalVariables
      );

      // ✨ Регистрируем actions для кнопок
      this.registerButtonActions(buttons, context);

      this.logStep(
        context,
        node,
        'Sending message with reply keyboard',
        'info',
        {
          text: messageText.substring(0, 50),
          buttonRows: buttons.length
        }
      );

      // Отправляем сообщение с клавиатурой через платформо-независимый хелпер
      await sendPlatformMessage(context, messageText, {
        replyMarkup: replyKeyboard,
        parseMode: config.parse_mode || 'HTML'
      });

      this.logStep(context, node, 'Reply keyboard sent successfully', 'info');

      // ✨ Используем унифицированный WaitForInputHandler для установки состояния ожидания
      const keyboardConfig = {
        type: 'reply',
        buttons: buttons
      };

      const waitResult = await WaitForInputHandler.handleWaitForInput(
        node,
        context,
        keyboardConfig
      );

      if (waitResult === WAITING_FOR_USER_INPUT) {
        this.logStep(
          context,
          node,
          'Waiting for user input via WaitForInputHandler',
          'info',
          { nodeId: node.id }
        );
        return WAITING_FOR_USER_INPUT;
      }

      return null;
    } catch (error) {
      this.logStep(context, node, 'Failed to send reply keyboard', 'error', {
        error
      });
      throw error;
    }
  }

  /**
   * @deprecated Use KeyboardBuilder.buildReplyKeyboard instead
   * Kept for backward compatibility
   */
  private processReplyButtons(
    buttons: ReplyButton[][],
    context: ExecutionContext
  ): ReplyButton[][] {
    // Синхронная версия для обратной совместимости
    const processedRows: ReplyButton[][] = [];

    for (const row of buttons) {
      const processedRow: ReplyButton[] = [];

      for (const button of row) {
        const processedButton: ReplyButton = {
          text: this.resolveValue(button.text, context) as string
        };

        if (button.request_contact) {
          processedButton.request_contact = true;
        }

        if (button.request_location) {
          processedButton.request_location = true;
        }

        if (button.request_poll) {
          processedButton.request_poll = button.request_poll;
        }

        if (button.web_app) {
          processedButton.web_app = {
            url: this.resolveValue(button.web_app.url, context) as string
          };
        }

        processedRow.push(processedButton);
      }

      processedRows.push(processedRow);
    }

    return processedRows;
  }

  /**
   * ✨ НОВОЕ: Регистрирует actions для кнопок с request_contact/request_location
   */
  private registerButtonActions(
    buttons: ReplyButton[][],
    context: ExecutionContext
  ): void {
    for (const row of buttons) {
      for (const button of row) {
        // Регистрируем actions только если они есть
        if (button.actions && button.actions.length > 0) {
          ButtonActionsRegistry.register(
            {
              projectId: context.projectId,
              userId: context.telegram.userId || '',
              buttonText: button.text
            },
            button.actions
          );

          this.logStep(
            context,
            { id: 'register-actions', type: 'action' } as any,
            `Registered ${button.actions.length} actions for button "${button.text}"`,
            'info'
          );
        }
      }
    }
  }

  async validate(config: any): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!config) {
      errors.push('Reply keyboard configuration is required');
      return { isValid: false, errors };
    }

    if (!config.text || typeof config.text !== 'string') {
      errors.push('Message text is required and must be a string');
    }

    if (!config.buttons || !Array.isArray(config.buttons)) {
      errors.push('Buttons are required and must be an array');
    } else {
      for (let rowIndex = 0; rowIndex < config.buttons.length; rowIndex++) {
        const row = config.buttons[rowIndex];

        if (!Array.isArray(row)) {
          errors.push(`Button row ${rowIndex} must be an array`);
          continue;
        }

        for (let btnIndex = 0; btnIndex < row.length; btnIndex++) {
          const button = row[btnIndex];

          if (!button.text || typeof button.text !== 'string') {
            errors.push(
              `Button [${rowIndex}][${btnIndex}] must have a text property`
            );
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
