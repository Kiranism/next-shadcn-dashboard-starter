import { addDays, startOfDay } from 'date-fns';
import { tz } from '@date-fns/tz';

const DEFAULT_TZ = 'Europe/Berlin';

/**
 * IANA timezone for “which calendar day is this trip on?” in filters and bounds.
 * Must match on server and client — use NEXT_PUBLIC_* so the client can default the URL.
 */
export function getTripsBusinessTimeZone(): string {
  if (
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_TRIPS_BUSINESS_TIMEZONE
  ) {
    return process.env.NEXT_PUBLIC_TRIPS_BUSINESS_TIMEZONE;
  }
  return DEFAULT_TZ;
}

export function isYmdString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Calendar YYYY-MM-DD of an instant in the business timezone (not UTC). */
export function instantToYmdInBusinessTz(ms: number): string {
  const inTz = tz(getTripsBusinessTimeZone());
  const d = inTz(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayYmdInBusinessTz(): string {
  return instantToYmdInBusinessTz(Date.now());
}

/**
 * [start, end) in UTC ISO for the given local calendar day in the business TZ.
 */
export function getZonedDayBoundsIso(ymd: string): {
  startISO: string;
  endExclusiveISO: string;
} {
  const inTz = tz(getTripsBusinessTimeZone());
  const anchor = inTz(ymd);
  const dayStart = startOfDay(anchor, { in: inTz });
  const nextStart = addDays(dayStart, 1, { in: inTz });
  return {
    startISO: dayStart.toISOString(),
    endExclusiveISO: nextStart.toISOString()
  };
}

/** Date for react-day-picker `selected` — interpret YMD in business TZ. */
export function ymdToPickerDate(ymd: string): Date {
  return tz(getTripsBusinessTimeZone())(ymd) as Date;
}
