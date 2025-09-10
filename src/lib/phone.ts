/**
 * @file: src/lib/phone.ts
 * @description: Утилиты нормализации и проверки телефонных номеров (E.164-ориентировано, RU-friendly)
 * @project: SaaS Bonus System
 * @dependencies: none
 * @created: 2025-09-10
 * @author: AI Assistant + User
 */

/**
 * Нормализует телефон к виду +<country><nsn> без пробелов и скобок.
 * Правила:
 * - Удаляем все, кроме цифр и ведущего +
 * - Если начинается с 8 и длина 11 → считаем RU и делаем +7xxxxxxxxxx
 * - Если начинается с 7 и длина 11 → +7xxxxxxxxxx
 * - Если начинается с 0 и далее 10-11 цифр → возвращаем как +<digits> без 0 (не RU)
 * - Если длина 10 и нет кода страны → для RU добавляем +7
 * - Иначе если начинается с 00 → заменяем на +
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = String(raw).trim();

  // Заменяем ведущие 00 на +
  if (s.startsWith('00')) s = '+' + s.slice(2);

  // Удаляем все, кроме цифр и + в начале
  s = s.replace(/(?!^)[^\d]/g, '');
  if (!/^\+?\d+$/.test(s)) {
    return null;
  }

  // Если начинается с + — оставляем знак и цифры
  const hasPlus = s.startsWith('+');
  const digits = hasPlus ? s.slice(1) : s;

  // Россия: 8XXXXXXXXXX или 7XXXXXXXXXX → +7XXXXXXXXXX
  if (
    digits.length === 11 &&
    (digits.startsWith('8') || digits.startsWith('7'))
  ) {
    return '+7' + digits.slice(1);
  }

  // Локальный RU номер из 10 цифр → +7XXXXXXXXXX
  if (digits.length === 10 && !hasPlus) {
    return '+7' + digits;
  }

  // Если уже с кодом страны
  if (hasPlus) {
    return '+' + digits;
  }

  // Фолбэк: вернуть как есть с плюсом
  return '+' + digits;
}

export function isValidNormalizedPhone(
  normalized: string | null | undefined
): boolean {
  if (!normalized) return false;
  return /^\+\d{10,15}$/.test(normalized);
}
