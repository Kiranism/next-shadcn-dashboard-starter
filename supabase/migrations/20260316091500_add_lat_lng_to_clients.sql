-- Migration: Add lat/lng to clients table
-- Run this in your Supabase SQL Editor

ALTER TABLE clients
ADD COLUMN lat DOUBLE PRECISION,
ADD COLUMN lng DOUBLE PRECISION;

-- Comments on columns for clarity
COMMENT ON COLUMN clients.lat IS
  'Latitude of the primary client address, used for routing and distance calculations. NULL when not yet geocoded.';

COMMENT ON COLUMN clients.lng IS
  'Longitude of the primary client address, used for routing and distance calculations. NULL when not yet geocoded.';

