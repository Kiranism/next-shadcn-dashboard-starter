import {
  startOfDay,
  endOfDay,
  subDays,
  format,
  parseISO,
  getHours,
  getDay
} from 'date-fns';
import type { Trip } from '@/features/trips/api/trips.service';

export interface HourlyData {
  hour: number;
  label: string;
  count: number;
  average: number;
  revenue: number;
}

export interface WeeklyData {
  day: number;
  label: string;
  count: number;
  average: number;
  revenue: number;
}

/**
 * Aggregates trips by hour for a specific range
 */
export function getHourlyOccupancy(
  trips: Trip[],
  targetDate: Date = new Date(),
  windowDays: number = 28
): HourlyData[] {
  const hourlyData: HourlyData[] = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${i}:00`,
    count: 0,
    average: 0,
    revenue: 0
  }));

  const windowStart = startOfDay(subDays(targetDate, windowDays));
  const targetStart = startOfDay(targetDate);
  const targetEnd = endOfDay(targetDate);

  // Group trips by hour for averages and current count
  trips.forEach((trip) => {
    if (!trip.scheduled_at) return;
    const date = parseISO(trip.scheduled_at);
    const hour = getHours(date);

    if (date >= targetStart && date <= targetEnd) {
      hourlyData[hour].count += 1;
      hourlyData[hour].revenue += trip.price || 0;
    } else if (date >= windowStart && date < targetStart) {
      // Historical data for this hour
      hourlyData[hour].average += 1;
    }
  });

  // Calculate averages (total counts in window / number of weeks)
  const numWeeks = windowDays / 7;
  hourlyData.forEach((d) => {
    d.average = Number((d.average / windowDays).toFixed(1)); // Daily average for that hour
  });

  // Smart Trimming: Filter out hours where BOTH current and average are 0
  return hourlyData.filter((d) => d.count > 0 || d.average > 0);
}

/**
 * Returns a human-readable day part for a given hour
 */
export function getDayPart(hour: number): string {
  if (hour >= 5 && hour < 10) return 'Vormittag';
  if (hour >= 10 && hour < 14) return 'Mittagtisch';
  if (hour >= 14 && hour < 18) return 'Nachmittag';
  if (hour >= 18 && hour < 22) return 'Abend';
  return 'Nacht';
}

/**
 * Aggregates trips by day of week
 */
export function getWeeklyOccupancy(
  trips: Trip[],
  windowDays: number = 28
): WeeklyData[] {
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const weeklyData: WeeklyData[] = days.map((label, i) => ({
    day: i,
    label,
    count: 0,
    average: 0,
    revenue: 0
  }));

  const windowStart = startOfDay(subDays(new Date(), windowDays));
  const todayStart = startOfDay(new Date());

  trips.forEach((trip) => {
    if (!trip.scheduled_at) return;
    const date = parseISO(trip.scheduled_at);
    if (date < windowStart || date > todayStart) return;

    const dayIndex = getDay(date);
    weeklyData[dayIndex].count += 1;
    weeklyData[dayIndex].revenue += trip.price || 0;
  });

  // Average per day type (e.g., average of last 4 Mondays)
  const numWeeks = windowDays / 7;
  weeklyData.forEach((d) => {
    d.average = Number((d.count / numWeeks).toFixed(1));
    // For "current" we can just show the average or last week vs current?
    // Let's stick to showing the average as the primary comparison.
  });

  return weeklyData;
}

/**
 * Identifies top N peak hours
 */
export function identifyPeakHours(
  data: (HourlyData | WeeklyData)[],
  topN: number = 3
) {
  return [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((d) => ('hour' in d ? d.hour : d.day));
}
