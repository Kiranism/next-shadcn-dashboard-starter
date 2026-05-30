## Context

The individual dashboard page (`/dashboard/individual`) currently contains the ponto-eletronico (clock-in/out) section. We're adding an "Atividades" section below it, consuming the existing WattAPI `/activities` endpoints. The API already handles ownership, visibility rules, and CRUD — the frontend just needs to call it correctly.

## Goals / Non-Goals

**Goals:**
- Render an activity creation form card on the individual page
- Render a calendar card that shows activities for the selected day
- Support editing and deleting activities from the calendar view
- Follow existing data fetching patterns: server prefetch + `useSuspenseQuery` + `HydrationBoundary`

**Non-Goals:**
- Admin views or cross-user activity management (handled by the API's visibility layer, not this page)
- Infinite scroll or pagination (activities per day are bounded)
- Recurring activities or drag-and-drop rescheduling

## Decisions

### API layer structure

Follow the project's `api/types.ts` → `api/service.ts` → `api/queries.ts` pattern under `features/activities/api/`. Key factories: `activityKeys.all`, `activityKeys.list(date?)`, `activityKeys.detail(id)`.

**Alternative considered**: co-locating API code in the page file. Rejected — violates the project convention and makes the code harder to reuse.

### Calendar date state

Use `nuqs` (`useQueryStates`) to store the selected date in the URL so it survives refresh and is shareable. The server component reads this param to prefetch the correct day's activities.

**Alternative**: local `useState`. Rejected — loses selected date on navigation and can't be prefetched server-side.

### Form

Use `useAppForm` + `useFormFields<T>()` from `@/components/ui/tanstack-form` with a Zod schema that validates: `name` (min 1), `date` (YYYY-MM-DD), `time_start` / `time_end` (HH:MM, end > start), `priority` (enum), `description` (optional).

On success, invalidate `activityKeys.list(selectedDate)` so the calendar card refreshes immediately.

### Edit/delete UX

Each activity item in the calendar view has an inline dropdown menu (three-dot icon) with "Editar" (opens a sheet form) and "Excluir" (confirms then deletes). This avoids a separate detail page for simple edits.

## Risks / Trade-offs

- **Time validation across midnight** — `time_end > time_start` comparison is string-based (HH:MM). Activities that span midnight are not supported by the API (`time_end` must be after `time_start` on the same day), so this is intentional.
- **Stale calendar after create** — mitigated by invalidating the query on mutation success, but a brief flicker is possible on slow connections.
- **Calendar package** — uses shadcn's `Calendar` component (based on `react-day-picker`). Days with activities can be decorated with a dot indicator by querying a month-level summary; deferred to avoid over-engineering.
