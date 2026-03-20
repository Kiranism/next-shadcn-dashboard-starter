# Print / ZIP export (Fahrten drucken)

This document describes the **Fahrten drucken** flow on the trips dashboard: what gets generated, how it maps to Kanban/PDF rules, and where the code lives.

---

## Overview

**Entry point:** `src/features/trips/components/print-trips-button.tsx` (button **Fahrten drucken** on `src/app/dashboard/trips/page.tsx`).

The user picks a **calendar day** and clicks **ZIP generieren**. The client loads trips for that local day from Supabase, then builds a **ZIP** download:

| Content | Description |
|--------|-------------|
| **Per-driver PDFs** | One PDF per driver name (including **Nicht zugewiesen** when applicable), same visual pipeline as before: offscreen `MobilePrintTemplate` → JPEG snapshot → jsPDF with map/phone links. |
| **`fahrtenplan_uebersicht.jpg`** | **Hochformat** overview: one horizontal row of **narrow columns** (Kanban-style), one column per assigned driver with trips. |
| **`fahrtenplan_uebersicht_handy_querformat.jpg`** | **Querformat** overview: same **column** layout and same **card rules** as PDFs, but a fixed **1280px** wide canvas; driver columns **share width equally** (`flex: 1`) so the row uses the full width. |

Overviews include only **assigned** drivers with at least one trip that day (**no** empty columns, **no** „Nicht zugewiesen“ column).

**Image format:** overview assets are **JPEG only** (no PNG). PDFs remain PDF.

---

## Shared card logic (parity with per-driver PDF)

Trip cards in both JPEG overviews use **`PrintTripGroupsList`** (`src/features/trips/components/print-trip-groups-list.tsx`), aligned with **`MobilePrintTemplate`** / PDF:

- **Grouping** by `group_id` (merged **Gruppe** cards, multi Start/Ziel, shared Hinweis).
- **Billing:** `color-mix` background, left accent, coloured time chip, billing name.
- **Wheelchair** icon next to names when `is_wheelchair`.
- **Start / Ziel** with street + optional station chip + city suffix (incl. **Oldenburg** hide rule).
- **Hinweis** amber block for notes.

**`compact`:** narrow columns (Hochformat strip + landscape) use smaller typography; logic is unchanged.

---

## Column / bucket model

Column list and per-column trips come from the same helpers as the Kanban **group by driver** view:

- `buildColumns()` / `buildItemsByColumn()` in `src/features/trips/lib/kanban-columns.ts`
- Active drivers from `accounts` (`role = driver`, `is_active = true`)

---

## Implementation files

| File | Role |
|------|------|
| `print-trips-button.tsx` | Fetch trips + drivers, ZIP assembly, `toJpeg` → `JSZip`, PDF loop. |
| `mobile-print-template.tsx` | Per-driver print page; delegates cards to `PrintTripGroupsList`. |
| `print-trip-groups-list.tsx` | Shared PDF-style trip/group cards (`compact` optional). |
| `board-overview-print-template.tsx` | Hochformat overview layout + columns. |
| `board-landscape-only-print-template.tsx` | Querformat overview: 1280px root, `flex-1` columns. |

**Libraries:** `html-to-image` (`toJpeg`), `jspdf`, `jszip`.

---

## UX copy

The popover helper text is intentionally short, e.g. **ZIP:Trips Übersicht für Fahrer** – details live in this doc.

---

## Related docs

- [Kanban view](./kanban-view.md) – column grouping and behaviour on the board.
- [Trips date filter](./trips-date-filter.md) – date filtering on the trips page.
