# Trips list & Kanban — date filter (`scheduled_at`)

This document explains how the **Fahrten** page decides which trips to load when a date (or range) is selected, and **why** the query was changed.

**Implementation:** `src/features/trips/components/trips-listing.tsx`  
**Related:** [Kanban view](./kanban-view.md) (uses the same query when `view=kanban`)

---

## What went wrong (the “stuck cards” problem)

### Symptom

In **Kanban** (and Liste), changing the calendar day often **did not** change the set of cards: many trips seemed to **persist** no matter which day was selected. That looked like a React refresh bug or localStorage issue.

### Actual root cause (server query)

The Supabase filter for a selected day used logic equivalent to:

```text
(scheduled_at falls on the selected day)  OR  (scheduled_at IS NULL)
```

Any trip with **no** `scheduled_at` (`NULL`) matched the **second** branch. That is **independent of the selected date**, so **every** unscheduled trip in the database was returned **for every** day the user picked.

So the UI was doing what the query asked: those cards were **supposed** to appear on every date. It felt “stuck” because it violated the mental model: *“this day’s board should only show this day’s work.”*

### What we did not fix (for clarity)

- This was **not** primarily caused by Kanban **localStorage** (`pendingChanges`). Pending only **overrides** fields for trips **already** returned by the server; it cannot invent rows that the query did not return.
- **Separate** issues (addressed elsewhere): soft navigation + RSC cache (`router.refresh()`), `await searchParamsCache.parse` in the listing, and `key` on `TripsKanbanBoard` so the client remounts when filters change.

---

## Current behaviour (after the fix)

For an active `scheduled_at` URL param, the query combines:

1. **Scheduled trips** — `scheduled_at` inside the chosen window (single day, range, or open-ended bound).
2. **Unscheduled trips** — `scheduled_at IS NULL`, but **scoped** with `requested_date`:
   - **Single day:** `requested_date` equals that calendar day (`YYYY-MM-DD`), **or** (see backlog below).
   - **Range:** `requested_date` between the range’s start and end calendar dates (inclusive).
   - **Open start / open end:** unscheduled rows with `requested_date` on the appropriate side of the bound.

### Backlog: both `scheduled_at` and `requested_date` are NULL

Imports or drafts sometimes have **neither** time nor requested day. Those rows cannot be tied to a specific picker day.

We only add them when the **selected filter day** matches the **server’s current calendar day** (same `YYYY-MM-DD` logic as the rest of this filter). So they appear on “today” on the server, not on arbitrary historical dates.

> **Note:** If your deploy region uses UTC while dispatchers work in another TZ, “today” on the server may differ from local “today”. A future improvement is to pass a timezone or use `requested_date` consistently for all unscheduled trips.

---

## URL shape (`scheduled_at` query param)

| Shape | Meaning |
|--------|--------|
| Single timestamp | One calendar day (midnight-based bounds from that instant). |
| `from,to` | Range; filters use ISO bounds for `scheduled_at` and `YYYY-MM-DD` bounds for `requested_date`. |

---

## Fields involved

| Column | Role |
|--------|------|
| `scheduled_at` | Actual appointment / dispatch time; primary for “this day’s” scheduled work. |
| `requested_date` | Intended day for unscheduled trips (e.g. CSV import); used to include unscheduled rows **only** for relevant days. |

---

## Changing this logic

If product wants **all** unscheduled trips visible on every day again, you would revert to a global `scheduled_at.is.null` OR branch — at the cost of the old “stuck” behaviour. Prefer explicit UX (e.g. “Unplanned” filter) instead.
