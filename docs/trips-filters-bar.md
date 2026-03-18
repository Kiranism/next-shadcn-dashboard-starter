## Trips Filters Bar – Architecture & Reuse Guide

This document explains how the `TripsFiltersBar` works, why it's designed this way, and how to recreate the same pattern for other pages (e.g. clients, invoices, vehicles) while staying aligned with best practices for high-end dispatch dashboards.

---

### 1. High-level goals

- **Single source of truth** for filters:
  - Filters are applied **on the server** via `searchParamsCache` + Supabase query.
  - All views (list, kanban) share the same filtered dataset.
- **URL as state**:
  - Filters live in the query string (e.g. `?status=pending&driver_id=...`).
  - Links are shareable and restorable; browser back/forward works.
- **Navigation-driven updates**:
  - Filter changes trigger **Next.js navigations** (`router.replace`) instead of ad‑hoc history changes.
  - This guarantees that `searchParams` in the server component always match what's in the URL.
- **Dispatch-friendly UX**:
  - No hard refresh needed; everything updates automatically.
  - Pagination resets to page 1 on filter changes to avoid "empty page" confusion.

---

### 2. Data flow overview

Relevant files:

- `src/app/dashboard/trips/page.tsx`
- `src/lib/searchparams.ts`
- `src/features/trips/components/trips-listing.tsx`
- `src/features/trips/components/trips-filters-bar.tsx`
- `src/features/trips/components/trips-view-toggle.tsx`
- `src/features/trips/components/trips-kanban-board.tsx` (see `docs/kanban-view.md` for Kanban features)
- `src/features/trips/components/trips-tables/index.tsx`
- `src/features/trips/stores/use-trips-table-store.ts`

**Request/response flow:**

1. **Route**: `GET /dashboard/trips?...query params...`
2. **Page component** (`dashboard/trips/page.tsx`):
   - Receives `searchParams` (via `nuqs/server`).
   - Calls `searchParamsCache.parse(searchParams)`.
   - Renders `TripsListingPage` inside `<Suspense>`.
3. **Server component** (`TripsListingPage`):
   - Uses `searchParamsCache.get('status' | 'driver_id' | 'payer_id' | ...)` to read filters.
   - Builds a Supabase query and applies filters on the server.
   - Renders `TripsFiltersBar` (shared across views) and then the active view:
     - List view (`TripsTable`),
     - Kanban view (`TripsKanbanBoard`). Kanban supports inline time editing and drag-to-group; see `docs/kanban-view.md`.
4. **Client filter bar** (`TripsFiltersBar`):
   - Reads current filter values from `useSearchParams()`.
   - On change, builds a new `URLSearchParams` and calls `router.replace(nextUrl, { scroll: false })`.
   - This causes Next.js to re-run the page with new `searchParams`, reapplying the filters on the server.

Key point: **The URL query string is the contract** between the filter bar and the server-side filtering.

---

### 3. `TripsFiltersBar` – mechanics

File: `src/features/trips/components/trips-filters-bar.tsx`

Core hooks:

- `useRouter`, `usePathname`, `useSearchParams` from `next/navigation`.
- `useTripFormData(payerId)` to fetch drivers, payers, billing types client-side.
- `useTripsTableStore` to read the active TanStack `table` instance and its column visibility state.

Filter values are read from the URL:

```tsx
const name = searchParams.get('name') ?? '';
const driverId = searchParams.get('driver_id') ?? 'all';
const status = searchParams.get('status') ?? 'all';
const payerId = searchParams.get('payer_id') ?? 'all';
const billingTypeId = searchParams.get('billing_type_id') ?? 'all';
const scheduledAt = searchParams.get('scheduled_at') ?? '';
const currentView = searchParams.get('view') ?? 'list';
```

UI controls (left side of the bar):

- Text input for passenger/address (`name`).
- Date picker with quick-select week shortcuts (`scheduled_at`).
- Driver select (`driver_id`) — includes "Alle Fahrer" and "Nicht zugewiesen".
- Status select (`status`).
- Payer select (`payer_id`).
- Billing type select (`billing_type_id`) — only visible when a payer is selected and billing types exist.
- **Column visibility dropdown** (`Spalten`) — only visible when `view === 'list'`. See section 5.

Right side of the bar:

- Total trip count (`{totalItems} Fahrten`).
- "Filter zurücksetzen" button — bulk-resets all filter keys to null.

---

### 4. Updating filters (the key pattern)

The critical piece is a small helper that:

1. Starts from current `searchParams`.
2. Applies partial updates (set/remove keys).
3. Resets `page` to `1` when filters change.
4. Navigates via `router.replace`.

