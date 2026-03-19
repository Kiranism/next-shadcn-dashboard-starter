# Driver Portal — Architecture Guide

## Overview

A mobile-first driver interface at `/driver/*`. Drivers see only their own data; no admin features are exposed here.

---

## Route Map

| Route | Page component | Purpose |
|---|---|---|
| `/driver` | `page.tsx` | Redirects → `/driver/startseite` |
| `/driver/startseite` | `startseite/page.tsx` | Home: today's shift card + today's trips |
| `/driver/touren` | `touren/page.tsx` | Browse/search/filter all assigned trips |
| `/driver/shift` | `shift/page.tsx` | Manual time-entry form + shift history (Schichtenzettel) |

---

## Auth Guard

`src/app/driver/layout.tsx` checks Supabase for a `role = 'driver'` account. Non-drivers are redirected to `/dashboard/overview`.

---

## Feature Structure

```
src/features/driver-portal/
├── api/
│   ├── shifts.service.ts       # Shift CRUD + events
│   └── driver-trips.service.ts # Read today's trips, search/filter, startTrip()
├── types/
│   ├── index.ts (re-exports from types.ts)
│   └── trips.types.ts          # DriverTrip, TripStatus, TourenFilters
├── types.ts                    # ShiftStatus, ShiftEventType, etc.
└── components/
    ├── driver-header.tsx        # Header + Sheet burger menu
    ├── driver-shift-page-content.tsx # Schichtenzettel content
    ├── shift-time-form.tsx      # Manual time-entry form
    ├── shift-history-list.tsx   # Past shifts list
    ├── shared/
    │   └── driver-trip-card.tsx  # Reusable trip card (used on Startseite + Touren)
    ├── startseite/
    │   ├── shift-status-card.tsx   # Compact today-only shift widget
    │   ├── todays-trips-list.tsx   # Today's assigned trips
    │   └── startseite-page-content.tsx
    └── touren/
        ├── touren-search-bar.tsx  # Debounced (300 ms) search input
        ├── touren-filter-bar.tsx  # Status chips + date picker
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
    ├── loads driverId (supabase.auth.getUser)
    ├── ShiftStatusCard → shiftsService.getActiveShift(driverId)
    └── TodaysTripsList → getTodaysTrips(driverId) [trips where driver_id=me AND date=today]
```

---

## "Tour starten" Flow

1. Driver taps **Tour starten** on a trip card
2. `DriverTripCard` optimistically sets local status → `in_progress`
3. `startTrip(tripId)` writes `status = 'in_progress'` to Supabase
4. `onStatusChange` callback propagates new status to the parent list
5. If the write fails, the optimistic update is reverted and a toast error fires

> **Future:** When you're ready to let drivers update more fields (e.g. `actual_pickup_at`), add methods to `driver-trips.service.ts` and keep them driver-scoped.

---

## RLS Note

Supabase Row Level Security must allow drivers to:
- **SELECT** `trips` where `driver_id = auth.uid()`
- **UPDATE** `trips` (status field) where `driver_id = auth.uid()`
- **SELECT** `shifts` where `driver_id = auth.uid()`
- **INSERT/UPDATE** `shifts` and `shift_events` where `driver_id = auth.uid()`

If RLS policies are missing, the driver portal will receive empty data or permission errors.

---

## Mobile Design Notes

- Minimum touch target: **48 px** on all interactive elements
- Cards use rounded-xl + border + shadow-sm with a left accent bar (color = status)
- Shift status card: pulsing dot for live feedback (green = active, amber = break)
- Touren filter chips: horizontal scroll, no wrap (≥375 px wide screens)
- All pages constrained to `max-w-lg` (from layout) for comfortable reading
