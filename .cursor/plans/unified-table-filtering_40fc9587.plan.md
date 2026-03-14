---
name: unified-table-filtering
overview: Standardize how table filters work across the app so they are easy to reuse, URL-aware, and consistent with shadcn/TanStack patterns.
todos:
  - id: audit-columns
    content: Review existing table column definitions (trips, clients, etc.) to ensure filterable columns use consistent meta (variant, label, options).
    status: pending
  - id: create-url-filter-helper
    content: Design and add a shared helper/hook to sync TanStack column filters with nuqs query params and handle pagination reset.
    status: pending
  - id: refine-trips-driver-filter
    content: Refactor `TripsDriverFilter` to use the shared URL–filter helper instead of custom state wiring.
    status: pending
  - id: generalize-to-other-tables
    content: Adopt the same pattern for other tables (status, date filters, etc.) using column meta + helper, minimizing custom per-table filter components.
    status: pending
isProject: false
---

### Goal

Unify how tables handle filtering so that:

- Filter **behavior** (how rows are filtered) is declared in one consistent place
- Filter **state** (URL params, reset, pagination reset) is reusable
- Filter **UI** is mostly generic, with opt‑in custom controls when needed

### Current situation

- `TripsTable` uses `DataTableToolbar` plus a custom `TripsDriverFilter` child.
- `DataTableToolbar` already supports generic filters via column `meta.variant` (`text`, `select`, `date`, `multiSelect`, etc.) and `column.getCanFilter()`.
- `TripsDriverFilter` manages its own `driver_id` query param with `nuqs`, resets the page index, and does not go through the column meta system. It’s feature-specific and not easily reusable.

### Recommended overall strategy (hybrid, but standardized)

- **Core rule**: The **source of truth for what can be filtered** and how it’s rendered lives in **column definitions** via `meta` (label, variant, options, etc.). This aligns with TanStack + shadcn patterns and keeps configuration close to the data.
- Use `DataTableToolbar` as the **default filter UI** for all standard filter types (text, status select, date range, numeric, etc.).
- For advanced cases that must tightly integrate with business logic or URL params (like special driver behavior), use **very thin feature-specific filter components** that:
  - Delegate all **state wiring** to a shared utility/hook (for URL+table sync and pagination reset)
  - Avoid reimplementing filter predicates or bespoke patterns per table.

### Concrete design decisions

- **Do NOT create one giant "filter function"** that tries to handle all tables; it becomes hard to evolve and reason about. Instead:
  - Keep **filter predicates** close to the data/columns (via TanStack column filterFns or server-side query builders).
  - Extract **shared state wiring** into a small module, e.g. `useUrlTableFilter` or `createUrlFilterHandler`.
- **Column meta as configuration**:
  - Ensure each table’s columns define `meta.variant`, `meta.label`, and `meta.options` (where applicable) so `DataTableToolbar` can render consistent controls.
  - For enums like status, reuse a shared `statusOptions` constant across tables.
- **URL + table sync utilities**:
  - Introduce a small helper (e.g. `syncColumnFilterWithQueryState`) that takes `table`, `columnId`, `queryKey`, and optional transform functions and:
    - Keeps TanStack `column.getFilterValue()` in sync with a `nuqs` state for that query param.
    - Automatically resets `table.setPageIndex(0)` when filters change.
  - This helper will be reused for driver, status, and other filters across pages.

### High-level implementation steps (once approved)

- **1. Audit column filter meta**
  - Check trips and other feature tables to ensure filterable columns have proper `meta.variant`, `label`, and `options` defined.
- **2. Introduce a shared URL–filter sync helper**
  - Create a small hook/utility in a shared location (e.g. `src/hooks/use-url-table-filter.ts` or `src/lib/table-filters.ts`) to:
    - Bridge `nuqs` query state and TanStack column filters.
    - Encapsulate `setPageIndex(0)` and reset behavior.
- **3. Refine `TripsDriverFilter` to use shared helper**
  - Replace its custom `useQueryState` + manual `table.setPageIndex(0)` logic with the shared helper.
  - Ensure it updates the appropriate column filter (or server-side query) via a unified code path.
- **4. Apply the same pattern to other filter types**
  - For status, date, etc., either rely entirely on `DataTableToolbar`+column meta, or add thin wrappers that reuse the same helper when URL params are required.
- **5. Document the pattern**
  - Add brief comments or a small doc snippet outlining: "To add a new filter across the app: define column meta, then (optionally) wire a URL param using `useUrlTableFilter`."

