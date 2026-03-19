-- Fix shift_events_event_type_check to allow our event types.
-- The existing constraint may use different values; we align with SHIFT_EVENT_TYPES:
-- shift_start, break_start, break_end, shift_end

ALTER TABLE public.shift_events
  DROP CONSTRAINT IF EXISTS shift_events_event_type_check,
  ADD CONSTRAINT shift_events_event_type_check
    CHECK (event_type IN ('shift_start', 'break_start', 'break_end', 'shift_end'));
