---
name: refine-client-recurring-trip-behavior
overview: Refine the client recurring-trip behavior so that daily time agreement is modeled cleanly as a specific type of recurring rule, and prepare the design to later extend to payers (Kostenträger).
todos:
  - id: review-current-flows
    content: Re-check current UI flows for client form, recurring rules list, and Offene Touren für Morgen to ensure the conceptual mapping above matches real dispatcher usage.
    status: pending
  - id: design-rule-time-mode
    content: Design a minimal extension to the recurring_rules model to support fixed vs daily-agreement time modes on outbound and/or return legs.
    status: pending
  - id: update-recurring-rule-ui
    content: Update the recurring-rule sheet UX to configure time modes and, when appropriate, hide or require specific time fields accordingly.
    status: pending
  - id: adjust-cron-generation
    content: Adjust the generate-recurring-trips cron to respect the new time modes and avoid generating fixed-time trips for daily-agreement legs.
    status: pending
  - id: plan-dashboard-widgets
    content: Design how tomorrow and same-day dashboard widgets should query trips and rules to surface pending legs that still need a concrete time.
    status: pending
isProject: false
---

## Refined concept for "Benötigt tägliche Zeitabsprache"

- **Clarify semantics**: Treat your example as: client usually has a **known outbound leg** (to hospital/doctor at a planned time) but the **return time is unknown and decided ad hoc when the client calls**.
- **Current implementation summary**:
  - Client-level flag `requires_daily_scheduling` on `clients` drives the **"Offene Touren für Morgen"** widget via `usePendingTours` and creates a single one-off trip for tomorrow when dispatcher enters a time.
  - Recurring patterns ("Wiederkehrende Fahrten") are modeled per client via `recurring_rules` with **one rule containing both Hinfahrt and optional Rückfahrt** (`pickup_time`, `return_time`, `return_trip`, `rrule_string`, `start_date`, `end_date`).
  - A cron (`generate-recurring-trips`) turns those rules into concrete `trips` records up to 14 days ahead, including automatic return trips when `return_trip` and `return_time` are set, plus exceptions.

## Recommended UX/data model direction

- **Shift from client-level flag to rule-level behavior**:
  - Conceptually, "Benötigt tägliche Zeitabsprache" is not a property of the whole client, but of **specific recurring legs** (e.g. the return from hospital), so it fits better inside the recurring-rule configuration.
  - Keep a client-level hint if you like ("this client often needs ad-hoc times"), but the concrete scheduling logic should live on each relevant rule.
- **Introduce recurring-rule "time mode" instead of a standalone toggle**:
  - For each leg of a recurring rule (outbound and/or return), define a **time mode**:
    - **Fixed time**: `pickup_time` / `return_time` are fully specified; cron generates concrete trips automatically.
    - **Daily agreement / ad-hoc time**: the leg is expected on the specified weekdays, but **its time is not fixed in advance**.
  - Represent this in the rule model with additional fields, e.g. `outbound_time_mode` and `return_time_mode` (`'fixed' | 'daily_agreement'`), or a single `time_mode` if you decide only the return can be flexible.
- **How "daily agreement" legs behave technically**:
  - **Do not let the cron generate exact-time trips for those legs.** Instead, for each occurrence date where the rule applies:
    - Either **skip creating a trip row** and rely on a dedicated UI that offers "expected but unscheduled return for today" based on the outbound trip and the rule.
    - Or create a placeholder trip with a status like `awaiting_time` and a null/placeholder `scheduled_at` or a separate `agreed_time` field that is filled once the client calls.
  - The second option keeps all occurrences visible in the system ahead of time but might complicate queries; the first keeps the DB cleaner but shifts more logic into the daily dashboard.

## Concrete UX suggestions

- **Inside "Wiederkehrende Fahrten" (recurring-rule sheet)**:
  - Keep the current grouped card for Hinfahrt and Rückfahrt, but augment the return section with a **mode selector** instead of just a boolean and time:
    - Radio or segmented control, e.g. `Rückfahrt-Zeit`:
      - `Feste Uhrzeit` → show `return_time` input as today.
      - `Tägliche Zeitabsprache` → hide `return_time` and show a description that the dispatcher will set the time per day.
  - Optionally allow the same for the outbound leg when that also needs daily agreement (for some special cases).
- **Dashboard: separate widgets for tomorrow vs same-day returns**:
  - Keep **"Offene Touren für Morgen"** for what it already solves well: next-day pickups where the client definitely needs a ride but time is missing.
  - Add a **"Offene Rückfahrten heute"** (or similar) widget that:
    - Looks at **today's outbound trips** that come from rules whose return leg has `time_mode = 'daily_agreement'`.
    - Shows any such trip where **no return has been created yet today**, and allows the dispatcher to quickly add a return with a chosen time, prefilled addresses from the outbound leg.
- **Avoid double-generation conflicts**:
  - Once you move behavior into rules, `requires_daily_scheduling` on the client should **no longer independently create random one-off trips for tomorrow** if there are applicable recurring rules already covering that day.
  - Instead, derive tomorrow's "pending" list from:
    - Rules that say `time_mode = 'daily_agreement'` for tomorrow, but where **no concrete trip exists yet for that leg**.

## Migration and compatibility considerations

- **Short term**:
  - Keep the existing client-level `requires_daily_scheduling` behavior untouched while you prototype the rule-level mode and a basic same-day return widget.
  - Ensure the cron continues to work exactly as before for rules that remain `fixed` on both legs.
- **Medium term**:
  - Introduce the new rule fields (`time_mode` or equivalent) and use them in the cron and widgets, then **gradually phase out** reliance on `requires_daily_scheduling` for new clients.
  - Migrate existing clients who use the flag into explicit recurring rules with appropriate modes, so dispatchers can rely on a single, consistent concept.
- **Future extension to payers (Kostenträger)**:
  - Reuse the same **"time mode" abstraction** on any payer-level recurring agreements (e.g. contracts that specify that returns are always on-demand) so that the logic remains consistent across client and payer screens.
