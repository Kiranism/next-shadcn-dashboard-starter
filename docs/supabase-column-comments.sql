-- ============================================================
-- Supabase column comments — trips & recurring_rule_exceptions
--
-- Run these statements once against your Supabase database
-- (SQL Editor) to give every developer inline documentation in
-- Table Editor, Studio, and introspection tools.
--
-- ⚠  COMMENT ON COLUMN is a full replacement, not an append.
--    Before running, check existing comments with:
--
--    SELECT c.table_name, c.column_name, pgd.description
--    FROM   information_schema.columns c
--    JOIN   pg_class      pgc ON pgc.relname  = c.table_name
--    JOIN   pg_attribute  pga ON pga.attrelid = pgc.oid
--                             AND pga.attname  = c.column_name
--    LEFT JOIN pg_description pgd
--                             ON pgd.objoid    = pgc.oid
--                            AND pgd.objsubid  = pga.attnum
--    WHERE  c.table_schema = 'public'
--      AND  c.table_name   IN ('trips', 'recurring_rule_exceptions')
--      AND  pgd.description IS NOT NULL
--    ORDER  BY c.table_name, c.column_name;
--
-- No schema changes are made — these are pure documentation.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- TABLE: trips
-- ════════════════════════════════════════════════════════════

-- ── Hin/Rückfahrt pairing ────────────────────────────────────

COMMENT ON COLUMN trips.linked_trip_id IS
$$FK → trips.id of the paired leg (the "other half" of a Hin/Rückfahrt pair).

Direction varies by creation path:
┌──────────────────┬──────────────────────────────┬──────────────────────────────┐
│ Creation path    │ Hinfahrt.linked_trip_id       │ Rückfahrt.linked_trip_id     │
├──────────────────┼──────────────────────────────┼──────────────────────────────┤
│ create-trip form │ NULL                          │ → Hinfahrt.id (unidirection) │
│ bulk upload      │ → Rückfahrt.id (backfilled)   │ → Hinfahrt.id (bidirection)  │
│ recurring cron   │ NULL                          │ NULL (paired via rule_id)    │
│ bulk upload      │ → Rückfahrt.id (Pass 4)       │ → Hinfahrt.id (Pass 4)       │
│   pair_id column │   (explicitly provided)       │   (explicitly provided)      │
└──────────────────┴──────────────────────────────┴──────────────────────────────┘

Do NOT rely on this field alone to determine direction — bulk-upload sets it
on BOTH legs. Always check link_type first.

For csv_bulk_upload rows: when two CSV rows share the same pair_id value, both
trips receive linked_trip_id after insert (Pass 4). The pair_id value itself is
a local CSV key and is NOT stored on the trip row.

See: src/features/trips/lib/trip-direction.ts → getTripDirection()
$$;

COMMENT ON COLUMN trips.link_type IS
$$Canonical direction flag for a Hin/Rückfahrt pair.
  'return' = this trip is the Rückfahrt (return leg).
  NULL     = this trip is the Hinfahrt (outbound leg) or a standalone trip.

This is the PRIMARY signal for determining direction — always prefer this
over any address or time heuristics.

Set by all creation paths:
  • create-trip form  → 'return' on the Rückfahrt
  • recurring cron    → 'return' on the Rückfahrt
  • bulk upload       → 'return' on the Rückfahrt (auto-return via returnPolicy
                        AND explicit pair_id pairs — both set this correctly)

Legacy rows created before 2025 via the form or cron may have NULL on both
legs. In that case fall back to linked_trip_id (see its comment above).
See: src/features/trips/lib/trip-direction.ts → getTripDirection()
$$;


-- ── Core identity & billing ───────────────────────────────────

COMMENT ON COLUMN trips.payer_id IS
$$FK → payers.id. The organisation or insurance fund responsible for paying
this trip. Derived from the selected billing_type when the trip is created,
but can be overridden independently.
$$;

COMMENT ON COLUMN trips.billing_type_id IS
$$FK → billing_types.id. Determines the payer, invoice category, and UI
behaviour (color-coding, address pre-fill, mandatory return trip, etc.)
via the billing_types.behavior_profile JSON column.
$$;


-- ── Status & cancellation ─────────────────────────────────────

COMMENT ON COLUMN trips.status IS
$$Current lifecycle state of the trip.
Known values:
  pending   – created, no driver assigned yet ("Offen")
  assigned  – a driver has been assigned ("Zugewiesen")
  cancelled – trip was cancelled ("Storniert"); see canceled_reason_notes
  completed – trip was completed ("Erledigt")
Transitions are managed by the application; there is no DB-level constraint
enforcing valid state changes.

When one leg of a Hin/Rückfahrt pair is cancelled, the surviving leg shows a
badge ("Hinfahrt storniert" / "Rückfahrt storniert") so the dispatcher is aware.
See: src/features/trips/lib/trip-direction.ts → getCancelledPartnerLabel()
$$;

COMMENT ON COLUMN trips.canceled_reason_notes IS
$$Free-text reason provided by the admin when cancelling a trip.
Written by the cancellation dialog (RecurringTripCancelDialog) which prompts
the dispatcher with a textarea labelled "Stornogrund (optional)".
Populated via the reason parameter of cancelNonRecurringTrip() /
cancelNonRecurringTripAndPaired().
NULL if no reason was given or the trip has not been cancelled.
$$;


-- ── Recurring series ──────────────────────────────────────────

