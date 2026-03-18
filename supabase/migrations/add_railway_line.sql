-- 物件テーブルに沿線（路線）フィールドを追加
-- Supabase Dashboard の SQL Editor で実行するか、migration として適用してください。

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS railway_line text DEFAULT NULL;

COMMENT ON COLUMN public.properties.railway_line IS 'Railway line code (e.g., jr-east, tokyo-metro-g, toei-a, odakyu, keio, etc.)';

-- 沿線コードの例:
-- JR: jr-east
-- 東京メトロ: tokyo-metro-g, tokyo-metro-m, tokyo-metro-h, tokyo-metro-t, tokyo-metro-c, tokyo-metro-z, tokyo-metro-n, tokyo-metro-f
-- 都営地下鉄: toei-a, toei-i, toei-s, toei-e
-- 私鉄: odakyu, keio, tokyu, keikyu, tobu, seibu, keisei
