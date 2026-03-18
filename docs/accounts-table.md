# Accounts Table (formerly `users`)

This document describes the `public.accounts` table and the migration from `public.users`.

---

## Overview

The `public.accounts` table stores app-level user profiles: role, company assignment, and display data. It is linked to Supabase Auth via `id` (UUID matches `auth.users.id`).

**Why renamed?** The table was previously named `public.users`, which caused confusion with Supabase's built-in `auth.users` table. Renaming to `accounts` clarifies:

- `auth.users` — Supabase authentication (email, password, sessions)
- `public.accounts` — App profiles (role, company_id, name, phone, etc.)

This separation also better supports multi-tenant architecture.

---

## Schema

| Column       | Type         | Purpose                                       |
|--------------|--------------|-----------------------------------------------|
| `id`         | `uuid`       | PK, matches `auth.users.id`                   |
| `company_id` | `uuid`       | FK → `companies.id` (tenant)                  |
| `name`       | `text`       | Display name                                  |
| `first_name` | `text`       | First name (or first part of display name)    |
| `last_name`  | `text`       | Last name                                     |
| `email`      | `text`       | Cached from auth, for admin display           |
| `phone`      | `text`       | Contact                                       |
| `role`       | `text`       | `driver` \| `admin`                           |
| `is_active`  | `boolean`    | Soft deactivation                             |
| `created_at` | `timestamptz`| Creation timestamp                            |

---

## Related Tables

| Table             | Relation                          |
|-------------------|-----------------------------------|
| `driver_profiles` | 1:1 with accounts (`user_id` → `id`) |
| `trips`           | `driver_id` → `accounts.id`       |
| `shifts`          | `driver_id` → `accounts.id`       |
| `live_locations`  | `driver_id` → `accounts.id`       |
| `rides`           | `driver_id` → `accounts.id`       |
| `trip_assignments`| `driver_id` → `accounts.id`      |

---

## Usage in Code

### Supabase Queries

Always use the `accounts` table name:

```typescript
const { data } = await supabase.from('accounts').select('*').eq('role', 'driver');
```

### Trip–Driver Joins

When embedding driver data in trip queries:

```typescript
.select('*, driver:accounts!trips_driver_id_fkey(name)')
```

### TypeScript Types

```typescript
type User = Database['public']['Tables']['accounts']['Row'];
type InsertUser = Database['public']['Tables']['accounts']['Insert'];
type UpdateUser = Database['public']['Tables']['accounts']['Update'];
```

---

## Migration Reference

- **Migration:** `supabase/migrations/20260318130000_rename_users_to_accounts.sql`
- **Applied:** Renames `users` → `accounts`, updates RLS policies, helper functions (`current_user_company_id`, `current_user_is_admin`), and `update_driver()` RPC.

---

## Files Updated (Post-Migration)

| Area          | Files |
|---------------|-------|
| Trips         | `trips.service.ts`, `trips-listing.tsx`, `client-trips-panel.tsx`, `print-trips-button.tsx`, `create-trip-form.tsx`, `use-trip-form-data.ts`, `pending-driver-assignments-panel.tsx`, `bulk-upload-dialog.tsx`, `resolve-clients-step.tsx` |
| Overview      | `trip-detail-sheet.tsx` |
| Drivers       | `drivers.service.ts`, `driver-table-listing.tsx`, `shift-tracker.tsx`, `types.ts` |
| Dashboard     | `pending-tours-widget.tsx` |
| Clients       | `client-form.tsx` |
| Payers        | `use-payers.ts` |
| Auth          | `sign-in-view.tsx` |
| API           | `drivers/create/route.ts`, `drivers/[id]/route.ts` |
| Driver app    | `driver/layout.tsx` |
