import { differenceInMinutes, isPast } from 'date-fns';
import { type TripStatus } from '@/lib/trip-status';

/**
 * Urgency levels for trips based on their scheduled time.
 * Logic:
 * - OVERDUE: More than 5 minutes past scheduled time.
 * - DUE: Within the window of 0 to 5 minutes past scheduled time.
 * - IMMINENT: Within 10 minutes before scheduled time.
 * - UPCOMING: Within 30 minutes before scheduled time.
 */
export type UrgencyLevel = 'upcoming' | 'imminent' | 'due' | 'overdue' | 'none';

/**
 * Calculates the urgency level for a trip.
 *
 * @param scheduledAt - The ISO string or Date of the trip's scheduled time.
 * @param status - The current status of the trip (to exclude completed/cancelled).
 * @returns The calculated UrgencyLevel.
 */
export function getUrgencyLevel(
  scheduledAt: string | Date | null | undefined,
  status: TripStatus | string
): UrgencyLevel {
  // Exclude non-active trips
  if (status === 'completed' || status === 'cancelled') {
    return 'none';
  }

  if (!scheduledAt) {
    return 'none';
  }

  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) {
    return 'none';
  }

  const now = new Date();
  const diffMinutes = differenceInMinutes(date, now);

  // If trip is in the past
  const overdueMinutes = Math.abs(diffMinutes);
  if (isPast(date)) {
    if (overdueMinutes > 10) {
      return 'none';
    }
    if (overdueMinutes > 5) {
      return 'overdue';
    }
    return 'due';
  }

  // If trip is in the future
  if (diffMinutes <= 10) {
    return 'imminent';
  }
  if (diffMinutes <= 30) {
    return 'upcoming';
  }

  return 'none';
}
