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

We only add them when the **selected filter day** matches **today’s calendar date in the business timezone** (see below), not the raw UTC date of the host.

### Business timezone (production-safe)

Day boundaries and “today” use a single **IANA timezone** (default `Europe/Berlin`), not the Node process timezone (often UTC on Vercel). Implementation:

- **`src/features/trips/lib/trip-business-date.ts`** — `getZonedDayBoundsIso(ymd)`, `instantToYmdInBusinessTz(ms)`, `todayYmdInBusinessTz()` using `@date-fns/tz`.
- **`scheduled_at` URL values** are canonical **`YYYY-MM-DD`** strings for single-day and week-jump filters. Legacy **numeric ms** values are still accepted: they are mapped to a calendar day **in the business TZ**, then the same bounds apply.

Optional env: `NEXT_PUBLIC_TRIPS_BUSINESS_TIMEZONE` (defaults to `Europe/Berlin`). Set on Vercel if operations use another region.

---

## URL shape (`scheduled_at` query param)

| Shape | Meaning |
|--------|--------|
| `YYYY-MM-DD` | Single calendar day in the **business timezone**; server builds UTC `[start, end)` for `scheduled_at` and uses the same string for `requested_date`. |
| Numeric ms (legacy) | Mapped to `YYYY-MM-DD` in the business TZ, then same as above. |
| `from,to` (two numbers) | Range; each ms mapped to YMD in the business TZ; scheduled window is `[start of first day, start of day after last day)` in UTC. |

---

## Fields involved

| Column | Role |
|--------|------|
| `scheduled_at` | Actual appointment / dispatch time; primary for “this day’s” scheduled work. |
| `requested_date` | Intended day for unscheduled trips (e.g. CSV import); used to include unscheduled rows **only** for relevant days. |

---

## Changing this logic

If product wants **all** unscheduled trips visible on every day again, you would revert to a global `scheduled_at.is.null` OR branch — at the cost of the old “stuck” behaviour. Prefer explicit UX (e.g. “Unplanned” filter) instead.
