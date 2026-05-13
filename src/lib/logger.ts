/**
 * @file: logger.ts
 * @description: Профессиональное логирование для SaaS Bonus System
 * @project: SaaS Bonus System
 * @dependencies: @prisma/client
 * @created: 2025-01-23
 * @updated: 2025-01-30
 * @author: AI Assistant + User
 */

import { db } from './db';

export interface LogContext {
  [key: string]: any;
}

export interface LogLevel {
  level: 'debug' | 'info' | 'warn' | 'error';
  timestamp: string;
  message: string;
  context?: LogContext;
  component?: string;
  requestId?: string;
  performance?: {
    duration?: number;
    memory?: number;
  };
}

export interface PerformanceMetrics {
  startTime: number;
  memory: number;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private enableConsole = process.env.ENABLE_CONSOLE_LOGS !== 'false';
  private logLevel = process.env.LOG_LEVEL || 'info';
  private requestContext = new Map<string, any>();

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private resolveComponent(
    context?: LogContext,
    component?: string
  ): { component?: string; context?: LogContext } {
    if (component) {
      return { component, context };
    }

    if (context && typeof context.component === 'string') {
      const { component: contextComponent, ...rest } = context;
      return {
        component: contextComponent,
        context: Object.keys(rest).length > 0 ? rest : undefined
      };
    }

    return { component, context };
  }

  private formatMessage(
    level: string,
    message: string,
    context?: LogContext,
    component?: string,
    requestId?: string,
    performance?: PerformanceMetrics
  ): LogLevel {
    const resolved = this.resolveComponent(context, component);

    const logEntry: LogLevel = {
      level: level as LogLevel['level'],
      timestamp: new Date().toISOString(),
      message,
      context: resolved.context,
      component: resolved.component,
      requestId
    };

    if (performance) {
      logEntry.performance = {
        duration: Date.now() - performance.startTime,
        memory:
          Math.round(
            ((process.memoryUsage().heapUsed - performance.memory) /
              1024 /
              1024) *
              100
          ) / 100
      };
    }

    return logEntry;
  }

  private async persistLog(logEntry: LogLevel) {
    // Сохраняем только error и warn в SystemLog для мониторинга
    if (logEntry.level === 'error' || logEntry.level === 'warn') {
      try {
        // Определяем источник из component или context
        let source = 'api';
        if (logEntry.component) {
          if (
            logEntry.component.includes('bot') ||
            logEntry.component.includes('telegram')
          ) {
            source = 'bot';
          } else if (logEntry.component.includes('webhook')) {
            source = 'webhook';
          } else if (logEntry.component.includes('workflow')) {
            source = 'workflow';
          }
        }

        // Извлекаем projectId и userId из context если есть
        const projectId = logEntry.context?.projectId as string | undefined;
        const userId = logEntry.context?.userId as string | undefined;

        // Извлекаем stack trace из context если есть
        const stack = logEntry.context?.stack as string | undefined;
        const error = logEntry.context?.error;
        let errorStack: string | undefined = stack;

        // Если есть вложенный error объект, извлекаем stack
        if (error && typeof error === 'object' && 'stack' in error) {
          errorStack = error.stack as string;
        }

        // Сохраняем в БД (async, не блокируем основной поток)
        db.systemLog
          .create({
            data: {
              level: logEntry.level,
              message: logEntry.message,
              context: logEntry.context ? (logEntry.context as any) : undefined,
              projectId: projectId || null,
              userId: userId || null,
              source,
              stack: errorStack || null
            }
          })
          .catch((err) => {
            // Не логируем ошибки логирования в консоль, чтобы избежать циклов
            // Только в development режиме для отладки
            if (this.isDevelopment) {
              console.error('Failed to persist log to SystemLog:', err);
            }
          });
      } catch (error) {
        // Не выбрасываем ошибку, чтобы не нарушить основной флоу
        // Только в development режиме для отладки
        if (this.isDevelopment) {
          console.error('Error in persistLog:', error);
        }
      }
    }

    // В production здесь также может быть интеграция с внешними сервисами логирования
    // Например: Winston, Pino, DataDog, Sentry и т.д.
    if (this.isDevelopment && process.env.PERSIST_LOGS === 'true') {
      try {
        // Можно сохранять в файл или отправлять в внешний сервис
        // await writeToLogFile(logEntry);
      } catch (error) {
        // Не выбрасываем ошибку, чтобы не нарушить основной флоу
      }
    }
  }

  private outputToConsole(logEntry: LogLevel) {
    if (!this.enableConsole || !this.shouldLog(logEntry.level)) return;

    const {
      level,
      timestamp,
      message,
      context,
      component,
      requestId,
      performance
    } = logEntry;

    const prefix = component ? `[${component}]` : '';
    const reqId = requestId ? ` [${requestId.slice(-8)}]` : '';
    const perf = performance
      ? ` (${performance.duration}ms, ${performance.memory}MB)`
      : '';
    const contextStr = context ? ` ${JSON.stringify(context, null, 0)}` : '';

    const fullMessage = `${timestamp}${reqId} ${prefix} ${message}${perf}${contextStr}`;

    // Используем соответствующий уровень консоли
    switch (level) {
      case 'debug':
        if (this.isDevelopment) console.debug(`🔍 ${fullMessage}`);
        break;
      case 'info':
        console.info(`ℹ️ ${fullMessage}`);
        break;
      case 'warn':
        console.warn(`⚠️ ${fullMessage}`);
        break;
      case 'error':
        console.error(`❌ ${fullMessage}`);
        break;
    }
  }

