-- SECURITY DEFINER function to update driver (users + driver_profiles).
-- Bypasses RLS by running as the function owner. Call from API with authenticated user.
-- Authorization must be enforced in the API layer (check caller is admin, same company, etc.).

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
  v_user jsonb;
  v_profiles jsonb;
BEGIN
  UPDATE users SET
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

  SELECT to_jsonb(u.*) INTO v_user FROM users u WHERE u.id = p_driver_id;
  SELECT COALESCE(jsonb_agg(p.*), '[]'::jsonb) INTO v_profiles FROM driver_profiles p WHERE p.user_id = p_driver_id;

  RETURN v_user || jsonb_build_object('driver_profiles', v_profiles);
END;
$$;

-- Allow authenticated and anon to execute (API will validate auth)
GRANT EXECUTE ON FUNCTION public.update_driver(uuid, text, text, text, text, text, text, uuid, text, text, text, text, double precision, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_driver(uuid, text, text, text, text, text, text, uuid, text, text, text, text, double precision, double precision) TO anon;
