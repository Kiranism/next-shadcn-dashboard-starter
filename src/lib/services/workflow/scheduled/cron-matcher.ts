/**
 * @file: src/lib/services/workflow/scheduled/cron-matcher.ts
 * @description: Минимальный cron-матчер: проверяет, совпадает ли cron-выражение с моментом времени.
 *               Поддерживает 5 полей (мин час день_месяца месяц день_недели), `*`, числа,
 *               списки `1,2,3`, диапазоны `1-5`, шаги `*\/15`. Дни недели: 0-6 (вс-сб) или MON..SUN.
 *               Без `next()` — нам нужно только matches(now, tz).
 * @project: SaaS Bonus System
 * @created: 2026-05-27
 * @author: AI Assistant + User
 */

const WEEKDAY_ALIASES: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6
};

const MONTH_ALIASES: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12
};

interface FieldRange {
  min: number;
  max: number;
  aliases?: Record<string, number>;
}

const FIELD_RANGES: FieldRange[] = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // hour
  { min: 1, max: 31 }, // day of month
  { min: 1, max: 12, aliases: MONTH_ALIASES }, // month
  { min: 0, max: 6, aliases: WEEKDAY_ALIASES } // day of week
];

/**
 * Преобразует одно поле cron в множество допустимых значений.
 * Бросает ошибку при некорректном формате.
 */
function parseField(field: string, range: FieldRange): Set<number> {
  const result = new Set<number>();
  const parts = field.split(',');

  for (const part of parts) {
    const stepMatch = part.match(/^(.+?)\/(\d+)$/);
    let base = part;
    let step = 1;
    if (stepMatch) {
      base = stepMatch[1];
      step = parseInt(stepMatch[2], 10);
      if (!Number.isFinite(step) || step <= 0) {
        throw new Error(`Invalid step in cron field: "${part}"`);
      }
    }

    let from: number;
    let to: number;

    if (base === '*') {
      from = range.min;
      to = range.max;
    } else if (base.includes('-')) {
      const [a, b] = base.split('-');
      from = resolveValue(a, range);
      to = resolveValue(b, range);
    } else {
      from = resolveValue(base, range);
      to = from;
    }

    if (from > to) {
      throw new Error(`Invalid range in cron field: "${part}"`);
    }

    for (let i = from; i <= to; i += step) {
      result.add(i);
    }
  }

  return result;
}

function resolveValue(raw: string, range: FieldRange): number {
  const trimmed = raw.trim().toUpperCase();
  if (range.aliases && trimmed in range.aliases) {
    return range.aliases[trimmed];
  }
  const num = parseInt(trimmed, 10);
  if (!Number.isFinite(num) || num < range.min || num > range.max) {
    throw new Error(
      `Cron value out of range: "${raw}" (expected ${range.min}-${range.max})`
    );
  }
  return num;
}

export interface ParsedCron {
  minute: Set<number>;
  hour: Set<number>;
  dayOfMonth: Set<number>;
  month: Set<number>;
  dayOfWeek: Set<number>;
}

/**
 * Парсит cron-выражение в структуру для быстрой проверки.
 * Бросает ошибку при некорректном формате.
 */
export function parseCron(expression: string): ParsedCron {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(
      `Cron expression must have 5 fields, got ${fields.length}: "${expression}"`
    );
  }

  return {
    minute: parseField(fields[0], FIELD_RANGES[0]),
    hour: parseField(fields[1], FIELD_RANGES[1]),
    dayOfMonth: parseField(fields[2], FIELD_RANGES[2]),
    month: parseField(fields[3], FIELD_RANGES[3]),
    dayOfWeek: parseField(fields[4], FIELD_RANGES[4])
  };
}

/**
 * Возвращает компоненты времени в указанной IANA-зоне.
 * Использует Intl.DateTimeFormat — стабильно работает в Node.js без extra зависимостей.
 */
export function getTimeInZone(
  date: Date,
  timezone: string
): {
  minute: number;
  hour: number;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  return {
    minute: parseInt(get('minute'), 10),
    // 'numeric' hour with hour12:false yields '24' at midnight in some locales — нормализуем
    hour: parseInt(get('hour'), 10) % 24,
    dayOfMonth: parseInt(get('day'), 10),
    month: parseInt(get('month'), 10),
    dayOfWeek: weekdayMap[get('weekday')] ?? 0
  };
}

/**
 * Проверяет, совпадает ли cron-выражение с текущим временем в указанной зоне.
 *
 * Семантика дня:
 *   Если оба `dayOfMonth` и `dayOfWeek` указаны (не `*`) — совпадение по любому из них (как в стандартных cron-демонах).
 *   Если хотя бы один `*` — оба условия должны выполниться (тривиально для `*`).
 */
export function cronMatches(
  parsed: ParsedCron,
  now: Date,
  timezone: string = 'UTC'
): boolean {
  const t = getTimeInZone(now, timezone);

  if (!parsed.minute.has(t.minute)) return false;
  if (!parsed.hour.has(t.hour)) return false;
  if (!parsed.month.has(t.month)) return false;

  // Эвристика стандартного cron: domRestricted vs dowRestricted
  const domRestricted = parsed.dayOfMonth.size < 31;
  const dowRestricted = parsed.dayOfWeek.size < 7;

  const domMatch = parsed.dayOfMonth.has(t.dayOfMonth);
  const dowMatch = parsed.dayOfWeek.has(t.dayOfWeek);

  if (domRestricted && dowRestricted) {
    return domMatch || dowMatch;
  }
  return domMatch && dowMatch;
}
