import type { Trip } from '@/features/trips/api/trips.service';

/**
 * Describes the directional role of a trip within a Hin/Rückfahrt pair.
 *
 * - 'hinfahrt'   → outbound leg (the primary trip going to the destination)
 * - 'rueckfahrt' → return leg (the trip coming back)
 * - 'standalone' → not part of any linked pair
 */
export type TripDirection = 'hinfahrt' | 'rueckfahrt' | 'standalone';

/**
 * Determines whether a trip is the outbound (Hinfahrt) or return (Rückfahrt) leg.
 *
 * ## Canonical signal: `link_type`
 * `link_type === 'return'` is the single authoritative flag that a trip is the
 * Rückfahrt. It is set on every return trip created by:
 *   - Bulk upload (`bulk-upload-dialog.tsx`)
 *   - The dispatch form (`create-trip-form.tsx`)  ← fixed to populate this
 *   - The recurring-trip cron (`generate-recurring-trips/route.ts`) ← fixed too
 *
 * ## Fallback: `linked_trip_id` (for legacy rows)
 * Trips created by the form before this fix landed have `link_type = null` on
 * both legs.  In those unidirectional pairs the Rückfahrt is the only leg that
 * carries `linked_trip_id`, so we can still infer its direction.
 *
 * Note: bulk-upload backfills `linked_trip_id` on BOTH legs, but bulk-upload
 * also always sets `link_type = 'return'` on the return leg, so the fallback
 * is never needed for bulk-upload rows. The fallback is safe.
 *
 * ## Cron-generated pairs (recurring rules) without `link_type`
 * Old cron-generated trips have neither `link_type` nor `linked_trip_id`.
 * For those we cannot determine direction from the trip row alone — the caller
 * must compare `scheduled_at` times (earlier = Hinfahrt) or consult the parent
 * `recurring_rules` row. This function returns `'standalone'` as a conservative
 * fallback to avoid incorrect labels.
 *
 * @param trip - Any trip row (partial or full Trip type).
 * @returns The direction of the trip within its pair, or 'standalone'.
 */
export function getTripDirection(
  trip: Pick<Trip, 'link_type' | 'linked_trip_id'>
): TripDirection {
  // Primary signal: explicitly tagged as the return leg.
  if (trip.link_type === 'return') return 'rueckfahrt';

  // Explicit outbound signal: set by bulk-upload on both the auto-return and
  // pair_id Hinfahrt legs. Without this guard the `linked_trip_id` fallback
  // below would incorrectly classify these bidirectional Hinfahrt rows as
  // Rückfahrts (both legs carry linked_trip_id in bulk-upload pairs).
  if (trip.link_type === 'outbound') return 'hinfahrt';

  // Fallback for legacy form-created rows only: in those unidirectional pairs
  // the Rückfahrt is the only leg that ever received linked_trip_id, so the
  // presence of that field still reliably signals the return leg.
  if (trip.linked_trip_id) return 'rueckfahrt';

  // No signals — could be a Hinfahrt, a cron-generated leg, or a standalone trip.
  return 'hinfahrt';
}

/**
 * Returns the German label for the cancelled partner of a trip, suitable for
 * showing a warning badge next to the surviving leg.
 *
 * Examples:
 *   - Viewing the Rückfahrt and the Hinfahrt was cancelled → "Hinfahrt storniert"
 *   - Viewing the Hinfahrt and the Rückfahrt was cancelled → "Rückfahrt storniert"
 *
 * @param trip - The trip currently being displayed (NOT the cancelled one).
 */
export function getCancelledPartnerLabel(
  trip: Pick<Trip, 'link_type' | 'linked_trip_id'>
): string {
  const direction = getTripDirection(trip);
  return direction === 'rueckfahrt'
    ? 'Hinfahrt storniert'
    : 'Rückfahrt storniert';
}

/**
 * Returns the German display label for the trip's own direction.
 *
 * @param trip - Any trip row.
 */
export function getTripDirectionLabel(
  trip: Pick<Trip, 'link_type' | 'linked_trip_id'>
): string {
  const direction = getTripDirection(trip);
  if (direction === 'rueckfahrt') return 'Rückfahrt';
  if (direction === 'hinfahrt') return 'Hinfahrt';
  return 'Einzelfahrt';
}
