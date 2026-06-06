/**
 * @file: src/lib/services/workflow/handlers/utils.ts
 * @description: Утилиты для workflow handlers (шаблоны, переменные, валидация)
 * @project: SaaS Bonus System
 * @created: 2025-10-24
 */

import type { ExecutionContext } from '@/types/workflow';
import { QueryExecutor } from '@/lib/services/workflow/query-executor';
import { UserVariablesService } from '@/lib/services/workflow/user-variables.service';

const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;
const USER_VARS_CACHE_KEY = '_userVariablesFlat';

/**
 * Резолвит переменные в строке вида {{var.path}}
 */
export async function resolveTemplateString(
  template: string | undefined,
  context: ExecutionContext
): Promise<string> {
  if (!template) {
    return '';
  }

  const resolved = await resolveTemplateValue(template, context);
  return typeof resolved === 'string' ? resolved : JSON.stringify(resolved);
}

/**
 * Рекурсивно резолвит переменные в значении (строка/объект/массив)
 */
export async function resolveTemplateValue<T = any>(
  value: T,
  context: ExecutionContext
): Promise<T> {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    let current = value as string;
    const matches = value.match(VARIABLE_PATTERN);

    if (!matches) {
      return current as unknown as T;
    }

    // Если строка состоит только из одной переменной {{var.path}},
    // возвращаем ЗНАЧЕНИЕ переменной в исходном типе (boolean, number, object)
    if (matches.length === 1 && current.trim() === matches[0]) {
      const path = matches[0].slice(2, -2).trim();
      const resolved = await resolveVariablePath(path, context);
      return resolved as unknown as T;
    }

    for (const match of matches) {
      const path = match.slice(2, -2).trim();
      const resolved = await resolveVariablePath(path, context);

      if (resolved === undefined || resolved === null) {
        current = current.replace(match, '');
        continue;
      }

      if (typeof resolved === 'object') {
        current = current.replace(match, JSON.stringify(resolved));
      } else {
        current = current.replace(match, String(resolved));
      }
    }

    return current as unknown as T;
  }

  if (Array.isArray(value)) {
    const resolvedArray = [] as unknown as T;
    for (const item of value as any[]) {
      (resolvedArray as any[]).push(await resolveTemplateValue(item, context));
    }
    return resolvedArray;
  }

  if (typeof value === 'object') {
    const entries = await Promise.all(
      Object.entries(value as Record<string, any>).map(async ([key, val]) => [
        key,
        await resolveTemplateValue(val, context)
      ])
    );
    return Object.fromEntries(entries) as T;
  }

  return value;
}

/**
 * Получает значение из объекта по пути вида "foo.bar[0].baz"
 */
export function getValueByPath<T = any>(
  source: any,
  path: string | undefined
): T | undefined {
  if (!path) {
    return source;
  }

  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
  const parts = normalizedPath.split('.').filter(Boolean);

  let current = source;
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current as T | undefined;
}

/**
 * Проверяет строку на email
 */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Проверяет строку на телефон (минимум 7 цифр)
 */
export function isPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7;
}

/**
 * Нормализует телефон (оставляет цифры, сохраняет ведущий +)
 */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');
  return trimmed.startsWith('+') ? `+${digitsOnly}` : digitsOnly;
}

async function resolveWorkflowUserId(
  context: ExecutionContext
): Promise<string | undefined> {
  if (context.userId) {
    return context.userId;
  }

  for (const sessionKey of ['telegramUser', 'contactUser'] as const) {
    try {
      const record = await context.variables.get(sessionKey, 'session');
      if (record?.id) {
        context.userId = record.id;
        return record.id;
      }
    } catch {
      // ignore missing session variable
    }
  }

  if (!context.telegram?.userId) {
    return undefined;
  }

  try {
    const found = await QueryExecutor.execute(
      context.services.db,
      'check_user_by_platform',
      {
        telegramId:
          context.platform === 'telegram' ? context.telegram.userId : undefined,
        maxId: context.platform === 'max' ? context.telegram.userId : undefined,
        projectId: context.projectId
      }
    );
    if (found?.id) {
      context.userId = found.id;
      return found.id;
    }
  } catch {
    // ignore lookup failure
  }

  return undefined;
}

