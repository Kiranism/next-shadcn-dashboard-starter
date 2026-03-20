# Driver Portal — Architecture Guide

## Overview

A mobile-first driver interface at `/driver/*`. Drivers see only their own data; no admin features are exposed here. The portal is built with Next.js App Router (server layout for auth guard, client components for all interactive pages).

---

## Route Map

| Route | Page component | Purpose |
|---|---|---|
| `/driver` | `page.tsx` | Redirects → `/driver/startseite` |
| `/driver/startseite` | `startseite/page.tsx` | Home: personalised greeting + shift widget + today's trips |
| `/driver/touren` | `touren/page.tsx` | Browse, search, and filter all assigned trips |
| `/driver/shift` | `shift/page.tsx` | Manual time-entry form + shift history (Schichtenzettel) |

---

## Auth Guard

`src/app/driver/layout.tsx` (server component) checks Supabase for a `role = 'driver'` account. Non-drivers are redirected to `/dashboard/overview`.

---

## Feature Structure

```
src/features/driver-portal/
├── api/
│   ├── shifts.service.ts          # Shift CRUD + events (start, break, end)
│   └── driver-trips.service.ts    # Read trips, startTrip(), completeTrip(), cancelTrip()
├── types/
│   └── trips.types.ts             # DriverTrip, TRIP_STATUSES, TripStatusFilter, TourenFilters
├── types.ts                       # Shift, ShiftEvent, SHIFT_STATUSES, SHIFT_EVENT_TYPES, BreakReason
└── components/
    ├── driver-header.tsx           # Header + Sheet burger menu (Startseite / Touren / Schichtenzettel)
    ├── driver-shift-page-content.tsx
    ├── shift-time-form.tsx         # Manual time-entry form (Schichtenzettel)
    ├── shift-history-list.tsx      # Past shifts list
    ├── shared/
    │   └── driver-trip-card.tsx    # Reusable trip card used on both Startseite and Touren
    ├── startseite/
    │   ├── shift-status-card.tsx      # Real-time shift widget (start / pause / end)
    │   ├── todays-trips-list.tsx      # Today's trips list; gates Tour starten via shiftActive
    │   └── startseite-page-content.tsx
    └── touren/
        ├── touren-search-bar.tsx      # Debounced (300 ms) text search
        ├── touren-filter-bar.tsx      # Status chips + date picker
        └── touren-page-content.tsx
```

---

## Data Flow

```
Driver opens app
    ↓
layout.tsx (server) → checks auth + role
    ↓
/driver/startseite (client)
    ↓
StartseitePageContent
    ├── loads driverId + driverName (supabase.auth.getUser + accounts lookup)
    ├── ShiftStatusCard
    │     ├── shiftsService.getActiveShift(driverId)  ← restores shift on reload
    │     ├── fires onShiftStateChange(state) on every state transition
    │     └── state: 'loading' | 'idle' | 'active' | 'on_break' | 'ended'
    └── TodaysTripsList
          ├── receives shiftActive from StartseitePageContent (via onShiftStateChange)
          ├── getTodaysTrips(driverId)
          └── renders DriverTripCard for each trip
```

---

## Header Navigation

`DriverHeader` renders a mobile burger menu (shadcn `Sheet`) with three links:

| Label | Route |
|---|---|
| Startseite | `/driver/startseite` |
| Touren | `/driver/touren` |
| Schichtenzettel | `/driver/shift` |

The header title updates dynamically based on the current route using `getPageTitle(pathname)`. Tapping the title returns to `/driver/startseite`.

---

## Shift Lifecycle

Managed by `ShiftStatusCard` + `shiftsService`.

```
idle
  ↓  [Schicht starten]    → INSERT shifts (status='active') + INSERT shift_start event
active
  ↓  [Pause starten]      → INSERT break_start event + UPDATE shifts (status='on_break')
on_break
  ↓  [Pause beenden]      → INSERT break_end event + UPDATE shifts (status='active')
active
  ↓  [Schicht beenden]    → INSERT shift_end event + UPDATE shifts (status='ended', ended_at=NOW())
ended
```

> **DB constraint:** `shifts_status_check` allows `'active' | 'on_break' | 'ended'`.
> Run migration `20260320000000_fix_shifts_status_check.sql` if not yet applied.

