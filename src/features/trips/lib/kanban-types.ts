/**
 * Shared types for the Kanban board.
 * Imported by all kanban components and utility files.
 */

import type { Trip } from '../api/trips.service';

// ─── Core data types ─────────────────────────────────────────────────────────

/** A single trip enriched with joined relations used on the board. */
export type KanbanTrip = Trip & {
  payer?: { name?: string | null } | null;
  billing_type?: { name?: string | null; color?: string | null } | null;
  driver?: { name?: string | null } | null;
  group_id?: string | null;
  stop_order?: number | null;
  requested_date?: string | null;
};

/** How the board is currently grouped. */
export type GroupByMode = 'driver' | 'status' | 'payer';

/** A single kanban column (driver / status / payer bucket). */
export type KanbanColumn = {
  id: string;
  title: string;
  subtitle?: string;
};

// ─── Pending changes ──────────────────────────────────────────────────────────

/**
 * Staged mutation for a single trip.
 * All assignments and grouping changes are staged here until "Speichern".
 */
export type PendingChange = {
  driver_id?: string | null;
  status?: string;
  payer_id?: string | null;
  scheduled_at?: string | null;
  group_id?: string | null;
  stop_order?: number | null;
};

// ─── Shared callback types ────────────────────────────────────────────────────

export type OnTimeChange = (tripId: string, scheduledAt: string | null) => void;
export type OnStopOrderChange = (tripId: string, order: number) => void;
export type OnUngroup = (groupId: string) => void;
