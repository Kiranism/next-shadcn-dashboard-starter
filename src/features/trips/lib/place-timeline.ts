import type { Place } from '@/app/dashboard/trips/[tripid]/components/map';

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dayToIndex(day?: string): number {
  if (!day) return Number.POSITIVE_INFINITY;
  const index = DAY_ORDER.indexOf(day);
  return index >= 0 ? index : Number.POSITIVE_INFINITY;
}

function timeToMinutes(value?: string): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return Number.POSITIVE_INFINITY;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

function dateToMillis(value?: string): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const millis = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(millis) ? Number.POSITIVE_INFINITY : millis;
}

export function sortPlacesByTimeline(places: Place[]): Place[] {
  return [...places].sort((left, right) => {
    const leftDate = dateToMillis(left.date);
    const rightDate = dateToMillis(right.date);
    if (leftDate !== rightDate) return leftDate - rightDate;

    const leftDay = dayToIndex(left.day);
    const rightDay = dayToIndex(right.day);
    if (leftDay !== rightDay) return leftDay - rightDay;

    const leftStart = timeToMinutes(left.startTime);
    const rightStart = timeToMinutes(right.startTime);
    if (leftStart !== rightStart) return leftStart - rightStart;

    const leftEnd = timeToMinutes(left.endTime);
    const rightEnd = timeToMinutes(right.endTime);
    if (leftEnd !== rightEnd) return leftEnd - rightEnd;

    return left.name.localeCompare(right.name);
  });
}
