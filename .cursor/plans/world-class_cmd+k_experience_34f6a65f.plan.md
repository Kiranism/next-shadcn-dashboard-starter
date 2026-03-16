---
name: World-class Cmd+K experience
overview: "Transform the command palette from page-only navigation into a dispatch-centric power tool: @-search for Fahrgäste with next/previous/cancelled context, global \"Neue Fahrt\", and trip→driver assignment, using kbar dynamic actions and German labels throughout."
todos:
  - id: todo-1773644054200-9o45vt2vr
    content: "Can you please make the kbar more intuitve. I would like to ensure that if the user hits @ that he can start looking for clients. suggestions should appear after 2 letters. "
    status: pending
  - id: todo-1773644101282-xf78u4rrv
    content: "if client is choosen, the last 3 prev and next 3 trips should show up. Everything below exactly like kbar function and ui. Imagine the kbar as being a 1 huge column. "
    status: pending
  - id: todo-1773644158693-zl1rrwxpr
    content: Currently we do have src/features/clients/components/passenger-search-overlay.tsx which has a lots of the functions but not the design we want for our kbar, nor the flow. please ensure to allign
    status: pending
isProject: false
---

# World-class Command+K experience (Dispatcher-first)

## Vision

Make Cmd+K the **primary way** a dispatcher finds passengers, sees trip context, creates trips, and assigns drivers—inspired by Raycast/Alfred (scoped search, quick actions, aliases) and dispatch best practices (passenger-centric workflow, minimal clicks).

---

## Current state

- **Kbar**: [src/components/kbar/index.tsx](src/components/kbar/index.tsx) builds actions from `navItems` only; [use-theme-switching.tsx](src/components/kbar/use-theme-switching.tsx) uses `useRegisterActions` for theme.
- **Data**: Clients via [clients.service.ts](src/features/clients/api/clients.service.ts) `getClients({ search })`; client trip context in [ClientTripsPanel](src/features/trips/components/client-trips-panel.tsx) (upcoming trips from Supabase, no past/cancelled in that component). Trips have `canceled_reason_notes`, `status`, `scheduled_at`, `driver_id`.
- **Create trip**: [CreateTripDialog](src/features/trips/components/create-trip-dialog.tsx) + [CreateTripDialogButton](src/features/trips/components/create-trip-dialog-button.tsx) only on trips page; form uses [useTripFormData](src/features/trips/hooks/use-trip-form-data.ts) `searchClients` (Supabase, 2+ chars).

---

## 1. @-Search for Fahrgäste (core win)

**Trigger**: User types `@` then query (e.g. `@Müller`). Palette switches to "Fahrgast-Suche" mode.

**Flow**:

- When `searchQuery` starts with `@`, strip `@` and use the rest as the client search query (debounced ~250–300 ms).
- Call the same client search as create-trip (e.g. reuse logic from [use-trip-form-data.ts](src/features/trips/hooks/use-trip-form-data.ts) `searchClients` or a small shared API) and fetch for each client:
  - **Next scheduled trip** (one upcoming, not cancelled).
  - **Recent previous trips** (e.g. last 3–5, any status).
  - **Last cancelled** (if any) with `canceled_reason_notes`.
- Register **dynamic actions** via `useRegisterActions`:
  - One action per client (section "Fahrgäste").
  - **Subtitle**: e.g. "Nächste Fahrt: Mo 10:30 · Bahnhof → Klinik" or "Keine geplanten Fahrten" and "Zuletzt storniert: …" if applicable.
- **Custom result row** (optional but high impact): In [result-item.tsx](src/components/kbar/result-item.tsx) (or a kbar override), when the action is a "client" type, render a richer row: avatar/icon, name, next trip time, and one line for last cancellation reason so the dispatcher sees the most relevant info at a glance.

**Data**: Add a small client-facing API or hook that returns for a given `clientId`: `{ nextTrip, previousTrips[], lastCancelled?: { scheduled_at, canceled_reason_notes } }`. Reuse Supabase patterns from [ClientTripsPanel](src/features/trips/components/client-trips-panel.tsx) and extend to past + cancelled (e.g. `status.eq('cancelled')`, order by `scheduled_at` desc, limit 1).

