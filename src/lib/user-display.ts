/**
 * @file: user-display.ts
 * @description: Отображаемое имя пользователя (имя без обязательной фамилии)
 * @project: SaaS Bonus System
 * @created: 2026-06-09
 */

export function formatUserDisplayName(u: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  fallback?: string;
}): string {
  const full = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  if (full) return full;
  if (u.email?.trim()) return u.email.trim();
  if (u.phone?.trim()) return u.phone.trim();
  return u.fallback ?? 'Без имени';
}

export function splitFullName(name?: string | null): {
  firstName: string;
  lastName: string;
} {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' ')
  };
}
