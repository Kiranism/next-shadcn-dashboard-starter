-- ============================================================
-- Migration: fix shifts_status_check + add column comments
--
-- 1. Fixes the shifts_status_check constraint to include 'on_break',
--    which is required by the driver portal's Pause feature.
-- 2. Adds COMMENT ON COLUMN documentation for all shifts and
--    shift_events columns so they show up in Supabase Studio,
--    Table Editor, and introspection tools.
--
-- Run once in: Supabase Dashboard → SQL Editor → Run
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. Fix shifts_status_check constraint
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.shifts
  DROP CONSTRAINT IF EXISTS shifts_status_check,
  ADD CONSTRAINT shifts_status_check
    CHECK (status IN ('active', 'on_break', 'ended'));


-- ════════════════════════════════════════════════════════════
-- 2. Column comments — TABLE: shifts
-- ════════════════════════════════════════════════════════════

COMMENT ON TABLE public.shifts IS
$$One row per driver working day. Tracks when a driver started,
paused (via shift_events), and ended their shift. Manual shifts
(created via Schichtenzettel form) are stored with status = 'ended'
immediately; real-time shifts transition active → on_break → ended.$$;

COMMENT ON COLUMN public.shifts.id IS
$$Primary key (UUID). Auto-generated on insert.$$;

COMMENT ON COLUMN public.shifts.driver_id IS
$$FK → accounts.id. The driver who worked this shift.
Must equal auth.uid() for RLS to permit insert/update.$$;

COMMENT ON COLUMN public.shifts.company_id IS
$$FK → companies.id. Inherited from the driver's account at shift start.
Used to scope admin queries.$$;

COMMENT ON COLUMN public.shifts.vehicle_id IS
$$FK → vehicles.id. Optional — the vehicle used for this shift.
NULL when no vehicle was selected at shift start.$$;

COMMENT ON COLUMN public.shifts.status IS
$$Current state of the shift. Allowed values (enforced by shifts_status_check):
  active   – shift is running (driver is on the road)
  on_break – shift is paused (driver is on a break)
  ended    – shift has been completed

State transitions:
  idle → active           (Schicht starten)
  active → on_break       (Pause starten)
  on_break → active       (Pause beenden)
  active → ended          (Schicht beenden)

Manual shifts created via Schichtenzettel are inserted directly with
status = 'ended' and never transition through active or on_break.$$;

COMMENT ON COLUMN public.shifts.started_at IS
$$Timestamp (UTC) when the shift began.
For real-time shifts: set to NOW() at shift start.
For manual shifts: parsed from the driver's entered start time (local clock).$$;

COMMENT ON COLUMN public.shifts.ended_at IS
$$Timestamp (UTC) when the shift ended.
NULL while the shift is still active or on_break.
For manual shifts: parsed from the driver's entered end time (local clock).$$;

COMMENT ON COLUMN public.shifts.start_odometer IS
$$Optional odometer reading (km) at shift start.
Collected for mileage tracking. NULL if not recorded.$$;

COMMENT ON COLUMN public.shifts.end_odometer IS
$$Optional odometer reading (km) at shift end.
Collected for mileage tracking. NULL if not recorded or shift not yet ended.$$;

COMMENT ON COLUMN public.shifts.total_distance_km IS
$$Calculated total driving distance in km for this shift.
Derived from end_odometer - start_odometer, or from summing rides.
NULL if odometer data was not collected.$$;

COMMENT ON COLUMN public.shifts.total_earnings IS
$$Total earnings (€) for this shift, summed from associated rides.
NULL until calculated.$$;

COMMENT ON COLUMN public.shifts.created_at IS
$$Timestamp (UTC) when the row was inserted. Auto-set by the DB.$$;


-- ════════════════════════════════════════════════════════════
-- 3. Column comments — TABLE: shift_events
-- ════════════════════════════════════════════════════════════

COMMENT ON TABLE public.shift_events IS
$$Append-only event log for a shift. Each row records a single
moment in time (shift_start, break_start, break_end, shift_end).
Used to reconstruct the full timeline of a shift and to calculate
paid hours (total duration minus break durations).$$;

COMMENT ON COLUMN public.shift_events.id IS
$$Primary key (UUID). Auto-generated on insert.$$;

COMMENT ON COLUMN public.shift_events.shift_id IS
$$FK → shifts.id. The shift this event belongs to.$$;

COMMENT ON COLUMN public.shift_events.event_type IS
$$Type of event. Allowed values (enforced by shift_events_event_type_check):
  shift_start  – driver started the shift
  break_start  – driver started a break (Pause)
  break_end    – driver ended a break
  shift_end    – driver ended the shift

For manual shifts (Schichtenzettel), all four events are inserted
at once with explicit timestamps derived from the form values.
For real-time shifts, each event is inserted as it happens.$$;

COMMENT ON COLUMN public.shift_events.timestamp IS
$$UTC timestamp of when this event occurred.
For real-time events: NOW() at the moment of the action.
For manual events: parsed from the driver's entered times.$$;

COMMENT ON COLUMN public.shift_events.lat IS
$$Optional latitude of the driver's GPS position at the time of
this event. NULL if geolocation was unavailable or denied.$$;

COMMENT ON COLUMN public.shift_events.lng IS
$$Optional longitude of the driver's GPS position at the time of
this event. NULL if geolocation was unavailable or denied.$$;

COMMENT ON COLUMN public.shift_events.metadata IS
$$Optional JSONB payload for extra event context.
Currently used on break_start events to store the break reason:
  {"reason": "Mittagspause" | "Kurzpause" | "Tanken" | "Sonstige"}
NULL for all other event types.$$;
