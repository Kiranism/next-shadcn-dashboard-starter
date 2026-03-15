/**
 * Derives the trip status to set when driver_id changes, so UI and backend stay in sync
 * (e.g. "Offen" -> "Zugewiesen" when a driver is assigned, and back when unassigned).
 * Use this wherever trips are updated with a new driver_id (table cell, kanban, create form).
 *
 * @param currentStatus - Current trip status (e.g. 'pending', 'assigned')
 * @param newDriverId - The driver_id being set (string) or null when unassigning
 * @returns The status to set, or undefined if no change is needed
 */
export function getStatusWhenDriverChanges(
  currentStatus: string,
  newDriverId: string | null
): string | undefined {
  if (newDriverId != null && newDriverId !== '') {
    if (currentStatus === 'pending') return 'assigned';
    return undefined;
  }
  // Unassigning driver
  if (currentStatus === 'assigned') return 'pending';
  return undefined;
}
