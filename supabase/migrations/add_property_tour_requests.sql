-- Room tour requests (Request a Tour on property detail). Logged-in users only.

CREATE TABLE IF NOT EXISTS public.property_tour_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id bigint NOT NULL,
  tour_candidates jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_tour_requests_user_id_idx ON public.property_tour_requests(user_id);
CREATE INDEX IF NOT EXISTS property_tour_requests_property_id_idx ON public.property_tour_requests(property_id);

COMMENT ON TABLE public.property_tour_requests IS 'Room tour requests from property detail page (logged-in users)';

ALTER TABLE public.property_tour_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own tour requests" ON public.property_tour_requests;
CREATE POLICY "Users can insert own tour requests"
  ON public.property_tour_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own tour requests" ON public.property_tour_requests;
CREATE POLICY "Users can read own tour requests"
  ON public.property_tour_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
