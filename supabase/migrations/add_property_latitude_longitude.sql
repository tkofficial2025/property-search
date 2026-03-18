-- マップ表示用: 物件の緯度・経度を保存し、毎回のジオコーディングを不要にする
-- Run in Supabase SQL Editor or via migration.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS latitude double precision DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitude double precision DEFAULT NULL;

COMMENT ON COLUMN public.properties.latitude IS 'Latitude for map display (geocoded from address)';
COMMENT ON COLUMN public.properties.longitude IS 'Longitude for map display (geocoded from address)';

-- 既存データは一括ジオコーディングスクリプトまたは管理画面で後から投入可能
