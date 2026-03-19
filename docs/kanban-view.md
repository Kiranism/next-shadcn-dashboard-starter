# Kanban View – Features & Behavior

This document describes the Kanban view for trips in the dispatch dashboard: behavior, UX patterns, and implementation details.

---

## Overview

**Entry point:** `src/features/trips/components/trips-kanban-board.tsx` (thin re-export shim)

**Source folder:** `src/features/trips/components/kanban/`

The Kanban view lets dispatchers move trips between columns (driver, status, payer) via drag-and-drop, edit trip times inline, and group trips for multi-passenger dispatches. **All changes** (assignments, grouping, time edits) are staged in localStorage until the user clicks "Speichern". "Verwerfen" clears pending changes.

---

## File Structure

The board is split into focused, single-responsibility files:

```
src/features/trips/
├── lib/
│   ├── kanban-types.ts          – Shared TS types (KanbanTrip, GroupByMode, PendingChange, …)
│   ├── kanban-columns.ts        – buildColumns(), buildItemsByColumn()
│   └── kanban-grouping.ts       – chunkItemsByGroup(), deriveStatusForPending()
│
└── components/
    ├── trips-kanban-board.tsx   – Re-export shim (preserves existing import path)
    └── kanban/
        ├── index.ts                   – Barrel export
        ├── kanban-board.tsx           – State, DnD handlers, save/reset orchestration
        ├── kanban-header.tsx          – Zoom, groupBy selector, Speichern/Verwerfen bar
        ├── kanban-column.tsx          – Droppable column (also draggable for reorder)
        ├── kanban-group-container.tsx – Draggable grouped-trip block
        ├── kanban-trip-card.tsx       – Individual draggable card
        └── kanban-drag-preview.tsx    – DragOverlay content (hook-free lightweight preview)
```

---

## 1. Including Unscheduled Trips

When a date filter is active (including the default "today"), the server query includes:

- Trips with `scheduled_at` in the selected date range.
- Unscheduled trips (`scheduled_at IS NULL`) **only if** they belong to that window via `requested_date`.

**Implementation:** `trips-listing.tsx` builds a Supabase `.or()` across scheduled rows and scoped unscheduled rows.

**Full write-up:** [trips-date-filter.md](./trips-date-filter.md).

---

## 2. Editable Time

Each trip card displays an inline time input. Change the time directly — it is staged in `pendingChanges`. Only the time is editable; the date comes from `scheduled_at`, `requested_date`, or today.

**Flow:** User changes time → staged in `pendingChanges` → "Speichern" persists via `tripsService.updateTrip`.

---

## 3. Stop-Order (Grouped Trips)

When a card is inside a group, a small numeric input appears in the card header (right of the time, left of the status badge). This sets the processing sequence within the group (1, 2, 3, …). Changes are staged and saved along with other pending changes.

---

## 4. Pending Changes Flow

All changes are staged in `useKanbanPendingStore` (persisted to localStorage via `kanban-local-storage`, key: `STORAGE_KEYS.KANBAN_PENDING`). Survives view switching, reload, and accidental close.

| Action | Result |
|---|---|
| Drag card to column | Stages `driver_id` / `status` / `payer_id` + derived status |
| Drop card onto card | Stages `group_id` + `stop_order` for both trips |
| Edit time | Stages `scheduled_at` |
| Edit stop-order | Stages `stop_order` |
| Ungroup | Stages `group_id: null`, `stop_order: null` |
| **Speichern** | Batch-updates all pending trips → refresh → clear store |
| **Verwerfen** | Clears pending changes, router.refresh() to restore server state |

**Status derivation:** Status is staged immediately at drag-end (not only at Save) so the badge reflects the correct state without waiting for Save + refresh. At Save time, status is only re-derived when `driver_id` is explicitly in the change — a grouping-only save (e.g. `group_id` or `stop_order` only) does **not** touch status, preventing silent resets of already-assigned trips.

**Prune on list change / rehydrate:** Pending keys not in the current server trip list are dropped automatically to avoid stale edits.

**beforeunload:** Warns user before closing/refreshing if there are unsaved changes.

---

## 5. Grouping Trips

Trips can be grouped for multi-passenger dispatches by dragging one trip onto another.

**Behavior:**

- **Drop trip A onto trip B** → A and B share the same `group_id`; staged in localStorage.
- If B has no group: a new `group_id` (UUID) is created; B gets `stop_order = 1`, A gets `stop_order = 2`.
- If B already has a group: A joins with `stop_order = max(existing) + 1`.

**Ungroup:** Click the × on the group header to dissolve the whole group. Staged; persisted on Save.

**Drag entire group:** Drag the group header to move all trips together. Drag a single card out to remove it from the group.

---

## 6. Orphan Columns & Loading State

**Orphan columns:** `buildColumns` ensures every trip bucket has a column. Trips with a `driver_id`/`status`/`payer_id` not in the active list appear in fallback columns ("Fahrer (unbekannt)", etc.).

**Loading state:** While `useTripFormData().isLoading` is true, the board shows "Laden…" to prevent an empty-driver flash where all assigned trips would disappear momentarily.

---

## 7. DnD Structure

- **Columns:** `useDroppable(id: column.id)` + `useDraggable(id: \`column-${column.id}\`)` for column reordering.
- **Trip cards:** `useDroppable(id: \`trip-${trip.id}\`)` for drop-on-trip grouping + `useDraggable(id: trip.id)`.
- **Groups:** `useDraggable(id: \`group-${groupId}\`)` on the group header.
- **DragOverlay:** Renders a lightweight hook-free `KanbanDragPreview`. The overlay element must **not** have a `transform` style — dnd-kit owns that for cursor tracking. The preview content is size-matched via CSS `zoom` on an inner wrapper. Original card goes `opacity: 0` while dragging (invisible DOM placeholder), columns go `opacity: 0.3`.
- **Coordinate system:** The board grid uses `transform: scale(zoom)` (not CSS `zoom`) so scroll measurements stay accurate. The DragOverlay is rendered outside this scaled container via dnd-kit's portal.

**`handleDragEnd` routing:**

| `active.id` prefix | `over.id` prefix | Action |
|---|---|---|
| `column-` | column id | Column reorder |
| trip id | `trip-` | Grouping (drop-on-trip) |
| trip id or `group-` | column id | Assignment (driver / status / payer) |

---

## 8. Column Order & Zoom

- **Column order:** Persisted to localStorage (`STORAGE_KEYS.KANBAN_COLUMN_ORDER`) per group-by mode. Drag column headers to reorder.
- **Zoom:** 50–100%, editable percentage input. Applied to the board grid via `transform: scale()` with `transformOrigin: top left` and a compensating `width` so the scroll container still fills correctly.
