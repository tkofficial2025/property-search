-- property_inquiries に名前と物件タイトルを追加（既にテーブルがある場合用）

ALTER TABLE public.property_inquiries
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS property_title text;

COMMENT ON COLUMN public.property_inquiries.name IS 'Name entered in Check Availability form';
COMMENT ON COLUMN public.property_inquiries.property_title IS 'Property title at time of request (for display in dashboard)';
