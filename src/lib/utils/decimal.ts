/**
 * @file: decimal.ts
 * @description: Утилиты для работы с Decimal типами Prisma
 * @project: SaaS Bonus System
 * @created: 2025-01-28
 * @author: AI Assistant + User
 */

import { Decimal } from '@prisma/client/runtime/library';

/**
 * Преобразует Decimal поля объекта в number
 */
export function convertDecimalToNumber<T extends Record<string, any>>(
  obj: T
): T {
  const result = { ...obj };

  for (const key in result) {
    const value = result[key];
    // Проверяем, является ли значение Decimal (у него есть методы toNumber или toString)
    if (value && typeof value === 'object' && 'toNumber' in value) {
      (result as any)[key] = Number(value);
    }
  }

  return result;
}

/**
 * Преобразует Decimal поля в массиве объектов
 */
export function convertDecimalsInArray<T extends Record<string, any>>(
  arr: T[]
): T[] {
  return arr.map((item) => convertDecimalToNumber(item));
}
