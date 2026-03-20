import type { InsertTrip } from '@/features/trips/api/trips.service';
import type { Trip } from '@/features/trips/api/trips.service';
import { getStatusWhenDriverChanges } from '@/features/trips/lib/trip-status';

export interface BuildReturnTripInsertParams {
  scheduledAt: Date;
  driverId: string | null;
  companyId: string | null;
  createdBy: string | null;
  drivingDistanceKm: number | null;
  drivingDurationSeconds: number | null;
}

/**
 * Maps outbound columns to reversed pickup/dropoff for the return leg.
 * The return always starts where the outbound ended and ends where it started.
 */
function swapRouteEndpoints(
  outbound: Trip
): Pick<
  InsertTrip,
  | 'pickup_address'
  | 'pickup_street'
  | 'pickup_street_number'
  | 'pickup_zip_code'
  | 'pickup_city'
  | 'pickup_lat'
  | 'pickup_lng'
  | 'pickup_station'
  | 'pickup_location'
  | 'dropoff_address'
  | 'dropoff_street'
  | 'dropoff_street_number'
  | 'dropoff_zip_code'
  | 'dropoff_city'
  | 'dropoff_lat'
  | 'dropoff_lng'
  | 'dropoff_station'
  | 'dropoff_location'
> {
  return {
    pickup_address: outbound.dropoff_address,
    pickup_street: outbound.dropoff_street,
    pickup_street_number: outbound.dropoff_street_number,
    pickup_zip_code: outbound.dropoff_zip_code,
    pickup_city: outbound.dropoff_city,
    pickup_lat: outbound.dropoff_lat,
    pickup_lng: outbound.dropoff_lng,
    pickup_station: outbound.dropoff_station,
    pickup_location: outbound.dropoff_location,
    dropoff_address: outbound.pickup_address,
    dropoff_street: outbound.pickup_street,
    dropoff_street_number: outbound.pickup_street_number,
    dropoff_zip_code: outbound.pickup_zip_code,
    dropoff_city: outbound.pickup_city,
    dropoff_lat: outbound.pickup_lat,
    dropoff_lng: outbound.pickup_lng,
    dropoff_station: outbound.pickup_station,
    dropoff_location: outbound.pickup_location
  };
}

/**
 * Builds a Supabase insert payload for a linked Rückfahrt row.
 *
 * - Inherits billing, client, passenger, and vehicle notes from the outbound leg.
 * - Does **not** copy `group_id` (returns may differ per passenger later).
 * - Does **not** copy `rule_id` so the return is a one-off leg, not a new series row.
 */
export function buildReturnTripInsert(
  outbound: Trip,
  params: BuildReturnTripInsertParams
): InsertTrip {
  const route = swapRouteEndpoints(outbound);
  const derivedStatus =
    (getStatusWhenDriverChanges('pending', params.driverId) as
      | 'pending'
      | 'assigned') ?? 'pending';

  return {
    ...route,
    payer_id: outbound.payer_id,
    billing_type_id: outbound.billing_type_id,
    client_id: outbound.client_id,
    client_name: outbound.client_name,
    client_phone: outbound.client_phone,
    company_id: params.companyId ?? outbound.company_id,
    is_wheelchair: outbound.is_wheelchair,
    notes: outbound.notes,
    greeting_style: outbound.greeting_style,
    payment_method: outbound.payment_method,
    vehicle_id: outbound.vehicle_id,
    group_id: null,
    // One-off return: do not attach to the recurring rule (if any) on the outbound leg.
    rule_id: null,
    link_type: 'return',
    linked_trip_id: outbound.id,
    scheduled_at: params.scheduledAt.toISOString(),
    driver_id: params.driverId,
    status: derivedStatus,
    stop_updates: [],
    created_by: params.createdBy,
    driving_distance_km: params.drivingDistanceKm,
    driving_duration_seconds: params.drivingDurationSeconds,
    stop_order: null
  };
}
