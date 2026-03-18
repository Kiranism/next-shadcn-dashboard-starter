-- RLS policies for users and driver_profiles.
-- Best practice: scope access by company_id. Admins manage users in their company.
-- Uses a SECURITY DEFINER helper to get the current user's company_id without RLS recursion.
-- Additive only: creates policies if they don't exist (no DROP).

-- Helper: current user's company_id (bypasses RLS so policies can use it)
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid()
$$;

-- Helper: whether current user is admin
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role = 'admin' FROM public.users WHERE id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- users table
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_select_own') THEN
    CREATE POLICY "users_select_own" ON public.users
      FOR SELECT TO authenticated USING (id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_select_company_admin') THEN
    CREATE POLICY "users_select_company_admin" ON public.users
      FOR SELECT TO authenticated
      USING (public.current_user_is_admin() AND company_id = public.current_user_company_id());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_update_own') THEN
    CREATE POLICY "users_update_own" ON public.users
      FOR UPDATE TO authenticated
      USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_update_company_admin') THEN
    CREATE POLICY "users_update_company_admin" ON public.users
      FOR UPDATE TO authenticated
      USING (public.current_user_is_admin() AND company_id = public.current_user_company_id())
      WITH CHECK (public.current_user_is_admin() AND company_id = public.current_user_company_id());
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- driver_profiles table
-- ---------------------------------------------------------------------------
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'driver_profiles' AND policyname = 'driver_profiles_select_company_admin') THEN
    CREATE POLICY "driver_profiles_select_company_admin" ON public.driver_profiles
      FOR SELECT TO authenticated
      USING (
        public.current_user_is_admin()
        AND EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = driver_profiles.user_id AND u.company_id = public.current_user_company_id()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'driver_profiles' AND policyname = 'driver_profiles_select_own') THEN
    CREATE POLICY "driver_profiles_select_own" ON public.driver_profiles
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'driver_profiles' AND policyname = 'driver_profiles_insert_company_admin') THEN
    CREATE POLICY "driver_profiles_insert_company_admin" ON public.driver_profiles
      FOR INSERT TO authenticated
      WITH CHECK (
        public.current_user_is_admin()
        AND EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = driver_profiles.user_id AND u.company_id = public.current_user_company_id()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'driver_profiles' AND policyname = 'driver_profiles_update_company_admin') THEN
    CREATE POLICY "driver_profiles_update_company_admin" ON public.driver_profiles
      FOR UPDATE TO authenticated
      USING (
        public.current_user_is_admin()
        AND EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = driver_profiles.user_id AND u.company_id = public.current_user_company_id()
        )
      )
      WITH CHECK (
        public.current_user_is_admin()
        AND EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = driver_profiles.user_id AND u.company_id = public.current_user_company_id()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'driver_profiles' AND policyname = 'driver_profiles_update_own') THEN
    CREATE POLICY "driver_profiles_update_own" ON public.driver_profiles
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
