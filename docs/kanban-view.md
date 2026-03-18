# Kanban View – Features & Behavior

This document describes the Kanban view for trips in the dispatch dashboard: behavior, UX patterns, and implementation details.

---

## Overview

**File:** `src/features/trips/components/trips-kanban-board.tsx`

The Kanban view lets dispatchers move trips between columns (driver, status, payer) via drag-and-drop, edit trip times inline, and group trips for multi-passenger dispatches.

---

## 1. Including Unscheduled Trips

When a date filter is active (including the default "today"), the server query includes:

- Trips with `scheduled_at` in the selected date range
- Trips with `scheduled_at IS NULL` (unscheduled)

**Implementation:** `trips-listing.tsx` uses Supabase `.or()` so the filter is  
`(scheduled_at in range) OR (scheduled_at.is.null)`.

---

## 2. Editable Time

Each trip card displays an inline time input; no extra click or pencil icon. Change the time directly and it is staged in `pendingChanges`. Only the time is editable (date comes from `scheduled_at`, `requested_date`, or today).

**Flow:**

1. User changes time in the input → change is staged in `pendingChanges`.
2. User clicks "Speichern" → all pending changes (including time) are persisted.
3. `scheduled_at` is updated per trip; time changes do **not** cascade to other trips in the same group.

---

## 3. Grouping Trips (Option A: Drop-on-Trip)

Trips can be grouped for multi-passenger dispatches by dragging one trip onto another.

**Behavior:**

- **Drop trip A onto trip B** → A and B share the same `group_id`.
- If B has no group: a new `group_id` (UUID) is created; B gets `stop_order = 1`, A gets `stop_order = 2`.
- If B already has a group: A joins it with `stop_order = max(existing) + 1`.

**Ungroup:** Click the X on the "Gruppe" badge to remove that trip from the group (`group_id` and `stop_order` set to null). Ungrouping is persisted immediately (no staged save).

**Collision detection:** Uses `pointerWithin` so dropping on a trip card (rather than the column) is detected reliably.

**Database:** `group_id` and `stop_order` are stored on the `trips` table. Grouped trips share the same driver when assigned via the table or Kanban; see `driver-select-cell.tsx` for cascade behavior.

---

## 4. Pending Changes Flow

All edits (driver, status, payer, time, grouping) are staged in `pendingChanges` until the user clicks "Speichern":

1. Drag to column → stage driver/status/payer.
2. Drag onto trip → stage `group_id` and `stop_order` for both trips if needed.
3. Edit time → stage `scheduled_at`.
4. Click "Speichern" → batch update all trips via `tripsService.updateTrip`.

"Verwerfen" clears all pending changes without persisting.

---

## 5. DnD Structure

- **Columns:** `useDroppable` with `id: column.id` (e.g. `unassigned`, driver UUID, status, payer).
- **Trip cards:** Each card has:
  - `useDroppable` with `id: trip-${trip.id}` for drop-on-trip (grouping).
  - `useDraggable` with `id: trip.id` for dragging.

On `handleDragEnd`, if `over.id` starts with `trip-`, the action is grouping; otherwise it is a column move (driver/status/payer).
