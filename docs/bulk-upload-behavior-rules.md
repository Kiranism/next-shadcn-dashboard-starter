## Bulk Upload: Behavior Rules & Pending Widget

This document covers the business logic applied **automatically** during CSV bulk upload based on `BillingTypeBehavior` configuration, explains the `requested_date` field, and describes how unscheduled trips are surfaced in the **Offene Touren** widget.

---

### 1. The Two-Phase Scheduling Model

Inspired by industry-standard dispatch systems (Uber, Amazon Logistics, Taxameter Pro), the platform separates two distinct concepts:

| Field | Meaning |
|---|---|
| `scheduled_at` | **Confirmed** pickup date + time. Set by dispatch. Null = not yet scheduled. |
| `requested_date` | **Requested** pickup date from the CSV (date only, no time confirmed). |

This pattern is the foundation of every professional dispatch pipeline: the customer/source provides a desired date, and the dispatcher confirms the exact timeslot. Conflating the two into a single field creates ambiguity (is midnight a real trip or a placeholder?) and makes queries unreliable.

**Rule:** A trip appears in the **Offene Touren** widget when `scheduled_at IS NULL`. Once a dispatcher assigns a date + time, `scheduled_at` is set and the trip leaves the widget.

---

### 2. Optional Time in CSV

#### Previous behavior
`date` and `time` were both required. A row with a missing `time` was rejected with `invalid_datetime`.

#### New behavior
`time` is now optional. The date is always required.

| CSV values | `scheduled_at` | `requested_date` | Widget |
|---|---|---|---|
| `date = 25.03.2026`, `time = 08:30` | `2026-03-25T08:30:00` | `2026-03-25` | Does **not** appear (trip is scheduled) |
| `date = 25.03.2026`, `time = ` *(empty)* | `null` | `2026-03-25` | **Appears** — date picker pre-filled |
| `date = ` *(missing/invalid)* | — | — | Row **rejected** (`invalid_datetime`) |

**`requested_date` is always set** — even when `time` is present. It is a permanent record of what date was in the CSV, so a dispatcher can always see the intended date regardless of scheduling state.

#### Why not store midnight as a placeholder?

Midnight (`2026-03-25T00:00:00`) is ambiguous. It could mean a real 00:00 pickup. Filtering becomes error-prone. Adding a separate boolean flag (`time_unconfirmed`) creates two sources of truth. The `requested_date` column is unambiguous: `scheduled_at IS NULL` always and exactly means "not yet scheduled."

---

### 3. BillingTypeBehavior Enforcement at Import Time

When a CSV row specifies an `abrechnungsart`, the system loads the associated `behavior_profile` and applies its rules to the trip **before inserting**. The same rules that govern the manual trip-creation form are enforced automatically at import time — no dispatcher has to manually fix 50 rows.

#### 3a. Address Rules

| Rule | Trigger condition | Action |
|---|---|---|
| `lockPickup` | `lockPickup = true` AND at least one of `defaultPickupStreet` / `defaultPickup` is set | CSV pickup address is **overridden** with the configured default |
| `lockDropoff` | `lockDropoff = true` AND at least one of `defaultDropoffStreet` / `defaultDropoff` is set | CSV dropoff address is **overridden** with the configured default |
| `prefillDropoffFromPickup` | `prefillDropoffFromPickup = true` | Dropoff address is copied from the (potentially overridden) pickup |

**Why override CSV values?**

If a billing type represents a fixed transport route (e.g., always to Städtisches Klinikum München), requiring every row in the CSV to spell out that address is:
1. Repetitive — every row has the same dropoff.
2. Error-prone — a typo in one row silently creates a different destination.
3. Inconsistent — a dispatcher editing the same trip from the form gets the locked address automatically.

The billing type rule is the single source of truth. Import enforces it.

#### 3b. Return Trip Auto-Creation

| `returnPolicy` | Action |
|---|---|
| `none` | No return trip. Outbound only. |
| `time_tbd` | Return trip auto-created. `scheduled_at = NULL`. Appears in widget. |
| `exact` | Treated as `time_tbd` (exact time cannot be derived from CSV). Return trip appears in widget. |

**Konsil example:**

A Konsil billing type for payer "RZO" has:
- `returnPolicy = 'time_tbd'` (consultation duration unknown)
- `lockDropoff = true`, `defaultDropoffStreet = 'Krankenhausstr.'`, etc. (clinic is fixed)

