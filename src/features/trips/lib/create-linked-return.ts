import { tripsService, type Trip } from '@/features/trips/api/trips.service';
import { getDrivingMetrics } from '@/lib/google-directions';
import { buildReturnTripInsert } from '@/features/trips/lib/build-return-trip-insert';

export interface CreateLinkedReturnOptions {
  scheduledAt: Date;
  driverId: string | null;
  companyId: string | null;
  createdBy: string | null;
}

/**
 * Inserts a Rückfahrt row (reversed route) and links it bidirectionally:
 * - return leg: `link_type = 'return'`, `linked_trip_id` → outbound
 * - outbound leg: `link_type = 'outbound'`, `linked_trip_id` → return
 *
 * Matches the behaviour used in bulk upload so `getTripDirection()` stays consistent.
 */
export async function createLinkedReturnForOutbound(
  outbound: Trip,
  options: CreateLinkedReturnOptions
): Promise<Trip> {
  const pickupHasCoords =
    typeof outbound.dropoff_lat === 'number' &&
    typeof outbound.dropoff_lng === 'number';
  const dropoffHasCoords =
    typeof outbound.pickup_lat === 'number' &&
    typeof outbound.pickup_lng === 'number';

  let drivingDistanceKm: number | null = null;
  let drivingDurationSeconds: number | null = null;

  if (pickupHasCoords && dropoffHasCoords) {
    const metrics = await getDrivingMetrics(
      outbound.dropoff_lat as number,
      outbound.dropoff_lng as number,
      outbound.pickup_lat as number,
      outbound.pickup_lng as number
    );
    if (metrics) {
      drivingDistanceKm = metrics.distanceKm;
      drivingDurationSeconds = metrics.durationSeconds;
    }
  }

  const insert = buildReturnTripInsert(outbound, {
    scheduledAt: options.scheduledAt,
    driverId: options.driverId,
    companyId: options.companyId,
    createdBy: options.createdBy,
    drivingDistanceKm,
    drivingDurationSeconds
  });

  const created = await tripsService.createTrip(insert);

  await tripsService.updateTrip(outbound.id, {
    linked_trip_id: created.id,
    link_type: 'outbound'
  });

  return created as Trip;
}
