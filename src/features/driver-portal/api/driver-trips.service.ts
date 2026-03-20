/**
 * driver-trips.service.ts — read and write trips for the driver portal.
 *
 * ### Read
 *   - `getTodaysTrips(driverId)`      — today's trips ordered by time (Startseite)
 *   - `getDriverTrips(driverId, opts)` — all trips with search / status / date filter (Touren)
 *
 * ### Write (driver-scoped — only touches fields the driver is allowed to change)
 *   - `startTrip(tripId, shiftId?)`       — status → in_progress; links trip to active shift
 *   - `completeTrip(tripId)`              — status → completed
 *   - `cancelTrip(tripId, reason, notes)` — status → cancelled; appends reason to notes
 *
 * Full trip editing (price, billing_type, driver assignment, etc.) remains admin-only.
 *
 * See docs/driver-portal.md → "Trip Lifecycle" for the full state machine.
 */

import { createClient } from '@/lib/supabase/client';
import type { DriverTrip } from '../types/trips.types';

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

/**
 * Fetch all trips assigned to a driver for today (local date).
 * Results are ordered chronologically by scheduled_at.
 */
export async function getTodaysTrips(driverId: string): Promise<DriverTrip[]> {
  const supabase = createClient();

  // Build inclusive day range in ISO format (local midnight → next midnight)
  const now = new Date();
  const dayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).toISOString();
  const dayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  ).toISOString();

  const { data, error } = await supabase
    .from('trips')
    .select(
      'id, scheduled_at, status, client_name, client_phone, pickup_address, dropoff_address, is_wheelchair, note, notes, stop_order, linked_trip_id, link_type, shift_id, greeting_style, pickup_station, dropoff_station'
    )
    .eq('driver_id', driverId)
    .gte('scheduled_at', dayStart)
    .lt('scheduled_at', dayEnd)
    .order('scheduled_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as DriverTrip[];
}

/**
 * Fetch trips for a driver with optional search and filter parameters.
 * Used by the Touren page for browsing historical and future trips.
 *
 * @param driverId - The current driver's account ID
 * @param options.search - Text to match against client_name, pickup_address, or dropoff_address
 * @param options.statusFilter - Trip status to filter by ('all' means no filter)
 * @param options.date - ISO date string (YYYY-MM-DD) to restrict results to a single day
 * @param options.limit - Max number of results (default: 50)
 */
export async function getDriverTrips(
  driverId: string,
  options?: {
    search?: string;
    statusFilter?: string;
    date?: string;
    limit?: number;
  }
): Promise<DriverTrip[]> {
  const supabase = createClient();

  let query = supabase
    .from('trips')
    .select(
      'id, scheduled_at, status, client_name, client_phone, pickup_address, dropoff_address, is_wheelchair, note, notes, stop_order, linked_trip_id, link_type, shift_id, greeting_style, pickup_station, dropoff_station'
    )
    .eq('driver_id', driverId)
    .order('scheduled_at', { ascending: false });

  // Filter by specific date if provided
  if (options?.date) {
    const dayStart = `${options.date}T00:00:00.000Z`;
    const dayEnd = `${options.date}T23:59:59.999Z`;
    query = query.gte('scheduled_at', dayStart).lte('scheduled_at', dayEnd);
  }

  // Filter by status (skip when 'all')
  if (options?.statusFilter && options.statusFilter !== 'all') {
    query = query.eq('status', options.statusFilter);
  }

  // Full-text-style search: Supabase ilike on each relevant column (OR)
  if (options?.search && options.search.trim().length > 0) {
    const term = `%${options.search.trim()}%`;
    query = query.or(
      `client_name.ilike.${term},pickup_address.ilike.${term},dropoff_address.ilike.${term}`
    );
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  } else {
    query = query.limit(50);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DriverTrip[];
}

// ---------------------------------------------------------------------------
// Write helpers
// ---------------------------------------------------------------------------

/**
 * Set a trip's status to 'in_progress'.
 * Called when the driver taps "Tour starten" on a trip card.
 *
 * The status update is always performed first and is the source of truth.
 * The shift_id link is written separately as a best-effort update — if the
 * trips table does not have a shift_id column yet, this silently does nothing
 * so the driver can still start tours without a blocking error.
 *
 * @param tripId   - The trip to start
 * @param shiftId  - Optional: the active shift ID to link to the trip
 */
export async function startTrip(
  tripId: string,
  shiftId?: string | null
): Promise<void> {
  const supabase = createClient();

  // 1. Always update status + record actual pickup time — this is the critical write
  const { error: statusError } = await supabase
    .from('trips')
    .update({
      status: 'in_progress',
      actual_pickup_at: new Date().toISOString()
    })
    .eq('id', tripId);

  if (statusError) throw statusError;

  // 2. Best-effort: link to active shift (silent fail if column doesn't exist)
  if (shiftId) {
    await supabase
      .from('trips')
      .update({ shift_id: shiftId })
      .eq('id', tripId)
      .then(() => {}); // intentionally swallow any error
  }
}

/**
 * Cancel a trip from the driver portal.
 *
 * Sets status → 'cancelled' and appends the driver's cancellation reason
 * to the trip's notes field so dispatchers can see why it was cancelled.
 *
 * @param tripId - The trip to cancel
 * @param reason - Free-text cancellation reason entered by the driver
 * @param existingNotes - Current notes value (to append rather than overwrite)
 */
export async function cancelTrip(
  tripId: string,
  reason: string,
  existingNotes?: string | null
): Promise<void> {
  const supabase = createClient();

  // Append reason to existing notes with a clear prefix
  const timestamp = new Date().toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const cancelNote = `[Storniert ${timestamp}]: ${reason}`;
  const updatedNotes = existingNotes
    ? `${existingNotes}\n${cancelNote}`
    : cancelNote;

  const { error } = await supabase
    .from('trips')
    .update({ status: 'cancelled', notes: updatedNotes })
    .eq('id', tripId);

  if (error) throw error;
}

/**
 * Complete a trip from the driver portal.
 * Sets status → 'completed'. Called when the driver taps "Tour beenden".
 *
 * @param tripId - The trip to mark as completed
 */
export async function completeTrip(tripId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('trips')
    .update({
      status: 'completed',
      actual_dropoff_at: new Date().toISOString()
    })
    .eq('id', tripId);

  if (error) throw error;
}
