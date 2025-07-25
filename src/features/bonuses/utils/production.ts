/**
 * Production-ready утилиты для бонусной системы
 */

import type { User, BonusTransaction } from '../types';

/**
 * Валидация данных пользователя перед сохранением
 */
export function validateUserData(user: Partial<User>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!user.name || user.name.trim().length < 2) {
    errors.push('Имя пользователя должно содержать минимум 2 символа');
  }

  if (!user.email || !isValidEmail(user.email)) {
    errors.push('Некорректный email адрес');
  }

  if (typeof user.bonusBalance === 'number' && user.bonusBalance < 0) {
    errors.push('Баланс бонусов не может быть отрицательным');
  }

  if (typeof user.totalEarned === 'number' && user.totalEarned < 0) {
    errors.push('Общая сумма заработанных бонусов не может быть отрицательной');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Валидация транзакции
 */
export function validateTransaction(transaction: Partial<BonusTransaction>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!transaction.userId) {
    errors.push('ID пользователя обязателен');
  }

  if (
    !transaction.type ||
    !['EARN', 'SPEND', 'EXPIRE', 'ADMIN_ADJUST'].includes(transaction.type)
  ) {
    errors.push('Некорректный тип транзакции');
  }

  if (typeof transaction.amount !== 'number' || transaction.amount === 0) {
    errors.push('Сумма транзакции должна быть числом и не равна нулю');
  }

  if (!transaction.description || transaction.description.trim().length < 3) {
    errors.push('Описание транзакции должно содержать минимум 3 символа');
  }

  // Проверка срока действия
  if (transaction.expiresAt && transaction.expiresAt <= new Date()) {
    errors.push('Дата истечения должна быть в будущем');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Безопасная операция с числами (избегание проблем с плавающей точкой)
 */
export function safeNumberOperation(
  a: number,
  b: number,
  operation: 'add' | 'subtract' | 'multiply' | 'divide'
): number {
  const factor = 100; // Работаем с копейками для избежания проблем с float

  const aInt = Math.round(a * factor);
  const bInt = Math.round(b * factor);

  let result: number;

  switch (operation) {
    case 'add':
      result = aInt + bInt;
      break;
    case 'subtract':
      result = aInt - bInt;
      break;
    case 'multiply':
      result = (aInt * bInt) / factor;
      break;
    case 'divide':
      if (bInt === 0) throw new Error('Division by zero');
      result = (aInt / bInt) * factor;
      break;
    default:
      throw new Error('Unknown operation');
  }

  return Math.round(result) / factor;
}

/**
 * Лимитирование операций для предотвращения злоупотреблений
 */
export class OperationLimiter {
  private operations: Map<string, number[]> = new Map();

  constructor(
    private maxOperationsPerHour: number = 100,
    private maxOperationsPerDay: number = 1000
  ) {}

  canPerformOperation(userId: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const userOps = this.operations.get(userId) || [];

    // Очищаем старые операции (старше 24 часов)
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const recentOps = userOps.filter((timestamp) => timestamp > dayAgo);

    // Проверяем лимит за день
    if (recentOps.length >= this.maxOperationsPerDay) {
      return {
        allowed: false,
        reason: 'Превышен дневной лимит операций'
      };
    }

    // Проверяем лимит за час
    const hourAgo = now - 60 * 60 * 1000;
    const hourlyOps = recentOps.filter((timestamp) => timestamp > hourAgo);

    if (hourlyOps.length >= this.maxOperationsPerHour) {
      return {
        allowed: false,
        reason: 'Превышен часовой лимит операций'
      };
    }

    return { allowed: true };
  }

  recordOperation(userId: string): void {
    const userOps = this.operations.get(userId) || [];
    userOps.push(Date.now());
    this.operations.set(userId, userOps);
  }
}

/**
 * Логирование операций для аудита
 */
export class AuditLogger {
  static log(
    operation: string,
    userId: string,
    details: Record<string, any>,
    adminId?: string
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      userId,
      adminId,
      details,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      ip: 'hidden' // В реальном приложении здесь был бы IP
    };

    // В продакшене здесь была бы отправка в систему логирования
    console.log('AUDIT LOG:', logEntry);
  }
}

/**
 * Кэширование для оптимизации производительности
 */
export class SimpleCache<T> {
  private cache: Map<string, { data: T; expiry: number }> = new Map();

  constructor(private defaultTTL: number = 5 * 60 * 1000) {} // 5 минут по умолчанию

  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data: value, expiry });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Очистка истекших записей
  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Утилиты для безопасности
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Удаляем базовые HTML теги
    .slice(0, 1000); // Ограничиваем длину
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Экспорт данных в CSV формат
 */
export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => JSON.stringify(row[header] || '')).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Форматирование чисел для отображения
 */
export function formatNumber(
  value: number,
  options: {
    currency?: boolean;
    decimals?: number;
    locale?: string;
  } = {}
): string {
  const { currency = false, decimals = 0, locale = 'ru-RU' } = options;

  if (currency) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Дебаунсинг для оптимизации поиска
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