When 10 Konsil rows are uploaded:
1. All 10 outbound trips are created with the locked clinic as dropoff.
2. 10 return trips are auto-created with addresses **swapped**: clinic is now the pickup, patient's home is the dropoff.
3. All 10 return trips have `scheduled_at = NULL` and `link_type = 'return'`.
4. The dispatcher sees all 10 return trips in the **Offene Touren** widget, each showing the outbound trip time as a context hint ("Hinfahrt: Di, 25.03 um 09:30").
5. As the dispatcher learns the return times from calls, they fill them in one by one.

**Why at import time rather than form time?**

Dispatch systems at scale (Uber's trip engine, Amazon same-day logistics) enforce pairing rules at ingest, not at rendering. Creating the return trip at import time:
- Guarantees the link always exists when the trip first becomes visible to dispatch.
- Prevents orphaned outbound trips with no return counterpart.
- Enables the widget's linked-trip time hint immediately.

---

### 4. Two-Pass Insert Strategy

Creating linked return trips requires knowing the database-assigned IDs of the outbound trips first. The import uses a three-step transaction:

```
Step 1 ── Insert outbound trips (all at once via bulkCreateTrips)
           ↓ Returns created trip IDs
Step 2 ── Build return trip payloads (using outbound IDs as linked_trip_id)
           Insert return trips (all at once via bulkCreateTrips)
           ↓ Returns return trip IDs
Step 3 ── Backfill outbound trips: update linked_trip_id = returnTripId
           (parallel individual updates)
```

The result is bidirectional linking:
- `outbound.linked_trip_id → return.id`
- `return.linked_trip_id → outbound.id` (set at return-trip creation)
- `return.link_type = 'return'`

This is the same linking model used by the manual trip creation form.

---

### 5. Offene Touren Widget Enhancements

The `PendingToursWidget` surfaces all trips with `scheduled_at IS NULL`. After these changes:

#### Date pre-fill
When a trip has `requested_date` set (CSV date-only import), the date picker in the widget row is pre-filled with that date instead of defaulting to today. The dispatcher immediately sees the intended date and only needs to enter the time.

For return trips, the date picker is pre-filled from the outbound trip's `scheduled_at` date — a reasonable starting point for scheduling the return.

#### Rückfahrt badge
Trips with `link_type = 'return'` display a "Rückfahrt" badge. At a glance, the dispatcher knows which entries are auto-generated return trips from an import vs. manually created unscheduled trips.

#### Outbound time hint
For return trips, the widget row shows the outbound trip's confirmed time as: `Hinfahrt: Di, 25.03 um 09:30`. This gives the dispatcher the temporal context needed to estimate the return time without opening a separate screen.

---

### 6. Import Summary

After a successful upload, the dialog displays:

- Total trips created (outbound + return)
- Number of return trips automatically created
- Number of address fields overridden by behavior rules

Example:
```
✓ Import abgeschlossen
• 25 Fahrten gesamt erstellt
• 10 Rückfahrten automatisch angelegt
• 20 Adressen durch Abrechnungsart-Regel überschrieben
```

---

### 7. Legacy Behavior Profile Normalisation

The `behavior_profile` JSON column was originally written with a mix of snake_case and camelCase keys depending on when the record was created. The import pipeline normalises both formats transparently:

| DB key (legacy) | DB key (current) | Fallback |
|---|---|---|
| `return_policy` | `returnPolicy` | `'none'` |
| `lock_pickup` | `lockPickup` | `false` |
| `lock_dropoff` | `lockDropoff` | `false` |
| `prefill_dropoff_from_pickup` | `prefillDropoffFromPickup` | `false` |
| `create_placeholder` *(old value)* | → normalised to `time_tbd` | |

This ensures all billing types — regardless of when they were configured — behave correctly during import.

---

### 8. Related Files

| File | Purpose |
|---|---|
| `src/features/trips/components/bulk-upload-dialog.tsx` | Main upload dialog with all helpers |
| `src/features/trips/components/bulk-upload/bulk-upload-types.ts` | ParsedCsvRow, ValidatedTripRow types |
| `src/features/payers/types/payer.types.ts` | BillingTypeBehavior interface |
| `src/features/dashboard/hooks/use-unplanned-trips.ts` | Widget data hook (includes requested_date) |
| `src/features/dashboard/components/pending-tours-widget.tsx` | Widget UI with badges and hints |
| `src/types/database.types.ts` | Supabase-generated types (includes requested_date) |
| `docs/bulk-trip-upload.md` | CSV format reference |