**Best practices**:

- **Raycast-style**: One clear "scope" when `@` is typed (only Fahrgäste), with loading state and empty state ("Kein Fahrgast gefunden").
- **Dispatch**: Passenger-first; next trip and cancel reason visible without opening the client page.

---

## 2. Quick actions from @-result (Fahrgast)

For each client in the list, offer **child actions** (or a second action group):

- **"Neue Fahrt für [Name]"** → Opens create-trip dialog with this client preselected (see below).
- **"Profil öffnen"** → Navigate to `/dashboard/clients/[id]`.

So the dispatcher can go: `@Müller` → select "Maria Müller" → "Neue Fahrt für Maria Müller" without leaving the palette flow.

---

## 3. Global "Neue Fahrt" (from anywhere)

- **Static action**: e.g. "Neue Fahrt" in section "Aktionen", shortcut `n` or `t` (if not conflicting), keyword "fahrt erstellen".
- **Behavior**: Open the create-trip dialog from any page. This requires the dialog to be **globally available** and triggerable from Kbar:
  - **Option A (recommended)**: Add a small **Zustand store** (or React context) for "global modals": e.g. `useCreateTripStore({ open: boolean, preselectedClientId?: string })`. Render a single [CreateTripDialog](src/features/trips/components/create-trip-dialog.tsx) in dashboard layout (or root layout), and Kbar action calls `openCreateTripDialog()` / `openCreateTripDialog({ clientId })`.
  - **Option B**: Kbar action navigates to `/dashboard/trips?create=1` and the trips page opens the dialog on mount when `create=1` is present; optional `?clientId=...` for prefill. Simpler but less "instant" and requires a full route change.
- When opened from **"Neue Fahrt für [Name]"** (from @-search), pass `preselectedClientId` so the form opens with that client selected and, if desired, the right-hand panel (client trips) already visible.

---

## 4. Assign trip to driver (from Cmd+K)

- **Trigger**: e.g. type `#` for "Fahrt suchen" or a dedicated phrase ("Fahrt zuweisen", "Trip"). Alternatively a section "Offene Fahrten" that lists unassigned trips (today/this week).
- **Flow**: User selects a trip (e.g. by time + client name in the result row). Then either:
  - **Sub-actions** under that trip: "Fahrer zuweisen → [Driver 1]", "… → [Driver 2]", etc., or
  - **Two-step in one palette**: First list shows trips; after selecting a trip, palette shows "Fahrer wählen" with driver list; selecting a driver runs assignment (call existing update-trip logic, e.g. [driver_id + getStatusWhenDriverChanges](src/features/trips/lib/trip-status.ts)).
- **Data**: Reuse existing trip list (e.g. unassigned: `status.eq('pending').is('driver_id', null)` or similar) and drivers from [useTripFormData](src/features/trips/hooks/use-trip-form-data.ts). Register as dynamic actions when query matches `#` or "Fahrt"/"zuweisen".

**Dispatch best practice**: Assigning from the palette keeps the dispatcher in flow; they don’t have to open the trip list or kanban for every assignment.

---

## 5. Navigation and sections (German)

- Keep existing **Navigation** actions from nav (Fahrten, Fahrgäste, Kostenträger, Dashboard) with German labels already in [nav-config](src/config/nav-config.ts).
- Add **Aktionen** (or "Schnellaktionen"): "Neue Fahrt", theme toggles can stay under "Theme".
- When `@` is active: section **"Fahrgäste"**; when `#` is active: **"Fahrten"** then **"Fahrer zuweisen"**.
- All new labels in German: "Neue Fahrt", "Fahrt erstellen", "Profil öffnen", "Nächste Fahrt", "Storniert (Grund)", "Fahrer zuweisen", "Offene Fahrten", etc.

---

## 6. UX polish (world-class)