  private async log(
    level: LogLevel['level'],
    message: string,
    context?: LogContext,
    component?: string,
    requestId?: string,
    performance?: PerformanceMetrics
  ) {
    const logEntry = this.formatMessage(
      level,
      message,
      context,
      component,
      requestId,
      performance
    );

    // Выводим в консоль
    this.outputToConsole(logEntry);

    // Сохраняем для анализа
    await this.persistLog(logEntry);
  }

  // Основные методы логирования
  debug(message: string, context?: LogContext, component?: string) {
    this.log('debug', message, context, component);
  }

  info(message: string, context?: LogContext, component?: string) {
    this.log('info', message, context, component);
  }

  warn(message: string, context?: LogContext, component?: string) {
    this.log('warn', message, context, component);
  }

  error(message: string, context?: LogContext, component?: string) {
    this.log('error', message, context, component);
  }

  // Методы с контекстом запроса
  withContext(requestId: string) {
    return {
      debug: (message: string, context?: LogContext, component?: string) =>
        this.log('debug', message, context, component, requestId),
      info: (message: string, context?: LogContext, component?: string) =>
        this.log('info', message, context, component, requestId),
      warn: (message: string, context?: LogContext, component?: string) =>
        this.log('warn', message, context, component, requestId),
      error: (message: string, context?: LogContext, component?: string) =>
        this.log('error', message, context, component, requestId)
    };
  }

  // Методы с измерением производительности
  startPerformance(): PerformanceMetrics {
    return {
      startTime: Date.now(),
      memory: process.memoryUsage().heapUsed
    };
  }

  endPerformance(
    perf: PerformanceMetrics,
    level: LogLevel['level'],
    message: string,
    context?: LogContext,
    component?: string
  ) {
    this.log(level, message, context, component, undefined, perf);
  }

  // Специализированные методы для бизнес-логики
  apiRequest(
    method: string,
    url: string,
    status: number,
    duration?: number,
    requestId?: string
  ) {
    this.log(
      'info',
      `${method} ${url}`,
      { status, duration },
      'api',
      requestId
    );
  }

  databaseQuery(
    operation: string,
    table?: string,
    duration?: number,
    rowCount?: number
  ) {
    this.log(
      'debug',
      `DB ${operation}`,
      { table, duration, rowCount },
      'database'
    );
  }

  userAction(
    userId: string,
    action: string,
    context?: LogContext,
    requestId?: string
  ) {
    this.log(
      'info',
      `User action: ${action}`,
      { userId, ...context },
      'user',
      requestId
    );
  }

  telegramBot(projectId: string, action: string, context?: LogContext) {
    this.log(
      'info',
      `Telegram: ${action}`,
      { projectId, ...context },
      'telegram'
    );
  }

  webhookReceived(
    projectId: string,
    action: string,
    context?: LogContext,
    requestId?: string
  ) {
    this.log(
      'info',
      `Webhook: ${action}`,
      { projectId, ...context },
      'webhook',
      requestId
    );
  }

  cronJob(
    jobName: string,
    status: 'started' | 'completed' | 'failed',
    context?: LogContext
  ) {
    const level = status === 'failed' ? 'error' : 'info';
    this.log(level, `Cron ${jobName}: ${status}`, context, 'cron');
  }

  businessLogic(
    operation: string,
    entity: string,
    entityId: string,
    context?: LogContext
  ) {
    this.log(
      'info',
      `${operation} ${entity}`,
      { entityId, ...context },
      'business'
    );
  }

  security(event: string, context?: LogContext, requestId?: string) {
    this.log('warn', `Security: ${event}`, context, 'security', requestId);
  }

  performance(operation: string, duration: number, context?: LogContext) {
    const level = duration > 1000 ? 'warn' : duration > 500 ? 'info' : 'debug';
    this.log(
      level,
      `Performance: ${operation}`,
      { duration, ...context },
      'performance'
    );
  }

  // Методы для профилирования
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // Контекст запроса
  setRequestContext(requestId: string, context: any) {
    this.requestContext.set(requestId, context);
  }

  getRequestContext(requestId: string) {
    return this.requestContext.get(requestId);
  }

  clearRequestContext(requestId: string) {
    this.requestContext.delete(requestId);
  }
}

// Экспортируем единственный экземпляр
export const logger = new Logger();

// Утилиты для создания middleware
export function createRequestLogger(requestId: string) {
  return logger.withContext(requestId);
}

export function logMiddleware(requestId: string, operation: string) {
  const perf = logger.startPerformance();
  return {
    end: (level: LogLevel['level'] = 'info', context?: LogContext) => {
      logger.endPerformance(perf, level, operation, context, 'middleware');
    }
  };
}

export default logger;
