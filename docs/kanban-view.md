# Kanban View – Features & Behavior

This document describes the Kanban view for trips in the dispatch dashboard: behavior, UX patterns, and implementation details.

---

## Overview

**File:** `src/features/trips/components/trips-kanban-board.tsx`

The Kanban view lets dispatchers move trips between columns (driver, status, payer) via drag-and-drop, edit trip times inline, and group trips for multi-passenger dispatches. **All changes** (assignments, grouping, time edits) are staged in localStorage until the user clicks "Speichern". "Verwerfen" clears pending changes.

---

## 1. Including Unscheduled Trips

When a date filter is active (including the default "today"), the server query includes:

- Trips with `scheduled_at` in the selected date range (or day / week range).
- Unscheduled trips (`scheduled_at IS NULL`) **only if** they belong to that window:
  - `requested_date` matches the selected calendar day or falls inside the selected range.
  - On the **server’s** “today” for that same calendar day, trips with both `scheduled_at` and `requested_date` null still appear (backlog).

**Why:** Previously, `(scheduled_at in range) OR (scheduled_at.is.null)` returned **every** unscheduled trip on **every** day, so cards looked “stuck” when changing the date.

**Implementation:** `trips-listing.tsx` builds a Supabase `.or()` across scheduled rows and scoped unscheduled rows as above.

**Full write-up (symptom vs root cause, URL shapes, fields):** [trips-date-filter.md](./trips-date-filter.md).

---

## 2. Editable Time

Each trip card displays an inline time input; no extra click or pencil icon. Change the time directly and it is staged in `pendingChanges` (persisted to localStorage). Only the time is editable (date comes from `scheduled_at`, `requested_date`, or today).

**Flow:**

1. User changes time in the input → change is staged in `pendingChanges`.
2. User clicks "Speichern" → time changes are persisted.
3. `scheduled_at` is updated per trip; time changes do **not** cascade to other trips in the same group.

---

## 3. Pending Changes Flow

**All changes** (driver, status, payer, scheduled_at, group_id, stop_order) are staged in `useKanbanPendingStore` and persisted to localStorage via `@/lib/kanban-local-storage` (key: `STORAGE_KEYS.KANBAN_PENDING`). Restored on mount so changes survive view switch, reload, and accidental close.

- **Stage:** Drag to column, drop on trip (group), edit time, or ungroup → updates `pendingChanges` in the store. No API calls.
- **Speichern:** Click "Speichern" → batch update all pending trips via `tripsService.updateTrip`, then clear store and refresh.
- **Verwerfen:** Clears all pending changes without persisting.
- **Prune on list change / rehydrate:** Pending keys that are not in the current server trip list (e.g. after changing the date filter or when localStorage rehydrates) are dropped automatically so stale edits do not block seeing the correct trips.
- **beforeunload:** Warns user before closing/refreshing if there are unsaved changes (set `returnValue` for browser compatibility).

---

## 4. Grouping Trips (Option A: Drop-on-Trip)

Trips can be grouped for multi-passenger dispatches by dragging one trip onto another.

**Behavior:**

- **Drop trip A onto trip B** → A and B share the same `group_id`; staged in localStorage.
- If B has no group: a new `group_id` (UUID) is created; B gets `stop_order = 1`, A gets `stop_order = 2`.
- If B already has a group: A joins it with `stop_order = max(existing) + 1`.

**Ungroup:** Click the X on the group header to dissolve the whole group. Staged in localStorage; persist on "Speichern".

**Drag entire group:** Drag the group header to move all trips in the group together. Drag a single card out of the group to remove it. All staged until Save.

---

## 5. Orphan Columns & Loading State

**Orphan columns:** `buildColumns` ensures every trip bucket has a column. Trips with `driver_id`/`status`/`payer_id` not in the main list appear in fallback columns (e.g. "Fahrer (unbekannt)", "Status (unbekannt)", "Kostenträger (unbekannt)").

**Loading state:** When `useTripFormData().isLoading` is true, the board shows "Laden…" instead of rendering with empty drivers/payers. Prevents transient "all assigned trips disappear" during load.

---

## 6. DnD Structure

- **Columns:** `useDroppable` with `id: column.id`; `useDraggable` with `id: column-${column.id}` for column reordering.
- **Trip cards:** Each card has:
  - `useDroppable` with `id: trip-${trip.id}` for drop-on-trip (grouping).
  - `useDraggable` with `id: trip.id` for dragging.
- **Groups:** `useDraggable` with `id: group-${groupId}` on the group header.
- **DragOverlay:** Renders a lightweight preview (no hooks) when dragging to avoid DOM/transform glitches with zoom and scroll.

On `handleDragEnd`, if `over.id` starts with `trip-`, the action is grouping; if `active.id` starts with `column-`, it is column reorder; otherwise it is a column move (driver/status/payer).

---

## 7. Column Order & Zoom

- **Column order:** Persisted to localStorage (`STORAGE_KEYS.KANBAN_COLUMN_ORDER`) per group-by mode via `@/lib/kanban-local-storage`. Drag column headers to reorder.
- **Zoom:** 50–100%; persisted in session. Editable percentage input; zoom applied via CSS `zoom`.