- **Empty / loading**: When `@` + query and still loading, show "Suche Fahrgäste…"; when no results, "Kein Fahrgast gefunden. Tipp: Mind. 2 Zeichen eingeben."
- **Shortcuts**: "Neue Fahrt" e.g. `n` then `t` or single `t` if free; document in subtitle, e.g. "Schnell: t t".
- **Aliases**: Accept both "Fahrgäste" and "Fahrgast" / "Passagier" in keywords for @-mode; "Fahrt" / "Trip" for trip search.
- **Recent**: (Optional) When query is empty or short, show "Zuletzt gesuchte Fahrgäste" (e.g. last 3 from localStorage) so repeat lookups are one keypress.
- **Accessibility**: Ensure focus and keyboard nav stay correct when switching between static and dynamic actions; kbar’s default list behavior should be preserved.

---

## 7. Architecture (kbar)

- **Single source of query**: Use `useKBar(state => ({ query: state.searchQuery }))` to read current input. When `query.startsWith('@')`, set `mode = 'client'` and `clientQuery = query.slice(1).trim()`; when `query.startsWith('#')` (or chosen prefix), set `mode = 'trip'`; else `mode = 'default'` (navigation + actions).
- **Dynamic actions**: For `client` mode: debounced fetch clients + trip context, then `useRegisterActions(clientActions, [clientResults])`. For `trip` mode: fetch unassigned trips (and drivers for assign step), then `useRegisterActions(tripActions, [tripResults])`. Default mode: current nav + theme + "Neue Fahrt".
- **Create-trip from palette**: Implement Option A (Zustand/context + one dialog in layout) so "Neue Fahrt" and "Neue Fahrt für [Name]" both open the same dialog with optional `preselectedClientId`.

---

## 8. Suggested file changes (high level)


| Area                             | Change                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Kbar**                         | [src/components/kbar/index.tsx](src/components/kbar/index.tsx): Merge static nav + "Neue Fahrt" action; add hook that reads `query`, detects `@` / `#`, and registers dynamic client/trip actions.                                        |
| **Client search + trip context** | New hook e.g. `useKbarClientSearch(query)` and small data helper or API for "client + next trip + previous + last cancelled".                                                                                                             |
| **Result rendering**             | [src/components/kbar/result-item.tsx](src/components/kbar/result-item.tsx) or new variant: detect client/trip action and render subtitle with next trip time and cancel reason.                                                           |
| **Global create-trip**           | New store (Zustand) or context; mount [CreateTripDialog](src/features/trips/components/create-trip-dialog.tsx) once in dashboard layout; Kbar calls store to open with optional `clientId`.                                               |
| **Trip assignment**              | New hook `useKbarTripAssign()`: fetch unassigned trips + drivers, register actions; on driver select, call `tripsService.updateTrip(id, { driver_id, status })` with [getStatusWhenDriverChanges](src/features/trips/lib/trip-status.ts). |


---

## 9. Optional extras (later)

- `**/` for pages**: Typing `/` could filter only navigation (like "Go to…"), leaving the rest for @ and #.
- **Frameworks**: You’re already on kbar; it supports dynamic actions well. If you later need deeper customization (e.g. custom input or multi-step forms inside the palette), [cmdk](https://cmdk.paco.me/) (already in the project for [Command](src/components/ui/command.tsx)) could power a custom "dispatch command" UI while keeping kbar for simple commands.
- **Analytics**: Log which actions are used most (e.g. "Neue Fahrt" vs "@-search → Neue Fahrt") to refine shortcuts and copy.

---

## Summary

- **@Fahrgäste**: Debounced client search with next trip, previous trips, and cancel reason; rich result row; child actions "Neue Fahrt für [Name]" and "Profil öffnen".
- **Neue Fahrt**: Global action opening create-trip dialog (Zustand/context + single dialog in layout); optional client prefill from @-result.
- **#Fahrten / Zuweisen**: Search unassigned trips, then choose driver to assign (existing update + status logic).
- **German** for all new labels; **sections**: Aktionen, Fahrgäste, Fahrten, Navigation, Theme.
- **Polish**: Loading/empty states, shortcuts, optional "recent Fahrgäste".

This makes Cmd+K the central dispatcher tool: find passenger → see context → create trip or open profile; create trip from anywhere; assign driver without leaving the palette.