-- 1) 親テーブルが無い場合に備えて property_tour_requests を先に作成
CREATE TABLE IF NOT EXISTS public.property_tour_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id bigint NOT NULL,
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

-- 2) 候補日程用テーブル（1リクエストにつき複数行）
CREATE TABLE IF NOT EXISTS public.property_tour_request_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_request_id uuid NOT NULL REFERENCES public.property_tour_requests(id) ON DELETE CASCADE,
  candidate_date date NOT NULL,
  time_range text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_tour_request_candidates_tour_request_id_idx
  ON public.property_tour_request_candidates(tour_request_id);

COMMENT ON TABLE public.property_tour_request_candidates IS 'Preferred date/time options for each room tour request (Request a Tour form)';

ALTER TABLE public.property_tour_request_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert candidates for own tour request" ON public.property_tour_request_candidates;
CREATE POLICY "Users can insert candidates for own tour request"
  ON public.property_tour_request_candidates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.property_tour_requests ptr
      WHERE ptr.id = tour_request_id AND ptr.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can read candidates for own tour request" ON public.property_tour_request_candidates;
CREATE POLICY "Users can read candidates for own tour request"
  ON public.property_tour_request_candidates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.property_tour_requests ptr
      WHERE ptr.id = tour_request_id AND ptr.user_id = auth.uid()
    )
  );
