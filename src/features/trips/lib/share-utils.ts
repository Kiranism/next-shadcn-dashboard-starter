import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Trip } from '@/features/trips/api/trips.service';

/**
 * Formats trip details for easy sharing (e.g., via WhatsApp).
 * Format: "HH:mm - Passenger - von pickup_address (pickup_station) - nach dropoff_address (dropoff_station)"
 */
export function formatTripForSharing(trip: Trip): string {
  const time = trip.scheduled_at
    ? format(new Date(trip.scheduled_at), 'HH:mm', { locale: de })
    : '--:--';

  const passenger = trip.client_name || 'Anonym';

  const from = trip.pickup_address || '-';
  const fromStation = trip.pickup_station ? ` (${trip.pickup_station})` : '';

  const to = trip.dropoff_address || '-';
  const toStation = trip.dropoff_station ? ` (${trip.dropoff_station})` : '';

  let text = `${time} - ${passenger} - von ${from}${fromStation} - nach ${to}${toStation}`;

  if (trip.notes) {
    text += `\n\n${trip.notes}`;
  }

  return text;
}

/**
 * Copies the formatted trip string to the clipboard.
 */
export async function copyTripToClipboard(trip: Trip): Promise<boolean> {
  try {
    const text = formatTripForSharing(trip);
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy trip to clipboard:', error);
    return false;
  }
}
