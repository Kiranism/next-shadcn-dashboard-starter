/**
 * Pure utility functions for building kanban column definitions and
 * distributing trips into their column buckets.
 *
 * Both functions are side-effect-free and therefore easily testable.
 */

import type { KanbanTrip, KanbanColumn, GroupByMode } from './kanban-types';

// ─── buildColumns ─────────────────────────────────────────────────────────────

/**
 * Builds column definitions for the Kanban board.
 * Ensures every trip bucket has a column:
 * - Driver: known drivers + orphan driver_ids → "Fahrer (unbekannt)"
 * - Status: fixed ordered list + orphan statuses → "Status (unbekannt)"
 * - Payer: known payers + orphan payer_ids → "Kostenträger (unbekannt)"
 */
export function buildColumns(
  trips: KanbanTrip[],
  groupBy: GroupByMode,
  drivers: { id: string; name: string }[]
): KanbanColumn[] {
  if (groupBy === 'driver') {
    const driverIds = new Set(drivers.map((d) => d.id));
    const driverColumns: KanbanColumn[] = drivers
      .map((driver) => ({ id: driver.id, title: driver.name }))
      .sort((a, b) => a.title.localeCompare(b.title, 'de'));

    const orphanDriverIds = [
      ...new Set(trips.map((t) => t.driver_id).filter(Boolean))
    ].filter((id): id is string => !!id && !driverIds.has(id));

    const orphanColumns: KanbanColumn[] = orphanDriverIds.map((id) => ({
      id,
      title: 'Fahrer (unbekannt)'
    }));

    return [
      { id: 'unassigned', title: 'Nicht zugewiesen' },
      ...driverColumns,
      ...orphanColumns
    ];
  }

  if (groupBy === 'status') {
    const knownStatuses = new Set([
      'pending',
      'assigned',
      'in_progress',
      'completed',
      'cancelled'
    ]);
    const statusOrder: KanbanColumn[] = [
      { id: 'pending', title: 'Offen' },
      { id: 'assigned', title: 'Zugewiesen' },
      { id: 'in_progress', title: 'In Fahrt' },
      { id: 'completed', title: 'Abgeschlossen' },
      { id: 'cancelled', title: 'Storniert' }
    ];

    const orphanStatuses = [
      ...new Set(trips.map((t) => t.status).filter(Boolean))
    ].filter((s): s is string => !!s && !knownStatuses.has(s));

    const orphanStatusColumns = orphanStatuses.map((id) => ({
      id,
      title: 'Status (unbekannt)'
    }));

    return [...statusOrder, ...orphanStatusColumns];
  }

  if (groupBy === 'payer') {
    const payerNames = new Map<string, string>();
    for (const trip of trips) {
      const payerId = trip.payer_id;
      const name = trip.payer?.name;
      if (payerId && name && !payerNames.has(payerId)) {
        payerNames.set(payerId, name);
      }
    }

    const payerColumns: KanbanColumn[] = Array.from(payerNames.entries()).map(
      ([id, name]) => ({ id, title: name })
    );
    payerColumns.sort((a, b) => a.title.localeCompare(b.title, 'de'));

    const knownPayerIds = new Set(payerNames.keys());
    const orphanPayerIds = [
      ...new Set(trips.map((t) => t.payer_id).filter(Boolean))
    ].filter((id): id is string => !!id && !knownPayerIds.has(id));

    const orphanPayerColumns = orphanPayerIds.map((id) => ({
      id,
      title: 'Kostenträger (unbekannt)'
    }));

    return [
      { id: 'no_payer', title: 'Ohne Kostenträger' },
      ...payerColumns,
      ...orphanPayerColumns
    ];
  }

  return [];
}

// ─── buildItemsByColumn ───────────────────────────────────────────────────────

/**
 * Distributes trips into column buckets and sorts each bucket by scheduled_at.
 * Returns a map of columnId → sorted trip array.
 */
export function buildItemsByColumn(
  trips: KanbanTrip[],
  columns: KanbanColumn[],
  groupBy: GroupByMode
): Record<string, KanbanTrip[]> {
  const itemsByColumn: Record<string, KanbanTrip[]> = {};

  for (const column of columns) {
    itemsByColumn[column.id] = [];
  }

  for (const trip of trips) {
    const columnId =
      groupBy === 'driver'
        ? (trip.driver_id ?? 'unassigned')
        : groupBy === 'status'
          ? trip.status
          : (trip.payer_id ?? 'no_payer');

    if (!itemsByColumn[columnId]) {
      itemsByColumn[columnId] = [];
    }
    itemsByColumn[columnId].push(trip);
  }

  const getSortPosition = (trip: KanbanTrip) => {
    if (trip.scheduled_at) return new Date(trip.scheduled_at).getTime();
    if (trip.link_type === 'return') return Infinity;
    return -1;
  };

  Object.keys(itemsByColumn).forEach((columnId) => {
    itemsByColumn[columnId].sort(
      (a, b) => getSortPosition(a) - getSortPosition(b)
    );
  });

  return itemsByColumn;
}
