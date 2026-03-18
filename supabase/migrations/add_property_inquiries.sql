-- 物件詳細の「Check Availability and Request Property Details」で入力されたメールを保存

CREATE TABLE IF NOT EXISTS public.property_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text NOT NULL,
  property_id bigint NOT NULL,
  property_title text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_inquiries_property_id_idx ON public.property_inquiries(property_id);
CREATE INDEX IF NOT EXISTS property_inquiries_email_idx ON public.property_inquiries(email);

COMMENT ON TABLE public.property_inquiries IS 'Email submissions from Check Availability and Request Property Details on property detail page';

-- 誰でもINSERT可能（未ログインユーザーがメールを送れるように）
ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert property inquiries" ON public.property_inquiries;
CREATE POLICY "Allow insert property inquiries"
  ON public.property_inquiries FOR INSERT
  TO public
  WITH CHECK (true);

-- 読み取りは認証ユーザーのみ（管理用）
DROP POLICY IF EXISTS "Allow read property inquiries for authenticated" ON public.property_inquiries;
CREATE POLICY "Allow read property inquiries for authenticated"
  ON public.property_inquiries FOR SELECT
  TO authenticated
  USING (true);