COMMENT ON COLUMN trips.rule_id IS
$$FK → recurring_rules.id. Non-null means this trip was generated by the
recurring-trip cron job and belongs to a series.

Both the Hinfahrt and Rückfahrt generated from the same rule occurrence share
the same rule_id. To tell them apart, use link_type ('return' = Rückfahrt).
Old cron-generated rows may have link_type = NULL on both legs; in that case
the earlier scheduled_at on the same calendar day is the Hinfahrt.

When rule_id is set:
  • Cancelling one occurrence inserts a row into recurring_rule_exceptions.
  • Cancelling the whole series sets recurring_rules.is_active = false and
    bulk-cancels all future pending trips with this rule_id.
$$;


-- ── Data source / ingestion ───────────────────────────────────

COMMENT ON COLUMN trips.ingestion_source IS
$$Optional string describing how the trip was created.
Known values:
  csv_bulk_upload  → imported via the bulk-upload dialog.
                     Rows may have linked_trip_id set when they were part of
                     an explicit pair_id pairing in the CSV, or when their
                     billing type had returnPolicy = 'time_tbd' / 'exact'.
  manual_form      → created manually via the admin create-trip form.
  recurring_cron   → auto-generated by the 14-day rolling cron job.
  NULL             → created before ingestion_source was introduced.
$$;


-- ── Addresses ────────────────────────────────────────────────

COMMENT ON COLUMN trips.pickup_street IS
$$Street name for pickup.
$$;

COMMENT ON COLUMN trips.pickup_street_number IS
$$House number for pickup.
$$;

COMMENT ON COLUMN trips.pickup_zip_code IS
$$Postal code for pickup.
$$;

COMMENT ON COLUMN trips.pickup_city IS
$$City for pickup.
$$;

COMMENT ON COLUMN trips.pickup_location IS
$$JSONB object containing {lat: double, lng: double}.
NULL when geocoding has not yet run or failed (see has_missing_geodata).
$$;

COMMENT ON COLUMN trips.dropoff_street IS
$$Street name for dropoff.
$$;

COMMENT ON COLUMN trips.dropoff_street_number IS
$$House number for dropoff.
$$;

COMMENT ON COLUMN trips.dropoff_zip_code IS
$$Postal code for dropoff.
$$;

COMMENT ON COLUMN trips.dropoff_city IS
$$City for dropoff.
$$;

COMMENT ON COLUMN trips.dropoff_location IS
$$JSONB object containing {lat: double, lng: double}.
NULL when geocoding has not yet run or failed (see has_missing_geodata).
$$;


-- ── Routing ───────────────────────────────────────────────────

COMMENT ON COLUMN trips.driving_distance_km IS
$$Estimated driving distance in kilometres between pickup and dropoff,
calculated at trip creation using the routing API. NULL if geocoding failed
or the trip was created without coordinates.
$$;

COMMENT ON COLUMN trips.driving_duration_seconds IS
$$Estimated driving duration in seconds between pickup and dropoff,
calculated at trip creation using the routing API. NULL if geocoding failed
or the trip was created without coordinates.
$$;

COMMENT ON COLUMN trips.has_missing_geodata IS
$$True when one or both address endpoints could not be geocoded.
Trips with missing geodata cannot have driving_distance_km /
driving_duration_seconds calculated automatically.
$$;


-- ── Group dispatch & ordering ─────────────────────────────────

COMMENT ON COLUMN trips.group_id IS
$$Shared UUID assigned to all trips in a multi-passenger group dispatch.
When group_id is set, all trips in the group share the same driver and
vehicle. Updating the driver on one trip in the group updates all of them.
NULL = this is a single-passenger trip.
$$;

COMMENT ON COLUMN trips.stop_order IS
$$Integer sort key for the pickup/dropoff sequence within a group dispatch
(group_id is set). Lower values are served first. NULL for single trips.
$$;


-- ── Driver assignment ─────────────────────────────────────────

COMMENT ON COLUMN trips.needs_driver_assignment IS
$$Indicates that this trip was created without a resolved driver_id
(e.g. from CSV import) and needs manual driver assignment.
$$;


-- ── Passenger ────────────────────────────────────────────────

COMMENT ON COLUMN trips.greeting_style IS
$$Greeting style for this trip, e.g. from bulk CSV or inherited from client.
Examples: "Herr", "Frau".
$$;


-- ════════════════════════════════════════════════════════════
-- TABLE: recurring_rule_exceptions
-- ════════════════════════════════════════════════════════════

COMMENT ON COLUMN recurring_rule_exceptions.rule_id IS
$$FK → recurring_rules.id. Identifies which series this exception belongs to.
$$;

COMMENT ON COLUMN recurring_rule_exceptions.exception_date IS
$$Calendar date (YYYY-MM-DD) of the occurrence that is being overridden.
Used together with rule_id + original_pickup_time to uniquely identify an
occurrence. The cron uses this to skip regenerating cancelled occurrences.
$$;

COMMENT ON COLUMN recurring_rule_exceptions.original_pickup_time IS
$$The pickup time (HH:mm:ss) from the recurring_rules row that this exception
replaces. Together with rule_id + exception_date this forms a unique key that
the cron uses to skip regenerating cancelled occurrences.
$$;

COMMENT ON COLUMN recurring_rule_exceptions.is_cancelled IS
$$True  = the cron must not generate a trip for this rule/date/time combination.
False = the occurrence exists but was modified (see modified_* columns).
$$;

