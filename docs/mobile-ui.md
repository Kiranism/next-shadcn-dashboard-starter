# Mobile UI (admin)

This document describes how narrow viewports are handled in the Taxigo admin so future changes stay consistent.

## Breakpoints

- **Tailwind `sm`**: 640px — used for showing secondary button labels (e.g. “Fahrt erstellen” next to the icon).
- **Tailwind `md`**: 768px — primary split between **compact / phone-style** layouts and **desktop** layouts.
- **`useIsNarrowScreen(768)`** ([`src/hooks/use-is-narrow-screen.ts`](../src/hooks/use-is-narrow-screen.ts)): `true` when `max-width: 767px`. Used for the trips list **card view** vs data table.

## Create trip flow

| Piece | Location | Behaviour |
| --- | --- | --- |
| Form (single source of truth) | [`src/features/trips/components/create-trip/create-trip-form.tsx`](../src/features/trips/components/create-trip/create-trip-form.tsx) | Zod schema in [`schema.ts`](../src/features/trips/components/create-trip/schema.ts); sections under [`create-trip/sections/`](../src/features/trips/components/create-trip/sections/). |
| Shell | [`create-trip-dialog.tsx`](../src/features/trips/components/create-trip/create-trip-dialog.tsx) | **&lt; 768px**: `Drawer` (full-height sheet, form stacked above optional client panel). **≥ 768px**: `Dialog` with **responsive row layout** (`flex-col` / `md:flex-row`) so the form and `ClientTripsPanel` never stay side-by-side on a narrow dialog width. |
| Full-page entry | [`/dashboard/trips/new`](../src/app/dashboard/trips/new/page.tsx) | Same `CreateTripForm`; useful for bookmarks and “full screen” entry on phones. |

Do **not** fork validation or submit logic for mobile; only change presentation (shell, layout, density).

## Passengers and addresses (create trip)

Shared UI lives under [`src/features/trips/components/trip-address-passenger/`](../src/features/trips/components/trip-address-passenger/):

- **`AddressGroupCard`** — On small screens, **Fahrgäste** and **Adresse** stack vertically with section hints; from **`md` up**, the previous **1/3 + 2/3** side-by-side layout returns. Street / PLZ rows use **single column on the phone**, **four columns from `sm` up**.
- **`AddressAutocomplete`**, **`PassengerBadge`**, **`AddPassengerPopover`**, **`PassengerAssignPopover`** — Taller controls and full-width triggers on narrow viewports where it helps touch use.
- **Backward compatibility**: [`address-autocomplete.tsx`](../src/features/trips/components/address-autocomplete.tsx) (and siblings) in `components/` re-export from this folder so existing imports keep working.

## Trips list (`/dashboard/trips`)

| Piece | Behaviour |
| --- | --- |
| Page shell | [`/dashboard/trips/page.tsx`](../src/app/dashboard/trips/page.tsx) uses [`PageContainer`](../src/components/layout/page-container.tsx) with **`scrollable={false}`** so the trips panel can manage its own vertical scroll (card list + table). Header actions still stack on small screens; icon-first actions use `aria-label` / `title` where the label is `hidden sm:inline`. |
| Listing layout | [`trips-listing.tsx`](../src/features/trips/components/trips-listing.tsx) stacks **`TripsViewToggle`** and **`TripsFiltersBar`** in a column below **`md`**, row from **`md`** up (`min-w-0` on the filters wrapper avoids horizontal clipping inside the overflow-hidden dashboard column). |
| View toggle | [`trips-view-toggle.tsx`](../src/features/trips/components/trips-view-toggle.tsx): **full-width** segmented control on small screens (`flex-1` buttons, taller touch targets), **`md:w-fit`** on desktop. |
| Filters (URL-driven) | [`trips-filters-bar.tsx`](../src/features/trips/components/trips-filters-bar.tsx): below **`md`**, search is full-width with taller controls (`min-h-10`); **date** and **Spalten** (list view only) share a row; **Fahrer / Status / Kostenträger / Abrechnung** sit in a **1-column (`sm`: 2-column) grid**; from **`md`** up, controls return to a single wrapping row (`md:contents` lifts selects into that row). **Count + “Filter zurücksetzen”** sit in a full-width row under the filters on mobile (border separator), inline with the bar on desktop. Query params (`search`, `scheduled_at`, `driver_id`, `status`, `payer_id`, `billing_type_id`, `page`, …) stay the single source of truth; `router.replace` + `router.refresh()` reload the server list. |
| Table vs cards | [`TripsTable`](../src/features/trips/components/trips-tables/index.tsx): below **768px** (`useIsNarrowScreen`) renders [`TripsMobileCardList`](../src/features/trips/components/trips-tables/trips-mobile-card-list.tsx) plus [`DataTableToolbar`](../src/components/ui/table/data-table-toolbar.tsx); desktop uses [`DataTable`](../src/components/ui/table/data-table.tsx) with `tableClassName="min-w-[720px]"` for horizontal scroll inside the panel. |

## Dashboard overview

[`src/app/dashboard/overview/layout.tsx`](../src/app/dashboard/overview/layout.tsx): on viewports **below `md`**, the two main KPIs use stacked **[`StatsRowCard`](../src/features/dashboard/components/stats-card.tsx)** rows (compact row layout); **charts are hidden below `lg`**. From **`lg`**, the usual grid returns (including placeholder stat cards). Below **`lg`**, the main content order is **stats → Offene Touren → Nächste Fahrten**; the **`lg`** grid restores the wider two-column layout with charts.

## Adding a new mobile-specific behaviour

1. Prefer **CSS** (`flex-col md:flex-row`, `hidden md:block`, `min-h-0`, `overflow-y-auto`, `100dvh` where needed).
2. If behaviour must differ by viewport, use a **small hook** (e.g. `useIsNarrowScreen`) with `matchMedia` in `useEffect`, defaulting to desktop-friendly `false` until mounted to avoid SSR mismatch.
3. Reserve **separate components** only when the UX is genuinely different (e.g. card list vs table), not for duplicate forms.
