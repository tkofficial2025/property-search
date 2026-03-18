-- 物件テーブルから沿線（路線）フィールドを削除
-- Supabase Dashboard の SQL Editor で実行するか、migration として適用してください。

ALTER TABLE public.properties
  DROP COLUMN IF EXISTS railway_line;
