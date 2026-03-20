# Verknüpfte Rückfahrt nachträglich (“Linked return after booking”)

This document describes the **post-hoc linked return** feature: an admin can create a **Rückfahrt** that mirrors an existing **Hinfahrt** after the original trip was created as one-way, without re-entering route, passenger, or billing data.

---

## Problem it solves

Passengers sometimes book **only the outbound** leg. Later they call and ask for the **return**. Instead of creating a completely new trip from scratch, dispatch opens the original trip in the detail sheet and creates a return that is **paired** with that leg (same semantics as Hin/Rück created together in the create form).

---

## Entry point (current scope)

- **Trip detail sheet** only: [`src/features/overview/components/trip-detail-sheet.tsx`](../src/features/overview/components/trip-detail-sheet.tsx)
- Footer action **“Rückfahrt”** (only when the rules below allow it — otherwise the button is **not rendered**).

There is intentionally **no** Kanban / Cmd+K entry in this version.

---

## User-visible behaviour

1. Open a trip that qualifies as a **Hinfahrt** (see eligibility below).
2. If allowed, click **Rückfahrt**.
3. Dialog: set **date/time** and optionally **Fahrer**; billing and route mirror the outbound (read-only conceptually — not re-edited here).
4. **Grouped trips** (`group_id` with multiple legs): choose
   - **only this passenger** (the trip currently open), or
   - **whole group** — one linked return per eligible outbound leg, **same** scheduled time and driver for all; **`group_id` is not copied** to returns (returns may diverge).
5. On success, a new `trips` row is created and **linked** to the outbound(s). Existing cancellation / pairing logic (e.g. cancel Hin+Rück) continues to use `findPairedTrip` as before.

---

## When the “Rückfahrt” button is shown

The button uses **`shouldShowCreateReturnTripButton`** in [`src/features/trips/lib/can-create-linked-return.ts`](../src/features/trips/lib/can-create-linked-return.ts). All of the following must hold:

### A. Billing type (`behavior_profile.returnPolicy`)

- The trip’s billing type is loaded via join (`billing_types.behavior_profile`).
- **Return policy** is normalised the same way as in the billing-type behaviour UI (including legacy keys like `return_policy`, `create_placeholder`).
- If the policy is **`none`**, the Abrechnungsart is treated as **one-way only** → **no** “Rückfahrt” button (aligned with the create-trip flow).
- If **`time_tbd`** or **`exact`**, post-hoc return is allowed from a UI perspective.
- If **`billing_types` or `behavior_profile` is missing** (e.g. join failed), the app **still shows** the button when other checks pass, so dispatch is not blocked.

### B. Trip leg and state (`canCreateLinkedReturn`)

- **No existing paired leg** — `findPairedTrip` is used; if a partner already exists, the button is hidden.
- **Must be outbound (Hinfahrt)** — direction from [`getTripDirection`](../src/features/trips/lib/trip-direction.ts) must not be `'rueckfahrt'` (you cannot start from a return row).
- **Not cancelled** — `status !== 'cancelled'`.

If any of these fail, the button is **hidden** (not disabled).

### C. Dialog auto-close

If the sheet trip becomes ineligible while the dialog was open (e.g. data refresh), the dialog is closed via `useEffect` when `showCreateReturnButton` becomes false.

---

## Data model and linking

Same pattern as bulk upload / create form with return:

| Leg        | `link_type` | `linked_trip_id`      |
|-----------|-------------|------------------------|
| Rückfahrt | `'return'`  | → Hinfahrt `id`        |
| Hinfahrt  | `'outbound'`| → Rückfahrt `id`       |

Implementation:

1. **Insert** the new return row with reversed pickup/dropoff and metadata (see below).
2. **Update** the outbound row with `linked_trip_id` + `link_type: 'outbound'`.

Code: [`createLinkedReturnForOutbound`](../src/features/trips/lib/create-linked-return.ts).

---

## What is copied vs overridden on the new return row

**From** the outbound leg (see [`buildReturnTripInsert`](../src/features/trips/lib/build-return-trip-insert.ts)):

- **Route:** all pickup/dropoff fields **swapped** (return starts at outbound dropoff, ends at outbound pickup).
- **Passenger / client:** `client_id`, `client_name`, `client_phone`, `is_wheelchair`.
- **Money / organisation:** `payer_id`, `billing_type_id`, `company_id` (with optional override from current user context), `payment_method`, `vehicle_id` where present.
- **Notes / greeting:** `notes`, `greeting_style`.

**Explicitly not copied:**

- **`group_id`** — not set on the return (group returns can differ per passenger).
- **`rule_id`** — the return is always a **one-off** row; it does **not** extend a recurring series, even if the outbound came from a recurring rule.

**Set in the dialog:**

- **`scheduled_at`** — chosen date/time.
- **`driver_id`** — optional; status follows [`getStatusWhenDriverChanges`](../src/features/trips/lib/trip-status.ts) like elsewhere.

**Computed:**

- **Driving distance/duration** — Google Directions on the reversed route when coordinates exist.

---

## Ad-hoc vs recurring outbound

There is **no separate branch**: every trip is one row. The return is always a **new** trip linked to **that** occurrence. Recurring **rules** are not duplicated; only the pair is linked.

---

## File map

| File | Role |
|------|------|
| [`src/features/trips/lib/can-create-linked-return.ts`](../src/features/trips/lib/can-create-linked-return.ts) | Eligibility, billing `returnPolicy`, `shouldShowCreateReturnTripButton` |
| [`src/features/trips/lib/build-return-trip-insert.ts`](../src/features/trips/lib/build-return-trip-insert.ts) | Insert payload: swap route, copy fields, clear `group_id` / `rule_id` |
| [`src/features/trips/lib/create-linked-return.ts`](../src/features/trips/lib/create-linked-return.ts) | Insert return + update outbound link |
| [`src/features/trips/components/return-trip/create-return-trip-dialog.tsx`](../src/features/trips/components/return-trip/create-return-trip-dialog.tsx) | UI: scope (single vs group), datetime, driver |
| [`src/features/trips/components/return-trip/index.ts`](../src/features/trips/components/return-trip/index.ts) | Barrel export |
| [`src/features/overview/components/trip-detail-sheet.tsx`](../src/features/overview/components/trip-detail-sheet.tsx) | “Rückfahrt” button + dialog wiring |

---

## Related code

- **Direction labels:** [`src/features/trips/lib/trip-direction.ts`](../src/features/trips/lib/trip-direction.ts)
- **Find paired trip (cancel flows):** [`findPairedTrip` in `recurring-exceptions.actions.ts`](../src/features/trips/api/recurring-exceptions.actions.ts)
- **Billing behaviour (`returnPolicy`):** [`src/features/payers/types/payer.types.ts`](../src/features/payers/types/payer.types.ts), billing-type behaviour dialog

---

## Operational notes

- **Batch “whole group”:** If one insert fails partway through, some returns may already exist; a retry could duplicate for those legs — consider a future improvement (transaction or clearer partial-success UI).
- **Realtime:** The trip detail hook refreshes on `UPDATE` on the open trip; linking the return **updates** the outbound row, so the sheet should reflect the new link.
