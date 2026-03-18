-- Run this in Supabase SQL Editor to diagnose "permission denied for table users"
-- Copy the results and share if needed.

-- 1. Current grants on public.users
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY grantee, privilege_type;

-- 2. Table owner
SELECT tablename, tableowner FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('users', 'driver_profiles');

-- 3. RLS status
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname IN ('users', 'driver_profiles');

-- 4. Existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('users', 'driver_profiles')
ORDER BY tablename, policyname;

-- 5. Admin users and their company_id (NULL = policy will block)
SELECT id, name, role, company_id
FROM public.users
WHERE role = 'admin';

-- 6. Does a companies table exist? (for reference)
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'companies'
) AS companies_table_exists;
