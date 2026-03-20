/**
 * Driver portal — trip-related types.
 *
 * DriverTrip is a narrow view of the DB 'trips' row: only the fields
 * the driver-portal components need. This avoids leaking admin-only
 * fields (pricing, billing_type, etc.) into driver-facing components.
 *
 * Future: as we allow drivers to update more fields (e.g. actual_pickup_at),
 * extend DriverTripUpdate accordingly.
 */

// ---------------------------------------------------------------------------
// Trip status
// ---------------------------------------------------------------------------

/**
 * All statuses a trip can have during its lifecycle.
 * Kept in sync with the DB 'status' enum / string values.
 */
export const TRIP_STATUSES = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
} as const;

export type TripStatus = (typeof TRIP_STATUSES)[keyof typeof TRIP_STATUSES];

// ---------------------------------------------------------------------------
// DriverTrip — the narrow read model used in driver-portal components
// ---------------------------------------------------------------------------

/**
 * A trip as seen by the driver portal.
 * All admin-only fields (price, billing_type_id, etc.) are omitted.
 */
export interface DriverTrip {
  id: string;
  scheduled_at: string | null;
  status: string; // using string for flexibility; compare with TRIP_STATUSES
  client_name: string | null;
  client_phone: string | null;
  pickup_address: string | null;
  dropoff_address: string | null;
  is_wheelchair: boolean;
  note: string | null;
  notes: string | null;
  stop_order: number | null;
  linked_trip_id: string | null;
  link_type: string | null;
  /** FK → shifts.id — written when the driver taps "Tour starten". NULL if not yet started by the driver. */
  shift_id: string | null;
  /** Preferred greeting/salutation for this trip, e.g. "Herr Müller" or "Frau Schmidt". From bulk CSV or client form. */
  greeting_style: string | null;
  /** Optional pickup station / stop name shown as a badge next to the pickup address. */
  pickup_station: string | null;
  /** Optional drop-off station / stop name shown as a badge next to the drop-off address. */
  dropoff_station: string | null;
}

// ---------------------------------------------------------------------------
// Filter types (used in Touren page state)
// ---------------------------------------------------------------------------

/** Status filter value — 'all' means "no filter". */
export type TripStatusFilter = TripStatus | 'all';

/** Filter state for the Touren page. */
export interface TourenFilters {
  search: string;
  statusFilter: TripStatusFilter;
  date: string; // YYYY-MM-DD — empty string means "no date filter"
}
