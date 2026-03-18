# Feature Folder Structure

This document describes how to structure feature folders and when to split by audience (admin vs end-user).

---

## Overview

Features are organized under `src/features/`. Each feature owns a **domain** and optionally **audience-specific** code. When a domain has two distinct user audiences (e.g. admin CRUD vs end-user self-service), we split into separate feature folders.

---

## Naming Convention

| Pattern | Purpose | Example |
|--------|---------|---------|
| `{resource}-management` | Admin CRUD, roster management | `driver-management` |
| `{resource}-portal` | End-user self-service app | `driver-portal` |
| `{domain}` | Single-audience or shared domain | `trips`, `clients`, `payers` |

**Routes:**
- `/dashboard/{resource}` — Admin (e.g. `/dashboard/drivers`)
- `/{resource}/*` — End-user app (e.g. `/driver/shift`)

---

## Driver Example: Split by Audience

We have two driver-related flows:

| Audience | Route | Feature | Purpose |
|----------|-------|---------|---------|
| Admin | `/dashboard/drivers` | `driver-management` | CRUD drivers (Fahrer), assign to trips |
| Driver | `/driver/*` | `driver-portal` | Shift tracker, driver self-service |

### driver-management (Admin)

```
src/features/driver-management/
├── api/
│   └── drivers.service.ts    # CRUD for accounts (role=driver)
├── components/
│   ├── driver-form.tsx       # Create/edit sheet (table view)
│   ├── driver-form-body.tsx  # Shared form fields
│   ├── driver-detail-panel.tsx
│   ├── driver-list-panel.tsx
│   ├── driver-table-listing.tsx
│   ├── driver-create-button.tsx
│   ├── drivers-column-view.tsx
│   ├── drivers-view-toggle.tsx
│   └── drivers-table/
│       ├── index.tsx
│       ├── columns.tsx
│       └── cell-action.tsx
├── stores/
│   └── use-driver-form-store.ts
└── types.ts                  # User, DriverWithProfile
```

### driver-portal (Driver)

```
src/features/driver-portal/
├── api/
│   └── shifts.service.ts    # Shift start/break/end
├── components/
│   ├── driver-header.tsx    # Burger menu, logout
│   └── shift-tracker.tsx
└── types.ts                  # Shift, ShiftEvent, SHIFT_STATUSES, etc.
```

---

## When to Split vs Keep Single

### Split when:
- Two distinct audiences (admin vs end-user)
- Different layouts (sidebar vs mobile-first)
- Different data flows (CRUD vs self-service)
- Naming confusion if combined ("which drivers?")

### Keep single when:
- Only admin uses the feature
- Or only one end-user flow exists
- No ambiguity about who the user is

---

## Standard Folder Layout per Feature

Each feature typically has:

```
features/{feature-name}/
├── api/           # Services, Supabase queries, fetch logic
├── components/     # UI components (can nest: feature/components/subfolder/)
├── hooks/          # Custom hooks (optional)
├── stores/         # Zustand or other state (optional)
└── types.ts        # Feature-specific types
```

- **api/** — All data-fetching; components never call `supabase.from()` directly for this feature's data.
- **components/** — Presentational and container components. Use relative imports within the feature.
- **types.ts** — Types used across the feature. Shared types (e.g. from `database.types`) can be re-exported or extended here.

---

## Adding a New Feature

1. **Choose the folder name** using the convention above.
2. **Create the structure:**
   ```
   features/my-feature/
   ├── api/
   ├── components/
   └── types.ts
   ```
3. **Add a route** in `app/dashboard/` or `app/` as needed.
4. **Wire up imports** — Use `@/features/my-feature/...` from pages and other features.

---

## Cross-Feature Imports

- **Allowed:** `@/features/trips/components/address-autocomplete` from driver-management (shared UI).
- **Prefer:** Keep features as independent as possible. Shared logic belongs in `lib/` or shared components.
- **Avoid:** Circular imports between features.

---

## Related Docs

- [driver-system.md](driver-system.md) — Driver architecture
- [panel-layout-system.md](panel-layout-system.md) — Miller columns layout
- [SUPABASE_INTEGRATION.md](SUPABASE_INTEGRATION.md) — 3-tier data pattern
