-- Migration: Add driving distance and duration to trips table
-- Run this in your Supabase SQL Editor

ALTER TABLE trips
ADD COLUMN driving_distance_km DOUBLE PRECISION,
ADD COLUMN driving_duration_seconds INTEGER;

-- Comments on columns for clarity
COMMENT ON COLUMN trips.driving_distance_km IS
  'Total driving distance in kilometers for this trip, as returned by the routing provider (e.g. Google Directions, mode=driving). NULL if coordinates are missing or the API call failed.';

COMMENT ON COLUMN trips.driving_duration_seconds IS
  'Total driving duration in seconds for this trip, as returned by the routing provider (e.g. Google Directions, mode=driving). NULL if coordinates are missing or the API call failed.';

