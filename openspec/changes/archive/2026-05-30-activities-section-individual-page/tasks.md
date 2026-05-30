## 1. API Layer

- [x] 1.1 Create `src/features/activities/api/types.ts` — define `Activity`, `ActivityPriority` enum, `CreateActivityInput`, `UpdateActivityInput`, `ListActivitiesParams` types based on the WattAPI `/activities` model
- [x] 1.2 Create `src/features/activities/api/service.ts` — implement `createActivity`, `listActivities(params?)`, `updateActivity(id, data)`, `deleteActivity(id)` functions calling the WattAPI using the project's fetch utility
- [x] 1.3 Create `src/features/activities/api/queries.ts` — define `activityKeys` factory (`all`, `list(date?)`) and export `useActivities(date?)`, `useCreateActivity`, `useUpdateActivity`, `useDeleteActivity` hooks using React Query

## 2. Activity Form Card

- [x] 2.1 Create `src/features/activities/components/activity-form-card.tsx` — card with title "Atividades / Novo compromisso" containing the form built with `useAppForm` + `useFormFields<T>()`
- [x] 2.2 Implement form fields: date picker (maps to `date` YYYY-MM-DD), text input for name, textarea for description, time inputs for `time_start` / `time_end`, select for priority (`alta`, `media`, `baixa`)
- [x] 2.3 Add Zod schema validation: `name` min 1, `date` required, `time_start` / `time_end` required and `time_end > time_start`, `priority` required enum
- [x] 2.4 Wire submit to `useCreateActivity` mutation; on success invalidate `activityKeys.list(selectedDate)` and reset the form

## 3. Calendar Card

- [x] 3.1 Create `src/features/activities/components/activity-calendar-card.tsx` — card with two columns: shadcn `Calendar` on the left, activity list on the right
- [x] 3.2 Use `nuqs` (`useQueryStates`) to store the selected date as a URL param (`date`); default to today
- [x] 3.3 Fetch activities for selected date with `useActivities(date)` (`GET /activities?date=YYYY-MM-DD`) and display them with name + description only — no status badge, no deadline text
- [x] 3.4 Show an empty state message ("Nenhuma atividade para este dia") when the list is empty for the selected date
- [x] 3.5 Add a three-dot `DropdownMenu` per activity item with "Editar" and "Excluir" actions

## 4. Edit Sheet

- [x] 4.1 Create `src/features/activities/components/edit-activity-sheet.tsx` — shadcn `Sheet` containing the same form fields as the create form, pre-filled with the activity's current values
- [x] 4.2 Wire save to `useUpdateActivity` mutation; on success close the sheet and invalidate `activityKeys.list(selectedDate)`

## 5. Delete Confirmation

- [x] 5.1 Add a shadcn `AlertDialog` triggered by the "Excluir" dropdown item that asks "Tem certeza?" with confirm/cancel buttons
- [x] 5.2 Wire confirm to `useDeleteActivity` mutation; on success invalidate `activityKeys.list(selectedDate)`

## 6. Page Integration

- [x] 6.1 In `src/app/dashboard/ponto/page.tsx`, server-prefetch activities for today's date using `prefetchQuery(activityKeys.list(today), () => listActivities({ date: today }))` and wrap with `HydrationBoundary`
- [x] 6.2 Create `src/features/activities/components/activities-section.tsx` — renders `ActivityFormCard` and `ActivityCalendarCard` side by side in a responsive two-column grid
- [x] 6.3 Import and render `<ActivitiesSection />` inside `<PontoEletronicoView />` (or directly in the page below the ponto section) wrapped in `<Suspense>`
