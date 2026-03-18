-- 物件の追加項目: pet-friendly, foreign-friendly, floor, balcony, など
-- Supabase Dashboard の SQL Editor で実行するか、migration として適用してください。

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS pet_friendly boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS foreign_friendly boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS floor int DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS balcony boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bicycle_parking boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_box boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS elevator boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS south_facing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS management_fee bigint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deposit bigint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS key_money bigint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS initial_fees_credit_card boolean DEFAULT false;

COMMENT ON COLUMN public.properties.pet_friendly IS 'Pet-friendly property';
COMMENT ON COLUMN public.properties.foreign_friendly IS 'No Japanese guarantor required';
COMMENT ON COLUMN public.properties.floor IS 'Floor number (e.g. 3 for 3F)';
COMMENT ON COLUMN public.properties.images IS 'Additional image URLs (main image in "image" column)';
COMMENT ON COLUMN public.properties.management_fee IS 'Monthly management fee in JPY';
COMMENT ON COLUMN public.properties.deposit IS 'Deposit (shikikin) in JPY, 0 = no deposit';
COMMENT ON COLUMN public.properties.key_money IS 'Key money (reikin) in JPY, 0 = no key money';
COMMENT ON COLUMN public.properties.initial_fees_credit_card IS 'Initial fees can be paid by credit card';
