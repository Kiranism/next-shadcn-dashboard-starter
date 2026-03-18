import { createClient } from '@/lib/supabase/client';
import type { Trip } from '@/features/trips/api/trips.service';

export type TripCancelMode =
  | 'single-nonrecurring'
  | 'cancel-nonrecurring-and-paired'
  | 'skip-occurrence'
  | 'skip-occurrence-and-paired'
  | 'cancel-series';

export type CancelResult = {
  ok: boolean;
  error?: string;
};

type OccurrenceKey = {
  dateStr: string;
  timeStr: string;
};

function deriveOccurrenceKey(trip: Trip): OccurrenceKey | null {
  if (!trip.scheduled_at) return null;
  const scheduledDate = new Date(trip.scheduled_at);
  const iso = scheduledDate.toISOString();
  const [dateStr, timeWithMs] = iso.split('T');
  const timeStr = timeWithMs.substring(0, 8); // HH:mm:ss

  return { dateStr, timeStr };
}

export async function findPairedTrip(trip: Trip): Promise<Trip | null> {
  const supabase = createClient();

  // 1) Prefer explicit linking via linked_trip_id when available
  if (trip.linked_trip_id) {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', trip.linked_trip_id)
      .maybeSingle();

    if (!error && data) {
      return data as Trip;
    }
  }

  // Also handle the inverse link (other trip points to this one)
  const { data: inverseLinked, error: inverseError } = await supabase
    .from('trips')
    .select('*')
    .eq('linked_trip_id', trip.id)
    .maybeSingle();

  if (!inverseError && inverseLinked) {
    return inverseLinked as Trip;
  }

  // 2) Fallback: infer pairing within same rule and same day
  if (!trip.rule_id || !trip.scheduled_at) {
    return null;
  }

  const scheduledDate = new Date(trip.scheduled_at);
  const dateStr = scheduledDate.toISOString().split('T')[0];

  const { data: sameDayTrips, error } = await supabase
    .from('trips')
    .select('*')
    .eq('rule_id', trip.rule_id)
    .neq('id', trip.id)
    .gte('scheduled_at', `${dateStr}T00:00:00`)
    .lt('scheduled_at', `${dateStr}T23:59:59`);

  if (error || !sameDayTrips || sameDayTrips.length === 0) {
    return null;
  }

  // In practice there should be at most one paired leg; if more, just take the first.
  return sameDayTrips[0] as Trip;
}

export async function hasPairedLeg(trip: Trip): Promise<boolean> {
  const paired = await findPairedTrip(trip);
  return !!paired;
}

export async function cancelNonRecurringTrip(
  trip: Trip,
  reason?: string
): Promise<CancelResult> {
  const supabase = createClient();

  const { error } = await supabase
    .from('trips')
    .update({
      status: 'cancelled',
      canceled_reason_notes: reason ?? trip.canceled_reason_notes ?? null
    })
    .eq('id', trip.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function cancelNonRecurringTripAndPaired(
  trip: Trip,
  reason?: string
): Promise<CancelResult> {
  const primaryResult = await cancelNonRecurringTrip(trip, reason);
  if (!primaryResult.ok) {
    return primaryResult;
  }

  const pairedTrip = await findPairedTrip(trip);
  if (!pairedTrip) {
    return { ok: true };
  }

  return cancelNonRecurringTrip(pairedTrip, reason);
}

export async function skipRecurringOccurrence(
  trip: Trip,
  source: string,
  reason?: string
): Promise<CancelResult> {
  const supabase = createClient();

  if (!trip.rule_id) {
    return {
      ok: false,
      error: 'Trip has no rule_id but skip-occurrence was requested.'
    };
  }

  const occurrenceKey = deriveOccurrenceKey(trip);
  if (!occurrenceKey) {
    return { ok: false, error: 'Trip has no scheduled_at timestamp.' };
  }

  const { dateStr, timeStr } = occurrenceKey;

  const { error: exceptionError } = await supabase
    .from('recurring_rule_exceptions')
    .insert({
      rule_id: trip.rule_id,
      exception_date: dateStr,
      original_pickup_time: timeStr,
      is_cancelled: true,
      reason: reason ?? source
    });

  if (exceptionError) {
    return { ok: false, error: exceptionError.message };
  }

  const { error: updateError } = await supabase
    .from('trips')
    .update({
      status: 'cancelled',
      canceled_reason_notes: reason ?? trip.canceled_reason_notes ?? null
    })
    .eq('id', trip.id);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true };
}

export async function skipRecurringOccurrenceAndPaired(
  trip: Trip,
  source: string,
  reason?: string
): Promise<CancelResult> {
  const supabase = createClient();

  // First, cancel the selected occurrence
  const singleResult = await skipRecurringOccurrence(trip, source, reason);
  if (!singleResult.ok) {
    return singleResult;
  }

  const pairedTrip = await findPairedTrip(trip);
  if (!pairedTrip) {
    // No paired leg found – treat as single cancellation success.
    return { ok: true };
  }

  // For paired leg: if it belongs to the same rule, create its own exception.
  if (pairedTrip.rule_id) {
    const occurrenceKey = deriveOccurrenceKey(pairedTrip);
    if (occurrenceKey) {
      const { dateStr, timeStr } = occurrenceKey;

      const { error: exceptionError } = await supabase
        .from('recurring_rule_exceptions')
        .insert({
          rule_id: pairedTrip.rule_id,
          exception_date: dateStr,
          original_pickup_time: timeStr,
          is_cancelled: true,
          reason: reason ?? source
        });

      if (exceptionError) {
        return { ok: false, error: exceptionError.message };
      }
    }
  }

  const { error: updateError } = await supabase
    .from('trips')
    .update({
      status: 'cancelled',
      canceled_reason_notes: reason ?? pairedTrip.canceled_reason_notes ?? null
    })
    .eq('id', pairedTrip.id);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true };
}

export async function cancelRecurringSeries(
  trip: Trip,
  reason?: string
): Promise<CancelResult> {
  if (!trip.rule_id) {
    return {
      ok: false,
      error: 'Trip has no rule_id but cancel-series was requested.'
    };
  }

  const supabase = createClient();

  const { error: ruleError } = await supabase
    .from('recurring_rules')
    .update({ is_active: false })
    .eq('id', trip.rule_id);

  if (ruleError) {
    return { ok: false, error: ruleError.message };
  }

  // Mark all future pending trips for this rule as cancelled, instead of deleting them.
  const { error: tripsError } = await supabase
    .from('trips')
    .update({
      status: 'cancelled',
      canceled_reason_notes: reason ?? null
    })
    .eq('rule_id', trip.rule_id)
    .gte('scheduled_at', new Date().toISOString())
    .eq('status', 'pending');

  if (tripsError) {
    return { ok: false, error: tripsError.message };
  }

  return { ok: true };
}
