-- Migration: Add structured address columns to trips table
-- Run this in your Supabase SQL Editor

ALTER TABLE trips
ADD COLUMN pickup_street TEXT,
ADD COLUMN pickup_street_number TEXT,
ADD COLUMN pickup_zip_code TEXT,
ADD COLUMN pickup_city TEXT,
ADD COLUMN dropoff_street TEXT,
ADD COLUMN dropoff_street_number TEXT,
ADD COLUMN dropoff_zip_code TEXT,
ADD COLUMN dropoff_city TEXT;

-- Optional: Comment on columns for clarity
COMMENT ON COLUMN trips.pickup_street IS 'Street name for pickup';
COMMENT ON COLUMN trips.pickup_street_number IS 'House number for pickup';
COMMENT ON COLUMN trips.pickup_zip_code IS 'Postal code for pickup';
COMMENT ON COLUMN trips.pickup_city IS 'City for pickup';
COMMENT ON COLUMN trips.dropoff_street IS 'Street name for dropoff';
COMMENT ON COLUMN trips.dropoff_street_number IS 'House number for dropoff';
COMMENT ON COLUMN trips.dropoff_zip_code IS 'Postal code for dropoff';
COMMENT ON COLUMN trips.dropoff_city IS 'City for dropoff';