Break state is also stored in `shift_events` (event_type = `break_start` / `break_end`) so break durations can be calculated for payroll.

If the driver reloads the page mid-shift, `getActiveShift()` restores the correct state from the DB.

---

## Trip Lifecycle (Driver Portal)

Managed by `DriverTripCard` + `driver-trips.service.ts`.

```
assigned / scheduled
  ↓  [Tour starten]    → UPDATE trips (status='in_progress', shift_id=activeShiftId)
in_progress
  ↓  [Tour beenden]    → UPDATE trips (status='completed')
  ↓  [Stornieren]      → UPDATE trips (status='cancelled', notes+=timestamped reason)
```

### Shift → Trip Linking (`shift_id`)

When the driver taps **Tour starten**, `startTrip(tripId, shiftId)` writes the active `shift_id` onto the `trips` row. This allows:
- Querying all trips worked within a shift: `SELECT * FROM trips WHERE shift_id = '<id>'`
- Future earning reports and shift summaries per driver

If no active shift exists or the `shift_id` column write fails for any reason, `startTrip` still succeeds (status update is the critical write; shift link is best-effort).

### Cancellation Reason

When the driver taps **Stornieren**:
1. A dialog prompts for a free-text reason (required — confirm button disabled until filled)
2. `cancelTrip(tripId, reason, existingNotes)` appends the reason with a timestamp to `notes`:
   ```
   [Storniert 20.03.2026 08:24]: Fahrgast nicht erreichbar
   ```
3. Dispatchers see this in the admin trips table under `notes`

---

## Gating "Tour starten" on an Active Shift

A driver should not be able to start a trip without a running shift (otherwise `shift_id` would be null and the trip would be unlinked).

**Implementation:**

1. `ShiftStatusCard` accepts `onShiftStateChange?: (state: TrackerState) => void`
2. A `useEffect` fires the callback whenever `state` changes
3. `StartseitePageContent` listens and sets `shiftActive = state === 'active' || state === 'on_break'`
4. `shiftActive` is passed down: `StartseitePageContent → TodaysTripsList → DriverTripCard`
5. `TourenPageContent` independently calls `shiftsService.getActiveShift()` on mount
6. In `DriverTripCard`: when `shiftActive === false`, the button is disabled and its label reads **"Schicht starten ↑"**

---

## Colors & Status Badges

All status colors follow `docs/color-system.md`:

- **Status badge:** `tripStatusBadge({ status })` from `@/lib/trip-status`
- **Left accent bar:** `tripStatusRow({ status })` with `border-l-4`
- No hardcoded color classes in components — all imported from the central utility

| Status | Color |
|---|---|
| `assigned` / `scheduled` | Blue |
| `in_progress` | Amber |
| `completed` | Green |
| `cancelled` | Red |

---

## `driver-trips.service.ts` API

| Function | Description |
|---|---|
| `getTodaysTrips(driverId)` | Trips for today (local date), ordered by scheduled_at ascending |
| `getDriverTrips(driverId, options)` | All trips with search, status filter, date filter, limit |
| `startTrip(tripId, shiftId?)` | Sets status → `in_progress`; best-effort `shift_id` write |
| `completeTrip(tripId)` | Sets status → `completed` |
| `cancelTrip(tripId, reason, existingNotes?)` | Sets status → `cancelled`; appends reason to notes |

---

## RLS Requirements

Supabase Row Level Security must allow drivers to:

| Table | Operation | Condition |
|---|---|---|
| `trips` | SELECT | `driver_id = auth.uid()` |
| `trips` | UPDATE (status, notes, shift_id) | `driver_id = auth.uid()` |
| `shifts` | SELECT, INSERT, UPDATE | `driver_id = auth.uid()` |
| `shift_events` | SELECT, INSERT | `shift_id IN (SELECT id FROM shifts WHERE driver_id = auth.uid())` |

---

## Mobile Design Notes

- Minimum touch target: **48 px** on all interactive elements
- Cards: `rounded-xl border-l-4 shadow-sm` with left accent color from `tripStatusRow`
- Shift status card: pulsing dot for live feedback (green = active, amber = break)
- Break timer and shift elapsed timer update every second via a `setInterval` tick
- Touren filter chips: horizontal scroll, no wrap (≥ 375 px screens)
- All pages constrained to `max-w-lg` (from layout) for comfortable one-hand reading
