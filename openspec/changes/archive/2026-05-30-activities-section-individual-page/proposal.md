## Why

Users need a way to log and view their scheduled activities directly on the individual dashboard page. Currently, the `/activities` API exists but has no frontend surface, leaving the feature inaccessible.

## What Changes

- Create a new `/dashboard/individual` page (accessible to all roles) with two cards side by side
- **Create activity card**: form with date, activity name, description, time start, time end, and priority — submits to `POST /activities`
- **Calendar card**: monthly calendar where clicking a day fetches and displays that day's activities via `GET /activities?date=YYYY-MM-DD`; each activity shows name + description only (no status badge, no deadline text)
- Wire up edit (`PATCH /activities/:id`) and delete (`DELETE /activities/:id`) actions accessible from the calendar view

## Capabilities

### New Capabilities

- `activities`: Create, list, and manage personal activities on the individual dashboard — covers the activity form, calendar view, and CRUD operations against the `/activities` API endpoints

### Modified Capabilities

<!-- none -->

## Impact

- **New files**: `src/app/dashboard/individual/page.tsx`, `features/activities/` layer and components
- **Modified files**: `nav-config.ts` to add the Individual nav item
- **API**: consumes `POST /activities`, `GET /activities`, `PATCH /activities/:id`, `DELETE /activities/:id`
- **Dependencies**: uses existing `react-query` data fetching patterns, `@/components/ui/calendar` (shadcn), `useAppForm` + `useFormFields`
