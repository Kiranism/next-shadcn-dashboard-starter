-- Ensure authenticated and anon roles have necessary privileges on users and driver_profiles.
-- "permission denied for table users" can occur if these grants are missing.
-- Safe to run: GRANT is additive and does not revoke existing permissions.
-- RLS policies still restrict which rows can be accessed.

GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT SELECT, UPDATE ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE ON public.driver_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.driver_profiles TO anon;
