-- Add stop_order to trips table
-- This column stores the explicit sequence position of a trip within a group.
-- Populated from the dotted group_id CSV format (e.g. "1.1" → stop_order = 1,
-- "1.2" → stop_order = 2). NULL for trips created before this migration or for
-- ungrouped trips. When present, trips in a group are sorted by this value
-- instead of scheduled_at so drivers always see stops in the correct order.
ALTER TABLE trips ADD COLUMN IF NOT EXISTS stop_order INTEGER;

COMMENT ON COLUMN trips.stop_order IS
  'Explicit sequence position of this trip within its group (from dotted group_id CSV format, e.g. "1.2" → 2). NULL means order falls back to scheduled_at.';
