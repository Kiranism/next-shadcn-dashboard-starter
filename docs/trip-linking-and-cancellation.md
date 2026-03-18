# Trip Linking, Direction & Cancellation Behavior

This document is the single source of truth for how trips are paired as
Hin/Rückfahrt (outbound/return), how direction is determined, and what happens
at every cancellation path.

---

## 1. The Two Key Fields

Every `trips` row has two fields that describe its role in a paired journey:

| Column | Type | Purpose |
|--------|------|---------|
| `link_type` | `text \| null` | **Direction signal.** `'return'` = this trip is the Rückfahrt. `null` = Hinfahrt (or standalone). |
| `linked_trip_id` | `uuid \| null` | **Pairing signal.** FK → `trips.id` of the partner leg. |

`link_type` is the **canonical and authoritative** way to tell which leg is which.
Do not derive direction from address, time, or any other heuristic when `link_type`
is set.

---

## 2. How Direction Is Determined in Code

Use the utility in `src/features/trips/lib/trip-direction.ts`:

```typescript
import { getTripDirection, getCancelledPartnerLabel } from '@/features/trips/lib/trip-direction';

const direction = getTripDirection(trip);
// → 'hinfahrt' | 'rueckfahrt' | 'standalone'
```

### Resolution order inside `getTripDirection`

1. **`link_type === 'return'`** → `'rueckfahrt'` *(primary signal, always set going forward)*
2. **`linked_trip_id` is set** → `'rueckfahrt'` *(fallback for legacy rows created before the form fix landed — in unidirectional pairs the only leg with `linked_trip_id` is the Rückfahrt)*
3. **Neither is set** → `'hinfahrt'` *(Hinfahrt or standalone; callers that need to distinguish those two should check whether a partner exists separately)*

### Why the fallback is safe

Bulk-upload creates bidirectional links (both legs get `linked_trip_id`), but
bulk-upload also always sets `link_type = 'return'` on the Rückfahrt. So rule 1
fires before rule 2 ever runs for bulk-upload rows. Rule 2 is only reached by
old form-created rows — where only the Rückfahrt has `linked_trip_id`.

---

## 3. Creation Paths — State of Each Field

### 3a. Create-Trip Form (`src/features/trips/components/create-trip-form.tsx`)

Two sub-paths exist (group mode and passenger mode) but both follow the same
pattern. **Both have been fixed to set `link_type`.**

| Leg | `link_type` | `linked_trip_id` |
|-----|-------------|-----------------|
| Hinfahrt (outbound) | `null` | `null` |
| Rückfahrt (return) | `'return'` ✅ | → outbound's `id` |

*Note: legacy rows created before this fix have `link_type = null` on the
Rückfahrt. `getTripDirection` handles them via the `linked_trip_id` fallback.*

---

### 3b. Recurring Cron (`src/app/api/cron/generate-recurring-trips/route.ts`)

The cron generates trips for a 14-day rolling window from `recurring_rules`. If
`rule.return_trip === true`, it generates both legs on the same `scheduled_at`
calendar day. **The cron has been fixed to set `link_type`.**

| Leg | `link_type` | `linked_trip_id` | `rule_id` |
|-----|-------------|-----------------|-----------|
| Hinfahrt | `null` | `null` | → rule's `id` |
| Rückfahrt | `'return'` ✅ | `null` | → rule's `id` |

*Note: cron-generated pairs have NO `linked_trip_id` between them — pairing is
inferred by shared `rule_id` + same calendar day in `findPairedTrip`. Old
cron-generated rows (before this fix) have `link_type = null` on both legs; their
direction can only be inferred by comparing `scheduled_at` times (earlier = Hinfahrt).*

---

### 3c. Bulk Upload — Auto-return trips (`src/features/trips/components/bulk-upload-dialog.tsx`)

When a billing type has `returnPolicy = 'time_tbd'` or `'exact'`, the upload
automatically generates a return trip for every outbound row. Both legs are
linked bidirectionally.

| Leg | `link_type` | `linked_trip_id` |
|-----|-------------|-----------------|
| Hinfahrt | `null` | → return's `id` (backfilled in pass 3) |
| Rückfahrt | `'return'` | → outbound's `id` |

---

### 3d. Bulk Upload — Explicit `pair_id` pairs

Dispatchers can link two explicitly-timed rows as a Hin/Rückfahrt pair by giving
them the same value in the optional `pair_id` CSV column. This is the preferred
approach when both legs already have real departure times — use it instead of
relying on the billing-type auto-return.

```csv
kostentraeger,...,date,time,...,pair_id
Rechnungsfahrt,...,10.03.26,07:30,...,CH1   ← Hinfahrt
Rechnungsfahrt,...,10.03.26,15:00,...,CH1   ← Rückfahrt
```

After import (Pass 4 of the insert flow):

| Leg | `link_type` | `linked_trip_id` |
|-----|-------------|-----------------|
| Hinfahrt (earlier time) | `null` | → Rückfahrt's `id` |
| Rückfahrt (later time) | `'return'` | → Hinfahrt's `id` |

#### Direction resolution order (within a pair)

1. Both rows have `scheduled_at` → earlier = Hinfahrt, later = Rückfahrt
2. One has time, one doesn't → timed row = Hinfahrt, timeless row = Rückfahrt
3. Both have no time (or identical times) → CSV row order (first = Hinfahrt)

