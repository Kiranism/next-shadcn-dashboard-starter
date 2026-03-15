## Trips Filters Bar – Architecture & Reuse Guide

This document explains how the `TripsFiltersBar` works, why it’s designed this way, and how to recreate the same pattern for other pages (e.g. clients, invoices, vehicles) while staying aligned with best practices for high-end dispatch dashboards.

---

### 1. High-level goals

- **Single source of truth** for filters:
  - Filters are applied **on the server** via `searchParamsCache` + Supabase query.
  - All views (list, calendar, kanban) share the same filtered dataset.
- **URL as state**:
  - Filters live in the query string (e.g. `?status=pending&driver_id=...`).
  - Links are shareable and restorable; browser back/forward works.
- **Navigation-driven updates**:
  - Filter changes trigger **Next.js navigations** (`router.replace`) instead of ad‑hoc history changes.
  - This guarantees that `searchParams` in the server component always match what’s in the URL.
- **Dispatch-friendly UX**:
  - No hard refresh needed; everything updates automatically.
  - Pagination resets to page 1 on filter changes to avoid “empty page” confusion.

---

### 2. Data flow overview

Relevant pieces:

- `src/app/dashboard/trips/page.tsx`
- `src/lib/searchparams.ts`
- `src/features/trips/components/trips-listing.tsx`
- `src/features/trips/components/trips-filters-bar.tsx`
- `src/features/trips/components/trips-kanban-board.tsx`
- `src/features/trips/components/trips-tables/index.tsx`

**Request/response flow:**

1. **Route**: `GET /dashboard/trips?...query params...`
2. **Page component** (`dashboard/trips/page.tsx`):
   - Receives `searchParams` (via `nuqs/server`).
   - Calls `searchParamsCache.parse(searchParams)`.
   - Renders `TripsListingPage` inside `<Suspense>`.
3. **Server component** (`TripsListingPage`):
   - Uses `searchParamsCache.get('status' | 'driver_id' | 'payer_id' | ...)` to read filters.
   - Builds a Supabase query and applies filters on the server.
   - Passes filtered `trips` and `totalTrips` to:
     - List view (`TripsTable`),
     - Calendar view (`TripsCalendar`),
     - Kanban view (`TripsKanbanBoard`).
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

Filter values are read from the URL:

```tsx
const router = useRouter();
const pathname = usePathname();
const searchParams = useSearchParams();

const name = searchParams.get('name') ?? '';
const driverId = searchParams.get('driver_id') ?? 'all';
const status = searchParams.get('status') ?? 'all';
const payerId = searchParams.get('payer_id') ?? 'all';
const billingTypeId = searchParams.get('billing_type_id') ?? 'all';
const scheduledAt = searchParams.get('scheduled_at') ?? '';
```

UI is a set of inputs bound to these values:

- Text input for passenger/address (`name`).
- Date picker (`scheduled_at`).
- Driver select (`driver_id`).
- Status select (`status`).
- Payer select (`payer_id`).
- Billing type select (`billing_type_id`) dependent on payer.

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
  router.replace(next, { scroll: false });
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
  selected={selectedDate}
  onSelect={(date) => {
    if (!date) {
      updateFilters({ scheduled_at: null });
      return;
    }
    updateFilters({ scheduled_at: String(date.getTime()) });
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

### 5. Server-side filter application

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
- `scheduled_at`: range or single-day filter based on timestamps.

When you add a new filter:

1. Add the param to `src/lib/searchparams.ts` (server-side schema).
2. Read it with `searchParamsCache.get` in the server component.
3. Apply it in the Supabase query.
4. Add the corresponding UI + `updateFilters` usage in the filter bar.

---

### 6. Pagination and views

- Pagination (`page`, `perPage`) is also URL-driven and handled by the shared `useDataTable` hook.
- The filter bar always sets `page=1` when filters change, so:
  - You don’t end up on page 5 with zero results after narrowing filters.
  - This mirrors how professional dispatch tools behave.
- Because all views (list, calendar, kanban) are downstream of the same `TripsListingPage` query, they **all respect the same filters** without extra work.

---

### 7. How to recreate this pattern on another page

When adding a similar filter bar for a new resource (e.g. “Clients”, “Drivers”, “Invoices”), follow this checklist:

1. **Define search params schema**
   - In `src/lib/searchparams.ts`, add new keys under a section for that page if needed (or reuse generic ones like `page`, `perPage`, `name`, `status`).

2. **Update the page route**
   - In `src/app/dashboard/<resource>/page.tsx`:
     - Accept `searchParams: Promise<SearchParams>`.
     - Call `searchParamsCache.parse(searchParams)`.
     - If you need fully dynamic behavior (like trips), consider `export const dynamic = 'force-dynamic';`.

3. **Server component for listing**
   - Create a `<Resource>ListingPage` server component:
     - Read filters via `searchParamsCache.get`.
     - Apply them to your data query (Supabase or other).
     - Pass filtered data + total count to the different views (table, kanban, chart, etc.).

4. **Client filter bar**
   - Create `src/features/<resource>/components/<resource>-filters-bar.tsx`.
   - Use the **same structure** as `TripsFiltersBar`:
     - `useRouter`, `usePathname`, `useSearchParams`.
     - An `updateFilters` helper that:
       - Starts from current `searchParams`.
       - Applies updates.
       - Resets `page` to `1`.
       - Calls `router.replace(nextUrl, { scroll: false })`.
     - UI controls that just call `updateFilters` with the right key/value.

5. **Wire it into the page**
   - In your listing layout, render the new filter bar above the views:

   ```tsx
   <ResourceFiltersBar totalItems={totalItems} />
   <ResourceViewToggle currentView={view} />
   {/* views depending on `view` and filtered data */}
   ```

6. **Avoid duplicating filter UIs**
   - Don’t add additional filter dropdowns in table toolbars for the same fields.
   - If you use column filters, keep them for **secondary filters** only, or ensure they sync with the same URL contract.

---

### 8. Dispatch-industry best practices reflected here

This design encodes patterns commonly seen in high-end dispatch / TMS / fleet products:

- **Global filters first**: A single filter bar that controls date, status, driver, payer, billing profile, etc., across all views.
- **Server-centric truth**: All views show the **same subset** of trips; you never have a Kanban and table out of sync.
- **URL-driven workflows**: Dispatchers can bookmark “Today, pending, unassigned, payer=X” and return to it or share with colleagues.
- **Predictable pagination**: Filtering always starts the dispatcher at page 1 of the new result set.

Use this pattern as the template whenever you add new filtered views. It balances strong UX, debuggability (filters are always visible in the URL), and maintainability (one source of truth for how filters are applied).

