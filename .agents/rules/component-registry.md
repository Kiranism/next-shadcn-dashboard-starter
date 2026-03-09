# Component Registry & Reuse Policy

Purpose: prevent duplicate components and keep UI maintainable.

## Before Creating Any Component

Run this checklist first:

1. Ask the user what component type/behavior they want and request their shadcn reference/snippet if available.
2. Search existing component: `rg "ComponentName|similar-keyword" src/components src/features`
3. Check `src/components/ui/` for suitable primitive.
4. Check `src/components/` for shared composition.
5. Check feature-local components before adding a new shared one.

If an existing component can be adapted with props, reuse it.

## Layering Rules

1. `src/components/ui/*`
   - Primitive building blocks
   - No feature/domain logic
2. `src/components/shared/*`
   - Reusable composed components used by 2+ features
3. `src/features/*/components/*`
   - Feature-only, domain-aware components

## Promotion Rules

Promote a feature component to shared only when all are true:

1. Used in at least 2 features
2. API is stable and not tightly coupled to one domain
3. Naming is domain-neutral

## Naming Rules

1. UI primitives: noun-based (`Button`, `Badge`, `Dialog`)
2. Shared composites: intent-based (`DataStatePanel`, `EntityHeader`)
3. Feature components: domain-based (`TripDispatchPanel`, `DriverAssignmentDrawer`)
4. All naming details for functions/files/types are governed by `docs/naming-conventions.md`

## New Component Entry Template

For each new shared component, append an item here:

- Name:
- Path:
- Layer (`ui`, `shared`, `feature`):
- Purpose:
- Reuse candidates considered:
- Why new component was necessary:

## Current Known High-Reuse Targets

Prefer extending these patterns before inventing new ones:

1. Data table shell and filter toolbar
2. Form field wrappers and validation rendering
3. Dialog/drawer shells
4. Status badges and pill labels
5. Empty/loading/error state panels
