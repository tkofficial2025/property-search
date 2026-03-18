-- property_tour_requests にログインユーザーの名前・メールを表示用で保存（auth.users から取得）

ALTER TABLE public.property_tour_requests
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS user_name text;

COMMENT ON COLUMN public.property_tour_requests.user_email IS 'Email from auth.users at time of request (for display in table)';
COMMENT ON COLUMN public.property_tour_requests.user_name IS 'Display name from auth.users user_metadata (for display in table)';

-- INSERT 時に auth.users から名前・メールを取得してセットするトリガー
CREATE OR REPLACE FUNCTION public.set_tour_request_user_display()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u_email text;
  u_first text;
  u_last text;
BEGIN
  SELECT email, raw_user_meta_data->>'first_name', raw_user_meta_data->>'last_name'
  INTO u_email, u_first, u_last
  FROM auth.users
  WHERE id = NEW.user_id;
  NEW.user_email := COALESCE(u_email, '');
  NEW.user_name := TRIM(COALESCE(u_first, '') || ' ' || COALESCE(u_last, ''));
  IF NEW.user_name = '' THEN
    NEW.user_name := COALESCE(u_email, '');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_tour_request_user_display_trigger ON public.property_tour_requests;
CREATE TRIGGER set_tour_request_user_display_trigger
  BEFORE INSERT ON public.property_tour_requests
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_tour_request_user_display();

-- 既存行の名前・メールを backfill（auth.users から取得）
UPDATE public.property_tour_requests ptr
SET
  user_email = u.email,
  user_name = TRIM(COALESCE(u.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(u.raw_user_meta_data->>'last_name', ''))
FROM auth.users u
WHERE ptr.user_id = u.id
  AND (ptr.user_email IS NULL OR ptr.user_name IS NULL);

UPDATE public.property_tour_requests ptr
SET user_name = ptr.user_email
WHERE (ptr.user_name IS NULL OR ptr.user_name = '') AND ptr.user_email IS NOT NULL;

-- property_tour_request_candidates にも名前・メールを表示用で保存（親 property_tour_requests からコピー）

ALTER TABLE public.property_tour_request_candidates
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS user_name text;

COMMENT ON COLUMN public.property_tour_request_candidates.user_email IS 'Copied from parent tour request (for display in table)';
COMMENT ON COLUMN public.property_tour_request_candidates.user_name IS 'Copied from parent tour request (for display in table)';

-- INSERT 時に親 property_tour_requests から名前・メールをコピーするトリガー
CREATE OR REPLACE FUNCTION public.set_tour_request_candidate_user_display()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT ptr.user_email, ptr.user_name
  INTO NEW.user_email, NEW.user_name
  FROM public.property_tour_requests ptr
  WHERE ptr.id = NEW.tour_request_id;
  NEW.user_email := COALESCE(NEW.user_email, '');
  NEW.user_name := COALESCE(NEW.user_name, '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_tour_request_candidate_user_display_trigger ON public.property_tour_request_candidates;
CREATE TRIGGER set_tour_request_candidate_user_display_trigger
  BEFORE INSERT ON public.property_tour_request_candidates
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_tour_request_candidate_user_display();

-- 既存の候補行を親から backfill
UPDATE public.property_tour_request_candidates c
SET
  user_email = ptr.user_email,
  user_name = ptr.user_name
FROM public.property_tour_requests ptr
WHERE c.tour_request_id = ptr.id
  AND (ptr.user_email IS NOT NULL OR ptr.user_name IS NOT NULL);
