# Architecture Rules

This document defines non-negotiable architecture rules for the dispatcher dashboard.

## Product Context

- Backend: Supabase (Postgres, Realtime, Auth, RPC)
- Primary user today: Dispatcher
- Modes: Real-time dispatch + planned scheduling
- Frontend: Next.js App Router + TypeScript + shadcn/ui

## Core Principles

1. Server components by default. Use `'use client'` only when browser APIs, event-heavy interactions, or client-side hooks are required.
2. Keep domain logic in feature modules, not in generic UI primitives.
3. Use typed contracts at every boundary (Supabase row types + Zod validation for app-level input/output).
4. Optimize dispatcher flows for low-latency updates and low-click operations.

## Module Boundaries

Use these feature modules and avoid crossing concerns:

- `src/features/dispatch/` for assignment workflows and live queue orchestration
- `src/features/trips/` for trip lifecycle, details, and status transitions
- `src/features/scheduling/` for future planned jobs and calendar/time-slot logic
- `src/features/drivers/` for driver availability and assignment constraints

Each feature may contain:

- `components/`
- `schemas/`
- `queries/` (read operations)
- `mutations/` (write operations)
- `types/`
- `utils/`

## Data Access Rules (Supabase)

1. No raw Supabase calls inside presentational components.
2. All reads/writes go through feature `queries/` or `mutations/`.
3. Shared Supabase clients stay in `src/lib/supabase/` only.
4. Every mutation must define:
   - input schema (Zod)
   - explicit error mapping
   - optimistic/rollback strategy if used in live UI
5. Realtime subscriptions must be lifecycle-safe and cleaned up on unmount.

## Real-time + Scheduling Rules

1. Treat trip state as finite states (`pending`, `assigned`, `enroute`, `completed`, `cancelled`).
2. Real-time events may update list views immediately, but detail screens should reconcile with a fresh read on critical transitions.
3. Planned trips must include timezone-safe timestamps in UTC at storage boundaries.
4. Conflict detection (double assignment, unavailable driver) must be validated server-side before final write.

## Performance Rules

1. Large lists use server pagination + filter params.
2. Use virtualization for high-density dispatch tables where necessary.
3. Avoid N+1 calls from client components.
4. Use loading skeletons and optimistic updates only when rollback semantics are defined.

## Security Rules

1. Client-side visibility checks improve UX but never replace server-side authorization.
2. Enforce row-level security (RLS) and policy checks in Supabase.
3. Never expose service role credentials in frontend/runtime client bundles.

## Definition of Done (Architecture)

A feature is complete only if it includes:

1. typed input/output schema
2. empty/loading/error states
3. realtime behavior test (manual or automated)
4. doc update for new flows or constraints