```tsx
const updateFilters = (updates: Record<string, string | null>) => {
  const params = new URLSearchParams(searchParams.toString());

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });

  // Always reset to first page when filters change
  params.set('page', '1');

  const next = `${pathname}?${params.toString()}`;
  startTransition(() => {
    router.replace(next, { scroll: false });
  });
};
```

Each UI control simply expresses its change as a call to `updateFilters`:

```tsx
// Text search
<Input
  value={name}
  onChange={(event) =>
    updateFilters({ name: event.target.value || null })
  }
/>

// Status select
<Select
  value={status}
  onValueChange={(val) =>
    updateFilters({ status: val === 'all' ? null : val })
  }
/>

// Date picker
<Calendar
  selected={selectedDateRange}
  onSelect={(range) => {
    if (!range?.from) {
      updateFilters({ scheduled_at: null });
      return;
    }
    updateFilters({ scheduled_at: String(range.from.getTime()) });
  }}
/>
```

**Reset button** is just a bulk update:

```tsx
updateFilters({
  name: null,
  driver_id: null,
  status: null,
  payer_id: null,
  scheduled_at: null,
  billing_type_id: null
});
```

This pattern is what you should copy when adding filter bars for other pages.

---

### 5. Column visibility dropdown ("Spalten")

The filter bar embeds a column visibility control that lets users show/hide table columns inline, styled identically to the other filter dropdowns.

#### Architecture: why a Zustand store?

`TripsFiltersBar` and `TripsTable` are **siblings** rendered from the server component `TripsListingPage` — there is no shared parent client component to lift state into. The column visibility control requires a TanStack `table` instance, which is created inside `TripsTable`. A small Zustand store bridges the gap:

```
TripsListingPage (server)
  → <TripsFiltersBar>  ← reads table from store
  → <TripsTable>       ← writes table to store on mount
```

**Store file:** `src/features/trips/stores/use-trips-table-store.ts`

```ts
interface TripsTableStore {
  table: Table<any> | null;
  columnVisibility: VisibilityState;
  setTable: (table: Table<any> | null) => void;
  setColumnVisibility: (visibility: VisibilityState) => void;
}
```

#### `TripsTable` side

After `useDataTable`, two effects keep the store in sync:

```tsx
// Publish the table instance
const setTable = useTripsTableStore((s) => s.setTable);
React.useEffect(() => {
  setTable(table as any);
  return () => setTable(null); // clean up on unmount
}, [table, setTable]);

// Publish column visibility changes so TripsFiltersBar re-renders reactively
const setColumnVisibility = useTripsTableStore((s) => s.setColumnVisibility);
const columnVisibility = table.getState().columnVisibility;
React.useEffect(() => {
  setColumnVisibility(columnVisibility);
}, [columnVisibility, setColumnVisibility]);
```

The standalone `DataTableViewOptions` dropdown that is normally rendered inside `DataTableToolbar` is suppressed on the trips table by passing `showViewOptions={false}`:

```tsx
<DataTableToolbar table={table} showViewOptions={false} />
```

#### `TripsFiltersBar` side

The bar subscribes to both `table` and `columnVisibility` from the store:

```tsx
const table = useTripsTableStore((s) => s.table);
const columnVisibility = useTripsTableStore((s) => s.columnVisibility);

const hidableColumns = useMemo(() => {
  if (!table) return [];
  return table
    .getAllColumns()
    .filter((col) => typeof col.accessorFn !== 'undefined' && col.getCanHide());
}, [table, columnVisibility]); // columnVisibility as dep triggers re-render on toggle
```

The dropdown is conditionally rendered only in list view:

```tsx
{currentView === 'list' && table && (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant='outline' size='sm' className='h-8 flex-shrink-0 ...'>
        <Settings2 /> Spalten <CaretSortIcon />
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <Command>
        {hidableColumns.map((column) => (
          <CommandItem onSelect={() => column.toggleVisibility(!column.getIsVisible())}>
            {column.columnDef.meta?.label ?? column.id}
            <CheckIcon className={column.getIsVisible() ? 'opacity-100' : 'opacity-0'} />
          </CommandItem>
        ))}
      </Command>
    </PopoverContent>
  </Popover>
)}
```

#### Column labels (`meta.label`)

The dropdown uses `column.columnDef.meta?.label` for display names. All hidable columns in `columns.tsx` must define this to show human-readable German names instead of raw accessor IDs:

| Column `id` / `accessorKey` | `meta.label` |
|---|---|
| `scheduled_at` | `Datum` |
| `time` | `Zeit` |
| `name` (client_name) | `Fahrgast` |
| `pickup_address` | `Abholung` |
| `dropoff_address` | `Ziel` |
| `driver_id` | `Fahrer` |
| `status` | `Status` |
| `payer_name` | `Kostenträger` |
| `billing_type` | `Abrechnung` |

