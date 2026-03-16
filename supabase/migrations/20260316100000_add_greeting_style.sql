-- Add greeting_style to clients and trips for CSV bulk upload and client/trip forms.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS greeting_style TEXT;

COMMENT ON COLUMN public.clients.greeting_style IS 'Preferred greeting style (e.g. du/Sie), from CSV or client form.';

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS greeting_style TEXT;

COMMENT ON COLUMN public.trips.greeting_style IS 'Greeting style for this trip, e.g. from bulk CSV or inherited from client.';
