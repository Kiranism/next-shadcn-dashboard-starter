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

## Trips list

| Piece | Behaviour |
| --- | --- |
| Header actions | [`PageContainer`](../src/components/layout/page-container.tsx) stacks title and actions on small screens; trips actions use icon-first buttons with `aria-label` / `title` where the label is `hidden sm:inline`. |
| Table vs cards | [`TripsTable`](../src/features/trips/components/trips-tables/index.tsx): below 768px renders [`TripsMobileCardList`](../src/features/trips/components/trips-tables/trips-mobile-card-list.tsx) plus the same toolbar; desktop keeps [`DataTable`](../src/components/ui/table/data-table.tsx) with `tableClassName="min-w-[720px]"` for predictable horizontal scroll. |

## Dashboard overview

[`src/app/dashboard/overview/layout.tsx`](../src/app/dashboard/overview/layout.tsx): placeholder stat cards are `hidden md:block` to reduce noise on phones; the main two-column block uses `order-*` so **sales / pie** appear **before** the pending-tours + chart column on small screens (`lg` restores the original order).

## Adding a new mobile-specific behaviour

1. Prefer **CSS** (`flex-col md:flex-row`, `hidden md:block`, `min-h-0`, `overflow-y-auto`, `100dvh` where needed).
2. If behaviour must differ by viewport, use a **small hook** (e.g. `useIsNarrowScreen`) with `matchMedia` in `useEffect`, defaulting to desktop-friendly `false` until mounted to avoid SSR mismatch.
3. Reserve **separate components** only when the UX is genuinely different (e.g. card list vs table), not for duplicate forms.
