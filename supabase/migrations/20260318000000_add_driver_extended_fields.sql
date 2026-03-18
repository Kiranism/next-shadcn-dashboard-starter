-- Add first_name, last_name, email to users for better driver tracking.
-- Add address fields to driver_profiles (same scheme as clients).

-- users: first_name, last_name, email
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS email text;

-- Migrate existing name to first_name/last_name (best-effort split on first space)
UPDATE public.users
SET
  first_name = CASE
    WHEN POSITION(' ' IN name) > 0 THEN NULLIF(TRIM(SPLIT_PART(name, ' ', 1)), '')
    ELSE NULLIF(TRIM(name), '')
  END,
  last_name = CASE
    WHEN POSITION(' ' IN name) > 0 THEN NULLIF(TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1)), '')
    ELSE NULL
  END
WHERE first_name IS NULL AND name IS NOT NULL AND name != '';

-- driver_profiles: address (same schema as clients)
ALTER TABLE public.driver_profiles
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS street_number text,
  ADD COLUMN IF NOT EXISTS zip_code text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;

COMMENT ON COLUMN public.users.first_name IS 'Driver first name (or first part of display name)';
COMMENT ON COLUMN public.users.last_name IS 'Driver last name';
COMMENT ON COLUMN public.users.email IS 'Email from auth.users, cached for admin display';
COMMENT ON COLUMN public.driver_profiles.street IS 'Driver address street (optional)';
COMMENT ON COLUMN public.driver_profiles.street_number IS 'Driver address house number';
COMMENT ON COLUMN public.driver_profiles.zip_code IS 'Driver address postal code';
COMMENT ON COLUMN public.driver_profiles.city IS 'Driver address city';
COMMENT ON COLUMN public.driver_profiles.lat IS 'Driver address latitude (from Places API)';
COMMENT ON COLUMN public.driver_profiles.lng IS 'Driver address longitude (from Places API)';
