-- Rename public.users to public.accounts.
-- Avoids confusion with auth.users. Better for multi-tenant scope.
-- All foreign keys (driver_profiles, trips, shifts, etc.) reference by column id;
-- the referenced table rename does not break FKs in PostgreSQL.

-- 1. Rename the table
ALTER TABLE public.users RENAME TO accounts;

-- Rename FK constraint for consistency (optional)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_company_id_fkey') THEN
    ALTER TABLE public.accounts RENAME CONSTRAINT users_company_id_fkey TO accounts_company_id_fkey;
  END IF;
END $$;

-- 2. Update helper functions (they query the app user table)
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.accounts WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role = 'admin' FROM public.accounts WHERE id = auth.uid()
$$;

-- 3. Drop old RLS policies (they were on users, now on accounts - we need to recreate with new names)
DROP POLICY IF EXISTS "users_select_own" ON public.accounts;
DROP POLICY IF EXISTS "users_select_company_admin" ON public.accounts;
DROP POLICY IF EXISTS "users_update_own" ON public.accounts;
DROP POLICY IF EXISTS "users_update_company_admin" ON public.accounts;

-- 4. Create new policies with accounts_ prefix
CREATE POLICY "accounts_select_own" ON public.accounts
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "accounts_select_company_admin" ON public.accounts
  FOR SELECT TO authenticated
  USING (public.current_user_is_admin() AND company_id = public.current_user_company_id());

CREATE POLICY "accounts_update_own" ON public.accounts
  FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "accounts_update_company_admin" ON public.accounts
  FOR UPDATE TO authenticated
  USING (public.current_user_is_admin() AND company_id = public.current_user_company_id());

-- 5. Update driver_profiles policies (they join to users -> now accounts)
DROP POLICY IF EXISTS "driver_profiles_select_company_admin" ON public.driver_profiles;
DROP POLICY IF EXISTS "driver_profiles_select_own" ON public.driver_profiles;
DROP POLICY IF EXISTS "driver_profiles_insert_company_admin" ON public.driver_profiles;
DROP POLICY IF EXISTS "driver_profiles_update_company_admin" ON public.driver_profiles;
DROP POLICY IF EXISTS "driver_profiles_update_own" ON public.driver_profiles;

CREATE POLICY "driver_profiles_select_company_admin" ON public.driver_profiles
  FOR SELECT TO authenticated
  USING (
    public.current_user_is_admin()
    AND EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = driver_profiles.user_id AND a.company_id = public.current_user_company_id()
    )
  );

CREATE POLICY "driver_profiles_select_own" ON public.driver_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "driver_profiles_insert_company_admin" ON public.driver_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_is_admin()
    AND EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = driver_profiles.user_id AND a.company_id = public.current_user_company_id()
    )
  );

CREATE POLICY "driver_profiles_update_company_admin" ON public.driver_profiles
  FOR UPDATE TO authenticated
  USING (
    public.current_user_is_admin()
    AND EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = driver_profiles.user_id AND a.company_id = public.current_user_company_id()
    )
  )
  WITH CHECK (
    public.current_user_is_admin()
    AND EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = driver_profiles.user_id AND a.company_id = public.current_user_company_id()
    )
  );

CREATE POLICY "driver_profiles_update_own" ON public.driver_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 6. Grants for accounts (replaces users)
GRANT SELECT, UPDATE ON public.accounts TO authenticated;
GRANT SELECT, UPDATE ON public.accounts TO anon;

-- 7. Update the update_driver function to use accounts
CREATE OR REPLACE FUNCTION public.update_driver(
  p_driver_id uuid,
  p_name text DEFAULT NULL,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_license_number text DEFAULT NULL,
  p_default_vehicle_id uuid DEFAULT NULL,
  p_street text DEFAULT NULL,
  p_street_number text DEFAULT NULL,
  p_zip_code text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_lat double precision DEFAULT NULL,
  p_lng double precision DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account jsonb;
  v_profiles jsonb;
BEGIN
  UPDATE accounts SET
    name = COALESCE(p_name, name),
    first_name = p_first_name,
    last_name = p_last_name,
    phone = p_phone,
    role = COALESCE(p_role, role)
  WHERE id = p_driver_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Driver not found: %', p_driver_id;
  END IF;

  UPDATE driver_profiles SET
    license_number = p_license_number,
    default_vehicle_id = p_default_vehicle_id,
    street = p_street,
    street_number = p_street_number,
    zip_code = p_zip_code,
    city = p_city,
    lat = p_lat,
    lng = p_lng
  WHERE user_id = p_driver_id;

  IF NOT FOUND THEN
    INSERT INTO driver_profiles (user_id, license_number, default_vehicle_id, street, street_number, zip_code, city, lat, lng)
    VALUES (p_driver_id, p_license_number, p_default_vehicle_id, p_street, p_street_number, p_zip_code, p_city, p_lat, p_lng);
  END IF;

  SELECT to_jsonb(a.*) INTO v_account FROM accounts a WHERE a.id = p_driver_id;
  SELECT COALESCE(jsonb_agg(p.*), '[]'::jsonb) INTO v_profiles FROM driver_profiles p WHERE p.user_id = p_driver_id;

  RETURN v_account || jsonb_build_object('driver_profiles', v_profiles);
END;
$$;

COMMENT ON TABLE public.accounts IS 'App user accounts (role, company_id, profile). Links to auth.users by id. Renamed from users to avoid confusion with auth.users.';
