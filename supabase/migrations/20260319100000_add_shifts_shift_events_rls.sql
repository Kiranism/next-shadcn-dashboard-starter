-- RLS policies for shifts and shift_events.
-- Drivers (authenticated, driver_id = auth.uid()) can manage their own shifts.
-- Used by driver-portal at /driver/shift for manual time entry.

-- ---------------------------------------------------------------------------
-- shifts table
-- ---------------------------------------------------------------------------
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Drivers can select their own shifts
CREATE POLICY "shifts_select_own" ON public.shifts
  FOR SELECT TO authenticated
  USING (driver_id = auth.uid());

-- Drivers can insert shifts for themselves (driver_id must match)
CREATE POLICY "shifts_insert_own" ON public.shifts
  FOR INSERT TO authenticated
  WITH CHECK (driver_id = auth.uid());

-- Drivers can update their own shifts
CREATE POLICY "shifts_update_own" ON public.shifts
  FOR UPDATE TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

-- Drivers can delete their own shifts (for overwrite flow)
CREATE POLICY "shifts_delete_own" ON public.shifts
  FOR DELETE TO authenticated
  USING (driver_id = auth.uid());

-- Admins can select shifts in their company
CREATE POLICY "shifts_select_company_admin" ON public.shifts
  FOR SELECT TO authenticated
  USING (
    public.current_user_is_admin()
    AND company_id = public.current_user_company_id()
  );

-- ---------------------------------------------------------------------------
-- shift_events table
-- ---------------------------------------------------------------------------
ALTER TABLE public.shift_events ENABLE ROW LEVEL SECURITY;

-- Drivers can select events for their own shifts
CREATE POLICY "shift_events_select_own" ON public.shift_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = shift_events.shift_id AND s.driver_id = auth.uid()
    )
  );

-- Drivers can insert events for their own shifts
CREATE POLICY "shift_events_insert_own" ON public.shift_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = shift_events.shift_id AND s.driver_id = auth.uid()
    )
  );

-- Drivers can delete events for their own shifts (for overwrite flow)
CREATE POLICY "shift_events_delete_own" ON public.shift_events
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = shift_events.shift_id AND s.driver_id = auth.uid()
    )
  );

-- Admins can select events for shifts in their company
CREATE POLICY "shift_events_select_company_admin" ON public.shift_events
  FOR SELECT TO authenticated
  USING (
    public.current_user_is_admin()
    AND EXISTS (
      SELECT 1 FROM public.shifts s
      WHERE s.id = shift_events.shift_id
        AND s.company_id = public.current_user_company_id()
    )
  );
