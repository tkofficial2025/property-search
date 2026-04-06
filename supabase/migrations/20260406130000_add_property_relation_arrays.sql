-- Supabase ダッシュボードでよくある text[] カラム（権利・地目等）をリポジトリの migrate でも揃える
-- 20260406120000 の text スカラ（rights 等）とは別。アプリは配列を優先して読み書きする。
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS rights_relation text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS land_category text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS zoning_types text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS planning_areas text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS land_area_sqm numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS building_area_sqm numeric DEFAULT NULL;

COMMENT ON COLUMN public.properties.rights_relation IS '権利関係（配列。1要素で単一値も表現）';
COMMENT ON COLUMN public.properties.land_category IS '地目（配列）';
COMMENT ON COLUMN public.properties.zoning_types IS '用途地域（配列）';
COMMENT ON COLUMN public.properties.planning_areas IS '区域区分（配列）';
COMMENT ON COLUMN public.properties.land_area_sqm IS '土地面積（㎡）';
COMMENT ON COLUMN public.properties.building_area_sqm IS '建物面積（㎡）。既存の size と併用する場合は同期をアプリ側で行う';