#### Conflict guard

If a row carries a `pair_id` **and** the billing type has `returnPolicy = 'time_tbd'`
or `'exact'`, the automatic return-trip generation is suppressed. The dispatcher
has explicitly provided both legs — creating a third auto-generated trip would
be incorrect.

#### Validation

- `pair_id` groups with fewer than 2 matching rows are silently skipped — the
  trip is still created as a standalone (lone key, no link is made).
- `pair_id` groups with 3+ rows produce a non-blocking `pair_id_ambiguous`
  validation warning. Only the first two members (by direction resolution order)
  are linked; extra rows are created as standalone trips.

#### `pair_id` in code

The `pair_id` value is a **local CSV key only** — it is never stored on the
`trips` row. The field is read, used for linking, and then discarded. After
Pass 4 the two trips are indistinguishable from any other bidirectional pair.

---

## 4. Pairing Resolution (`findPairedTrip`)

`src/features/trips/api/recurring-exceptions.actions.ts` — `findPairedTrip(trip)`

Used by cancellation actions and the detail sheet to locate the partner leg.
Three-stage resolution:

1. `trip.linked_trip_id` is set → query that row directly *(fastest path)*
2. Inverse: query for any trip where `linked_trip_id = trip.id` *(handles bulk-upload Hinfahrt and any bidirectional pair)*
3. Fallback: same `rule_id` + same calendar day *(covers cron-generated pairs with no FK link)*

---

## 5. Cancellation Modes

Defined in `src/features/trips/api/recurring-exceptions.actions.ts` as `TripCancelMode`:

| Mode | When to use | What it does |
|------|------------|--------------|
| `single-nonrecurring` | Non-recurring, no pair | Sets `status = 'cancelled'` on one trip |
| `cancel-nonrecurring-and-paired` | Non-recurring with a linked partner | Cancels both legs via `findPairedTrip` |
| `skip-occurrence` | Recurring series trip | Inserts `recurring_rule_exceptions` row + cancels this occurrence |
| `skip-occurrence-and-paired` | Recurring with a return leg | Same as above for both legs |
| `cancel-series` | Recurring series | Deactivates rule, bulk-cancels all future pending trips |

### Cancel dialog behavior

The dialog (`RecurringTripCancelDialog`) triggers when `isRecurring || hasPair`:

- **Standalone non-recurring trip**: single red "Fahrt stornieren" button
- **Non-recurring paired trip**: blue info banner + two amber buttons ("Nur diese" / "Hin & Rück")
- **Recurring series trip**: amber info banner + up to three buttons ("Nur diese" / "Hin & Rück" / "Gesamte Serie")

The `hasPairedLeg(trip)` check runs asynchronously when the dialog opens.

### Entry points

| Component | Path |
|-----------|------|
| Trips table row | `src/features/trips/components/trips-tables/cell-action.tsx` |
| Client detail sidebar | `src/features/trips/components/client-trips-panel.tsx` |
| Trip detail sheet | `src/features/overview/components/trip-detail-sheet.tsx` |

---

## 6. "Cancelled Partner" Badge

When one leg of a pair is cancelled, the surviving leg shows a small red badge
so the dispatcher does not have to remember the context.

### Badge label logic

Call `getCancelledPartnerLabel(trip)` from `trip-direction.ts`:
- If the current trip is the Rückfahrt → `'Hinfahrt storniert'`
- If the current trip is the Hinfahrt → `'Rückfahrt storniert'`

### Where the badge appears

| Component | How it gets the partner status |
|-----------|-------------------------------|
| `trip-row.tsx` (upcoming trips list) | `linked_partner_status` enriched in-memory by `use-upcoming-trips.ts` during the same fetch |
| `UnplannedTripRow` (pending widget) | `linked_trip.status` included in the secondary fetch in `use-unplanned-trips.ts` |
| `TripDetailSheet` (detail side-sheet) | `findPairedTrip()` called in a `useEffect` when the trip loads |

---

## 7. Data Migration Note

Legacy rows in the database that predate the `link_type` fix:

| Creation path | Legacy behavior | Handled by |
|---|---|---|
| Create-trip form | `link_type = null` on Rückfahrt | `getTripDirection` fallback (rule 2: `linked_trip_id`) |
| Cron | `link_type = null` on both legs | Direction unknown from trip row alone; badge conservatively shows "Rückfahrt storniert" for trips without `linked_trip_id` (i.e., the Hinfahrt). Cancellation still works via the rule_id + same-day fallback. |
| Bulk upload — auto-return | Always had `link_type = 'return'` | No migration needed |
| Bulk upload — `pair_id` | New feature (no legacy rows) | N/A |

If you want to retroactively fix old rows, run:

```sql
-- Fix form-created return trips: if linked_trip_id is set and link_type is null,
-- it is a legacy Rückfahrt. Only safe because bulk-upload always sets link_type.
UPDATE trips
SET link_type = 'return'
WHERE linked_trip_id IS NOT NULL
  AND link_type IS NULL
  AND rule_id IS NULL;

-- Fix cron-generated return trips: if rule_id is set and link_type is null, we
-- cannot tell direction from the trip row alone. The return leg has a later
-- scheduled_at than the outbound on the same day for the same rule.
-- Run carefully and verify against recurring_rules.return_time first.
-- (No auto-migration provided — requires manual review per rule.)
```