async function loadUserVariablesFlat(
  context: ExecutionContext
): Promise<Record<string, unknown>> {
  const cached = (context as Record<string, unknown>)[USER_VARS_CACHE_KEY];
  if (cached && typeof cached === 'object') {
    return cached as Record<string, unknown>;
  }

  const userId = await resolveWorkflowUserId(context);
  if (!userId) {
    return {};
  }

  const variables = await UserVariablesService.getUserVariables(
    context.services.db,
    userId,
    context.projectId
  );

  (context as Record<string, unknown>)[USER_VARS_CACHE_KEY] = variables;
  return variables;
}

function flatUserVarsToNested(
  flat: Record<string, unknown>
): Record<string, unknown> {
  const user: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(flat)) {
    if (!key.startsWith('user.')) {
      continue;
    }
    const path = key.slice('user.'.length);
    const parts = path.split('.');
    let current = user;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = value;
      } else {
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }
    }
  }

  return user;
}

async function resolveUserVariablePath(
  rest: string[],
  context: ExecutionContext
): Promise<unknown> {
  const flat = await loadUserVariablesFlat(context);
  if (rest.length === 0) {
    return flatUserVarsToNested(flat);
  }

  const flatKey = `user.${rest.join('.')}`;
  if (flatKey in flat) {
    return flat[flatKey];
  }

  return getValueByPath(flatUserVarsToNested(flat), rest.join('.'));
}

async function resolveVariablePath(
  path: string,
  context: ExecutionContext
): Promise<any> {
  const segments = path
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return undefined;
  }

  const [root, ...rest] = segments;

  // Специальные корневые переменные
  if (root === 'telegram') {
    return rest.reduce((acc: any, key) => acc?.[key], context.telegram as any);
  }

  if (root === 'project') {
    const projectContext = {
      id: context.projectId
    };
    return rest.reduce((acc: any, key) => acc?.[key], projectContext as any);
  }

  if (root === 'context') {
    return rest.reduce((acc: any, key) => acc?.[key], context as any);
  }

  if (root === 'now') {
    const nowValue = context.now();
    if (rest.length === 0) {
      return nowValue.toISOString();
    }
    const mapping: Record<string, any> = {
      iso: nowValue.toISOString(),
      timestamp: nowValue.getTime(),
      date: nowValue.toISOString().split('T')[0]
    };
    return mapping[rest[0]];
  }

  if (root === 'user') {
    return resolveUserVariablePath(rest, context);
  }

  // Доступ к полям контекста напрямую (projectId, userId и т.д.)
  console.log(`🔍 DEBUG: Checking context.${root}:`, {
    rootValue: (context as any)[root],
    isDefined: (context as any)[root] !== undefined,
    contextKeys: Object.keys(context)
  });

  if ((context as any)[root] !== undefined) {
    const result = rest.reduce(
      (acc: any, key) => acc?.[key],
      (context as any)[root]
    );
    console.log(`✅ DEBUG: Resolved context.${root} =`, result);
    return result;
  }

  // По умолчанию ищем переменную в session scope
  try {
    const baseValue = await context.variables.get(root, 'session');
    console.log(`🔍 DEBUG: Base variable ${root} from session:`, baseValue);

    if (rest.length === 0) {
      return baseValue;
    }

    // ✅ КРИТИЧНО: Резолвим вложенные свойства для session-переменных
    const result = rest.reduce((acc: any, key) => {
      if (acc && typeof acc === 'object' && key in acc) {
        return acc[key];
      }
      return undefined;
    }, baseValue as any);

    console.log(`✅ DEBUG: Resolved ${root}.${rest.join('.')} =`, result);
    return result;
  } catch (error) {
    console.log(`❌ DEBUG: Failed to resolve ${root}:`, error);
    console.debug(`Unable to resolve variable path: ${path}`, error);
    return undefined;
  }
}
