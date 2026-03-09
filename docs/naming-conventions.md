# Naming Conventions

This document defines naming rules for components, functions, variables, types, files, and Supabase-related code.

## Core Rules

1. Names must communicate intent, domain, and scope.
2. Prefer explicit names over short abbreviations.
3. Avoid ambiguous names like `data`, `item`, `info`, `temp`, `value`.
4. Match names to behavior; if behavior changes, rename the symbol.

## Case Conventions

1. Components, interfaces, types, enums: `PascalCase`
2. Variables, functions, hooks, object keys: `camelCase`
3. Constants and env vars: `UPPER_SNAKE_CASE`
4. File and folder names: `kebab-case`
5. Database columns (Supabase/Postgres): `snake_case`

## Component Naming

1. Components are noun-based and domain-aware.
2. Use clear suffixes when useful:
   - `*Page` for route-level pages
   - `*Panel` for dense operational sections
   - `*Dialog` or `*Drawer` for overlays
   - `*Table` for tabular views
3. Do not encode visual styling in names (`BlueButton`, `BigCard` are invalid).

Good examples:

- `TripDispatchPanel`
- `DriverAssignmentDialog`
- `ScheduledTripsTable`

## Function Naming

1. Functions should start with a verb and express outcome:
   - `createTrip`, `assignDriver`, `cancelTrip`
2. Boolean-returning helpers should start with `is`, `has`, or `can`:
   - `isDriverAvailable`, `hasDispatchPermission`
3. Event handlers should use `handle*`:
   - `handleAssignDriver`
4. Async actions should keep verb-first naming and optionally use `Async` only when needed for clarity.

## Variable Naming

1. Collections are plural: `trips`, `drivers`, `assignments`.
2. Single entities are singular: `trip`, `driver`.
3. Boolean variables use `is*`, `has*`, `can*`, `should*`.
4. Avoid single-letter names except short loop indices.

## Type and Schema Naming

1. Props interfaces: `{ComponentName}Props`.
2. Form schemas: `{Entity}{Action}Schema`.
3. Zod inferred types: `{Entity}{Action}Input` / `{Entity}{Action}Result`.
4. Supabase row types should include table intent:
   - `TripRow`, `DriverRow`, `AssignmentRow`.

## File Naming

1. One primary responsibility per file.
2. Feature files should describe purpose:
   - `trip-dispatch-panel.tsx`
   - `assign-driver-dialog.tsx`
   - `create-trip-schema.ts`
   - `subscribe-trip-events.ts`
3. Generic names like `utils.ts` are only allowed in narrowly scoped folders.

## Supabase Naming

1. Tables are singular or plural consistently across schema (choose once and stick to it).
2. Foreign keys are explicit:
   - `trip_id`, `driver_id`, `dispatcher_id`
3. Timestamp columns are explicit:
   - `created_at`, `updated_at`, `scheduled_for`, `assigned_at`
4. Status values use stable enums; avoid free-text statuses.

## Prohibited Patterns

1. Abbreviations without domain clarity (`drv`, `asgn`, `tripDt`).
2. Generic component names (`CardOne`, `TableNew`, `Modal2`).
3. Misleading names (`createTrip` that updates a trip).
4. Versioned names in code (`DispatcherPanelV2`) unless in migration boundaries.
