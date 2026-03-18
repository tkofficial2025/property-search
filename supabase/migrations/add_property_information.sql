-- 物件詳細ページの「Property Information」を Supabase で入力・編集できるようにする
-- Supabase Dashboard の Table Editor で properties の property_information を編集可能
--
-- 使い方（クラウド）: Supabase Dashboard → SQL Editor でこのファイルを実行
-- 使い方（ローカル）: supabase migration up

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS property_information text;

COMMENT ON COLUMN public.properties.property_information IS 'Property Information text shown on the property detail page (editable in Supabase Table Editor). Supports multiple lines.';
