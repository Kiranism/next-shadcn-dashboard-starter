# Driver Role & Shift System

This document describes the driver (Fahrer) subsystem: admin management, mobile shift tracking, and related architecture.

> **Note:** App user profiles are stored in `public.accounts` (renamed from `users`). See [accounts-table.md](accounts-table.md) for details.

---

## Overview

- **Admin (Fahrer page)**: Create drivers, set passwords, assign roles (driver/admin), edit details. Located under Account → Fahrer.
- **Driver app**: Mobile-first shift tracker at `/driver/shift` — Start / Pause / End shift.
- **Auth**: Role-based redirect after sign-in — drivers → `/driver/shift`, admins → `/dashboard/overview`.

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `accounts` | User profiles with `role` (`driver` \| `admin`), `company_id`, `is_active`. Renamed from `users` to avoid confusion with `auth.users`. |
| `driver_profiles` | Driver-specific data: `license_number`, `default_vehicle_id` (1:1 with accounts) |
| `shifts` | Shift records: `driver_id`, `vehicle_id`, `started_at`, `ended_at`, `status` |
| `shift_events` | Event log: `shift_id`, `event_type`, `lat`, `lng`, `metadata`, `timestamp` |
| `vehicles` | Company vehicles for shift assignment |
| `live_locations` | Real-time driver status (1:1 per driver) — can be updated on shift start/break/end |

### Standardized Values

- **shifts.status**: `active` \| `on_break` \| `ended`
- **shift_events.event_type**: `shift_start` \| `break_start` \| `break_end` \| `shift_end`

Defined in `src/features/drivers/types.ts`.

---

## Admin: Fahrer Page

- **Route**: `/dashboard/drivers`
- **Nav**: Account → Fahrer
- **Features**:
  - Table of drivers (name, role, phone, status)
  - Create: email, password, name, phone, role, license_number, default_vehicle
  - Edit: name, phone, role, driver profile fields
  - Deactivate (soft: `is_active = false`)

### API

- `POST /api/drivers/create` — Creates auth user + `accounts` row + `driver_profiles` (for role=driver). Uses `SUPABASE_SERVICE_ROLE_KEY`. Requires authenticated admin with `company_id`.

---

## Driver App

- **Route**: `/driver/shift`
- **Layout**: Mobile-first, no sidebar, safe-area aware
- **Shift states**: idle → active → on_break → active → ended

### Shift Tracker

- **Idle**: "Schicht starten" + optional vehicle selector
- **Active**: Elapsed timer, "Pause", "Schicht beenden"
- **On break**: Break timer, "Pause beenden"
- **Ended**: Total duration summary

Each action writes to `shift_events` and updates `shifts.status`. Optional GPS via `navigator.geolocation`.

---

## Route Protection

- **Proxy** (`src/proxy.ts`): Protects `/driver/*` and `/dashboard/*` — redirects unauthenticated users to `/auth/sign-in`.
- **Driver layout**: Redirects non-drivers (e.g. admins) to `/dashboard/overview`.

---

## Time Tracking Improvements (Suggestions)

1. **GPS at every event** — Already supported; ensures audit trail.
2. **Odometer input** — Add `start_odometer` / `end_odometer` when starting/ending shift.
3. **Structured break reasons** — Store in `shift_events.metadata`: `{ reason: 'Mittagspause' | 'Kurzpause' | 'Tanken' | 'Sonstige' }`.
4. **Shift history** — Show last 7 days below the tracker.
5. **live_locations update** — On shift start/break/end, update `live_locations.status` for admin visibility.

---

## File Structure

Drivers are split into two features by audience. See [feature-folder-structure.md](feature-folder-structure.md).

```
src/
├── app/
│   ├── api/drivers/create/route.ts
│   ├── dashboard/drivers/page.tsx
│   └── driver/
│       ├── layout.tsx
│       ├── page.tsx
│       └── shift/page.tsx
├── features/
│   ├── driver-management/     # Admin: /dashboard/drivers
│   │   ├── api/drivers.service.ts
│   │   ├── components/       # driver-form, drivers-column-view, drivers-table, etc.
│   │   ├── stores/use-driver-form-store.ts
│   │   └── types.ts
│   └── driver-portal/         # Driver: /driver/*
│       ├── api/shifts.service.ts
│       ├── components/       # driver-header, shift-tracker
│       └── types.ts
└── proxy.ts  # Route protection for /driver and /dashboard
```