When adding a new column, always include `meta: { label: 'German label' }`.

---

### 6. Server-side filter application

File: `src/features/trips/components/trips-listing.tsx`

Filters are read via `searchParamsCache` (nuqs/server):

```ts
const status = searchParamsCache.get('status');
const driverId = searchParamsCache.get('driver_id');
const payerId = searchParamsCache.get('payer_id');
const billingTypeId = searchParamsCache.get('billing_type_id');
const name = searchParamsCache.get('name');
const scheduledAt = searchParamsCache.get('scheduled_at');
```

Then applied to Supabase:

- `status`: equals or `in(...)` if comma-separated.
- `driver_id`: special handling for `'all'` and `'unassigned'`.
- `payer_id`: `eq('payer_id', payerId)`.
- `billing_type_id`: `eq('billing_type_id', billingTypeId)`.
- `name`: `ilike('client_name', %name%)`.
- `scheduled_at`: range or single-day filter. Includes trips with `scheduled_at` in the selected range **or** `scheduled_at IS NULL` (unscheduled), so the Kanban shows both scheduled and unscheduled trips for the chosen date(s).

The `view` param controls query limits:

- `view=kanban` → `query.limit(2000)` (all trips, no pagination).
- `view=list` (default) → standard `range(from, to)` pagination.

When you add a new filter:

1. Add the param to `src/lib/searchparams.ts` (server-side schema).
2. Read it with `searchParamsCache.get` in the server component.
3. Apply it in the Supabase query.
4. Add the corresponding UI + `updateFilters` usage in the filter bar.

---

### 7. Pagination and views

- Pagination (`page`, `perPage`) is URL-driven and handled by the shared `useDataTable` hook.
- The filter bar always sets `page=1` when filters change.
- The available views are **List** and **Kanban**, toggled via `TripsViewToggle` (`src/features/trips/components/trips-view-toggle.tsx`). The view is stored as `?view=list|kanban` in the URL.
- Because both views are downstream of the same `TripsListingPage` query, they **all respect the same filters** without extra work.

---

### 8. How to recreate this pattern on another page

When adding a similar filter bar for a new resource (e.g. "Clients", "Drivers", "Invoices"), follow this checklist:

1. **Define search params schema**
   - In `src/lib/searchparams.ts`, add new keys for that page.

2. **Update the page route**
   - In `src/app/dashboard/<resource>/page.tsx`:
     - Accept `searchParams: Promise<SearchParams>`.
     - Call `searchParamsCache.parse(searchParams)`.

3. **Server component for listing**
   - Create a `<Resource>ListingPage` server component:
     - Read filters via `searchParamsCache.get`.
     - Apply them to your Supabase query.
     - Pass filtered data + total count to the different views.

4. **Client filter bar**
   - Create `src/features/<resource>/components/<resource>-filters-bar.tsx`.
   - Use the **same structure** as `TripsFiltersBar`:
     - `useRouter`, `usePathname`, `useSearchParams`.
     - An `updateFilters` helper (resets `page` to `1`, calls `router.replace`).
     - UI controls that call `updateFilters` with the right key/value.

5. **Wire it into the page**
   - In your listing layout, render the filter bar above the views:

   ```tsx
   <ResourceFiltersBar totalItems={totalItems} />
   {/* views depending on `view` and filtered data */}
   ```

6. **Column visibility (if the page has a DataTable)**
   - Create a `use-<resource>-table-store.ts` Zustand store with `table` and `columnVisibility`.
   - In your table component, sync both to the store via `useEffect`.
   - In your filter bar, subscribe to the store and render the `Spalten` popover when `view === 'list'`.
   - Pass `showViewOptions={false}` to `DataTableToolbar` to remove the standalone dropdown.
   - Ensure all columns in `columns.tsx` have `meta: { label: 'German name' }`.

7. **Avoid duplicating filter UIs**
   - Don't add filter dropdowns in table toolbars for the same fields already in the filter bar.

---

### 9. Dispatch-industry best practices reflected here

This design encodes patterns commonly seen in high-end dispatch / TMS / fleet products:

- **Global filters first**: A single filter bar that controls date, status, driver, payer, billing profile, and column visibility across all views.
- **Server-centric truth**: All views show the **same subset** of trips; Kanban and table are never out of sync.
- **URL-driven workflows**: Dispatchers can bookmark "Today, pending, unassigned, payer=X" and return to it or share with colleagues.
- **Predictable pagination**: Filtering always starts at page 1 of the new result set.
- **Column control in context**: The column visibility dropdown only appears in list view where columns are relevant, avoiding UI noise in Kanban.

Use this pattern as the template whenever you add new filtered views.
