-- Migration: Add bulk upload flags to trips table
-- Run this in your Supabase SQL Editor

ALTER TABLE trips
ADD COLUMN has_missing_geodata BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN needs_driver_assignment BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN ingestion_source TEXT;

-- Comments on columns for clarity
COMMENT ON COLUMN trips.has_missing_geodata IS
  'Indicates that this trip is missing lat/lng data and may require geocoding.';

COMMENT ON COLUMN trips.needs_driver_assignment IS
  'Indicates that this trip was created without a resolved driver_id (e.g. from CSV import) and needs manual driver assignment.';

COMMENT ON COLUMN trips.ingestion_source IS
  'Optional string describing how the trip was created (e.g. csv_bulk_upload, manual_form).';

