# Trip Linking & Cancellation Behavior

This document explains the two ways trips can be paired (Hin- and Rückfahrt), how they are detected at runtime, and what happens when an admin cancels one of them.

---

## Two Kinds of Paired Trips

### 1. Series Trips (Recurring)

**How they are created:**
A `recurring_rules` row holds an `rrule_string` (RFC 5545 RRULE format) plus optional `return_trip: true` and `return_time`. The cron job at `/api/cron/generate-recurring-trips` expands each occurrence and inserts both legs as separate `trips` rows.

**How they are linked:**
Both legs share the same `rule_id` foreign key pointing to the parent `recurring_rules` row. They do **not** have `linked_trip_id` set — the pairing is inferred by matching `rule_id` + same calendar day.

**Key fields:**
| Field | Value |
|---|---|
| `rule_id` | UUID of the parent `recurring_rules` row (non-null) |
| `linked_trip_id` | `null` (for cron-generated pairs) |
| `link_type` | `null` |

---

### 2. Manually-Linked Trips (Non-Recurring)

**How they are created:**
When a dispatcher creates a trip via the create-trip form and either:
- selects a billing type whose `behavior_profile.returnPolicy` is `time_tbd` or `exact`, **or**
- manually enables the return toggle

…the form submits two separate trips. The return leg (Rückfahrt) gets `linked_trip_id` set to the outbound leg's `id`, and `link_type` set to `'return'`.

The same pattern applies to trips created via bulk upload.

**How they are linked:**
The return leg holds a direct self-referential FK on the `trips` table (`linked_trip_id → trips.id`). The outbound leg does **not** carry `linked_trip_id`; the relationship is one-directional in the DB, but the code also checks the inverse direction.

**Key fields:**
| Field | Outbound (Hinfahrt) | Return (Rückfahrt) |
|---|---|---|
| `rule_id` | `null` | `null` |
| `linked_trip_id` | `null` | UUID of outbound trip |
| `link_type` | `null` | `'return'` |

---

## How the Code Detects a Paired Leg

`findPairedTrip(trip)` in `src/features/trips/api/recurring-exceptions.actions.ts` resolves the partner in three stages:

1. **Explicit FK** — if `trip.linked_trip_id` is set, look up that row directly.
2. **Inverse FK** — query for any trip whose `linked_trip_id == trip.id`.
3. **Same-rule same-day fallback** — if neither FK exists but `rule_id` is set, find another trip sharing the same `rule_id` and the same calendar day.

`hasPairedLeg(trip)` is the boolean wrapper used by UI components.

---

## Cancel Dialog Behavior

The dialog (`RecurringTripCancelDialog`) now distinguishes three scenarios:

### Scenario A — Isolated non-recurring trip (no pair, no series)
- `rule_id`: null
- `linked_trip_id`: null / no inverse link

**Dialog shows:** Single red "Fahrt stornieren" button.
**Action:** `cancelNonRecurringTrip` — sets `status = 'cancelled'` on the one trip.

---

### Scenario B — Non-recurring trip with a linked return leg
- `rule_id`: null
- `linked_trip_id` set (or inverse link found)

**Dialog shows:** Blue info banner + two amber buttons:
1. "Nur diese Fahrt stornieren" → cancels only the selected leg
2. "Diese Fahrt & Rückfahrt stornieren" → cancels both legs

**Action for option 2:** `cancelNonRecurringTripAndPaired` — calls `cancelNonRecurringTrip` on the selected trip, then finds and cancels the partner via `findPairedTrip`.

---

### Scenario C — Recurring series trip
- `rule_id`: non-null

**Dialog shows:** Amber info banner + up to three buttons:
1. "Nur diese Fahrt stornieren (Aussetzen)" → creates a `recurring_rule_exceptions` row and sets `status = 'cancelled'` for this occurrence only
2. "Diese Fahrt & Rückfahrt stornieren" (only if a paired leg exists) → same as above for both legs
3. "Gesamte Serie beenden" → deactivates the `recurring_rules` row and bulk-cancels all future pending trips

---

## Cancel Modes Reference

Defined in `src/features/trips/api/recurring-exceptions.actions.ts` as `TripCancelMode`:

| Mode | Applicable to | What it does |
|---|---|---|
| `single-nonrecurring` | Any trip (default fallback) | Sets `status = 'cancelled'` on one trip |
| `cancel-nonrecurring-and-paired` | Non-recurring paired trip | Cancels both legs via `linked_trip_id` / inverse lookup |
| `skip-occurrence` | Recurring series trip | Inserts exception row + cancels this occurrence |
| `skip-occurrence-and-paired` | Recurring series trip with return leg | Same as above for both legs |
| `cancel-series` | Recurring series trip | Deactivates rule, bulk-cancels all future pending trips |

---

## Entry Points

The cancel dialog is triggered from two places:

- **`src/features/trips/components/trips-tables/cell-action.tsx`** — the "Löschen" option in the table row dropdown menu
- **`src/features/trips/components/client-trips-panel.tsx`** — the cancel button in the client-detail sidebar trip list

Both components call `hasPairedLeg(trip)` asynchronously when the dialog opens to determine whether to offer the "cancel paired" option.
