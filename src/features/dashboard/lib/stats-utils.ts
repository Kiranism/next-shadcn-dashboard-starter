import { isSameDay, parseISO, subDays } from 'date-fns';
import type { Trip } from '@/features/trips/api/trips.service';

/**
 * Filter trips for a specific date
 */
export function getTripsForDay(trips: Trip[], date: Date): Trip[] {
  return trips.filter((trip) => {
    if (!trip.scheduled_at) return false;
    try {
      return isSameDay(parseISO(trip.scheduled_at), date);
    } catch (e) {
      return false;
    }
  });
}

/**
 * Calculate the total revenue from a list of trips
 */
export function calculateTotalRevenue(trips: Trip[]): number {
  return trips.reduce((total, trip) => {
    return total + (trip.price || 0);
  }, 0);
}

/**
 * Calculate percentage change
 */
export function calculateTrend(current: number, previous: number) {
  if (previous === 0) {
    return {
      value: current > 0 ? '+100%' : '0%',
      isUp: current > 0,
      label: current > 0 ? 'Anstieg gegenüber gestern' : 'Gleichbleibend'
    };
  }

  const change = ((current - previous) / previous) * 100;
  const isUp = change >= 0;
  const formattedChange = `${isUp ? '+' : ''}${change.toFixed(1)}%`;

  return {
    value: formattedChange,
    isUp,
    label: `${isUp ? 'Anstieg' : 'Rückgang'} gegenüber gestern`
  };
}

/**
 * Format a number as EUR currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

/**
 * Format a number with thousands separator
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('de-DE').format(value);
}
