# Dispatch Inbox (Dispositionseingang)

The Dispatch Inbox is a centralized notification and assignment tool located in the header of the administrative dashboard. It alerts dispatchers about missing driver assignments or missing times for upcoming trips.

## Key Features

1. **Header Integration**: Instead of taking up screen real-estate at the bottom of the page, the inbox is tucked into a clean `Bell` icon in the navigation header. A badge organically indicates how many trips immediately need attention.
2. **Three-Tier Categorization**: The inbox splits pending trips into three distinct categories:
   - **Anstehend ohne Fahrer (Upcoming without Driver)**: Trips with a fixed time (`scheduled_at`) but no assigned driver.
   - **Offene Touren (Open Tours)**: Planned trips that lack both a time (`scheduled_at`) and a driver.
   - **Ungelöste CSV-Importe (CSV Pending)**: Trips explicitly imported via CSV that tripped the `needs_driver_assignment` flag.
3. **Heute vs Alle Toggle**: Dispatchers can toggle between solely viewing trips relevant to "Heute" (Today) versus "Alle" (All Time) trips.
4. **Resilient Date Fallbacks**: Sourcing the correct date for an "Open Tour" requires calculating a fallback hierarchy since `scheduled_at` is empty. The inbox uses a unified calculation logic identically mirrored between the backend hook and the frontend row item:
   `Own scheduled_at` → `Requested Date` → `Linked Outbound Trip scheduled_at` → `Today as fallback`.
   This ensures "Heute" catches trips properly even if they rely on linked trip data.
5. **Inline Time Edits**: For all trips, the localized time input lets dispatchers assign or modify a departure time instantly without fully entering the edit dialogue.
6. **Time-Only Saves**: If a dispatcher types a new time but does *not* select a driver, they can still save the trip. The application parses the local time with the fallback date into a valid, timezone-aware ISO string, saves the time, and gracefully reloads the inbox to place the trip into its newly appropriate column.
7. **Greeting Style Parsing**: Matches the Driver App style, parsing explicit greeting styles (Herr, Frau, Firma) neatly before the client name.

## Code Structure

The inbox resides in `src/features/trips/components/pending-assignments/`:

- `use-pending-assignments.ts`: A robust data-fetching hook. Fetches trips unconstrained by date, and uses a pure javascript `tripDate` fallback algorithm to filter for the 'Heute' tab. Also exports the `handleAssign` handler that orchestrates time/driver merging and database `UPDATE`s.
- `pending-assignments-popover.tsx`: The UI shell wrapping the popover. Evaluates overall counts to render the Bell icon and conditionally maps the three category lists.
- `pending-assignment-item.tsx`: Represents a single row. Evaluates local state variations for the time input vs native original time to allow either driver assignment, time updates, or both concurrently.
