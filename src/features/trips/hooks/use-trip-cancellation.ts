import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import type { Trip } from '@/features/trips/api/trips.service';
import {
  cancelNonRecurringTrip,
  cancelNonRecurringTripAndPaired,
  cancelRecurringSeries,
  skipRecurringOccurrence,
  skipRecurringOccurrenceAndPaired,
  type CancelResult,
  type TripCancelMode
} from '@/features/trips/api/recurring-exceptions.actions';

export function useTripCancellation() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const cancelTrip = async (
    trip: Trip,
    mode: TripCancelMode,
    options?: { source?: string; reason?: string }
  ) => {
    const source = options?.source || 'Manually cancelled via Trips UI';
    const reason = options?.reason;

    try {
      setIsLoading(true);

      let result: CancelResult;

      switch (mode) {
        case 'cancel-nonrecurring-and-paired':
          result = await cancelNonRecurringTripAndPaired(trip, reason);
          break;
        case 'skip-occurrence':
          result = await skipRecurringOccurrence(trip, source, reason);
          break;
        case 'skip-occurrence-and-paired':
          result = await skipRecurringOccurrenceAndPaired(trip, source, reason);
          break;
        case 'cancel-series':
          result = await cancelRecurringSeries(trip, reason);
          break;
        case 'single-nonrecurring':
        default:
          result = await cancelNonRecurringTrip(trip, reason);
          break;
      }

      if (!result.ok) {
        toast.error(
          'Fehler beim Stornieren der Fahrt: ' +
            (result.error ?? 'Unbekannter Fehler')
        );
        return;
      }

      switch (mode) {
        case 'cancel-nonrecurring-and-paired':
          toast.success('Hin- und Rückfahrt wurden storniert.');
          break;
        case 'skip-occurrence':
          toast.success(
            'Wiederkehrende Fahrt wurde für dieses Datum storniert.'
          );
          break;
        case 'skip-occurrence-and-paired':
          toast.success(
            'Hin- und Rückfahrt wurden für dieses Datum storniert.'
          );
          break;
        case 'cancel-series':
          toast.success(
            'Wiederkehrende Serie wurde beendet und zukünftige Fahrten storniert.'
          );
          break;
        default:
          toast.success('Fahrt wurde erfolgreich storniert.');
      }

      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cancelTrip,
    isLoading
  };
}
