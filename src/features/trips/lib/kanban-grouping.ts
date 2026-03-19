/**
 * Trip grouping utilities for the Kanban board.
 *
 * chunkItemsByGroup  – splits a flat trip list into chronologically sorted
 *                      single-trip and multi-trip group chunks.
 *
 * deriveStatusForPending – computes the status that should be staged when a
 *                          driver assignment is changed on the board, so the
 *                          badge reflects the correct state before Save.
 */

import { getStatusWhenDriverChanges } from './trip-status';
import type { KanbanTrip, PendingChange } from './kanban-types';

// ─── chunkItemsByGroup ────────────────────────────────────────────────────────

export type KanbanChunk =
  | { type: 'single'; trips: KanbanTrip[] }
  | { type: 'group'; trips: KanbanTrip[] };

/**
 * Splits a flat list of column trips into display chunks:
 * - Single trips become `{ type: 'single', trips: [trip] }`.
 * - Trips sharing a group_id become `{ type: 'group', trips: [...] }`.
 *
 * The result is sorted chronologically (earliest scheduled_at first).
 * Within groups, trips are sorted by stop_order, then scheduled_at.
 */
export function chunkItemsByGroup(items: KanbanTrip[]): KanbanChunk[] {
  const groupMap = new Map<string, KanbanTrip[]>();
  const singles: KanbanTrip[] = [];

  for (const trip of items) {
    if (!trip.group_id) {
      singles.push(trip);
    } else {
      const existing = groupMap.get(trip.group_id) ?? [];
      existing.push(trip);
      groupMap.set(trip.group_id, existing);
    }
  }

  const getSortPosition = (t: KanbanTrip): number => {
    if (t.scheduled_at) return new Date(t.scheduled_at).getTime();
    if (t.link_type === 'return') return Infinity;
    return -1;
  };

  const blocks: {
    type: 'single' | 'group';
    trips: KanbanTrip[];
    position: number;
  }[] = [];

  for (const trip of singles) {
    blocks.push({
      type: 'single',
      trips: [trip],
      position: getSortPosition(trip)
    });
  }

  for (const groupTrips of groupMap.values()) {
    groupTrips.sort((a, b) => {
      if (a.stop_order != null && b.stop_order != null)
        return a.stop_order - b.stop_order;
      return getSortPosition(a) - getSortPosition(b);
    });
    const position = Math.min(...groupTrips.map(getSortPosition));
    blocks.push({ type: 'group', trips: groupTrips, position });
  }

  blocks.sort((a, b) => a.position - b.position);
  return blocks.map(({ type, trips }) => ({ type, trips }));
}

// ─── deriveStatusForPending ───────────────────────────────────────────────────

/**
 * Computes the status that should be staged in pendingChanges when
 * a driver assignment is changed via drag-and-drop. Staging the status
 * at drag-end keeps the badge correct without waiting for Save + refresh.
 *
 * Returns `undefined` if no status change is needed.
 */
export function deriveStatusForPending(
  tripId: string,
  newDriverId: string | null | undefined,
  pendingChanges: Record<string, PendingChange>,
  serverTrips: KanbanTrip[]
): string | undefined {
  if (newDriverId === undefined) return undefined;
  const serverStatus =
    serverTrips.find((t) => t.id === tripId)?.status ?? 'pending';
  const currentStatus = pendingChanges[tripId]?.status ?? serverStatus;
  return (
    getStatusWhenDriverChanges(currentStatus, newDriverId) ?? currentStatus
  );
}
