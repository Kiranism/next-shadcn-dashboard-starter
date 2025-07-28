/**
 * @file: logger.ts
 * @description: Централизованная система логирования для SaaS Bonus System
 * @project: SaaS Bonus System
 * @dependencies: None (встроенные возможности)
 * @created: 2025-01-23
 * @author: AI Assistant + User
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  projectId?: string;
  botId?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage(level, message, context);

    // В development выводим в консоль
    if (this.isDevelopment) {
      switch (level) {
        case 'debug':
          console.debug(formattedMessage);
          break;
        case 'info':
          console.info(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'error':
          console.error(formattedMessage);
          break;
      }
    }

    // В production можно добавить отправку в внешний сервис
    // TODO: Добавить интеграцию с Sentry, DataDog или другим monitoring
    if (!this.isDevelopment) {
      // Здесь можно добавить отправку в внешний logging сервис
      // например Sentry, Winston файлы, или cloud logging
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  // Специализированные методы для разных компонентов

  webhook(
    action: string,
    projectId: string,
    status: number,
    context?: LogContext
  ): void {
    this.info(`Webhook ${action}`, {
      projectId,
      status,
      component: 'webhook',
      ...context
    });
  }

  bot(action: string, projectId: string, context?: LogContext): void {
    this.info(`Bot ${action}`, {
      projectId,
      component: 'telegram-bot',
      ...context
    });
  }

  api(
    method: string,
    endpoint: string,
    status: number,
    context?: LogContext
  ): void {
    this.info(`API ${method} ${endpoint}`, {
      method,
      endpoint,
      status,
      component: 'api',
      ...context
    });
  }

  database(action: string, table: string, context?: LogContext): void {
    this.debug(`DB ${action} on ${table}`, {
      action,
      table,
      component: 'database',
      ...context
    });
  }
}

// Экспортируем singleton instance
export const logger = Logger.getInstance();

// Экспортируем типы для использования в других файлах
export type { LogLevel, LogContext };

// Утилитарная функция для создания контекста
export function createLogContext(baseContext: LogContext = {}): LogContext {
  return {
    timestamp: Date.now(),
    ...baseContext
  };
}
