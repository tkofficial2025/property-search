-- 利回り・権利等を検索・AI保存しやすいよう専用カラムを追加
-- 築年は既存の building_age_band（text）を利用（new-5, 6-10 など）
-- 権利等の text[] は 20260406130000_add_property_relation_arrays.sql（rights_relation 等）
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS cap_rate double precision,
  ADD COLUMN IF NOT EXISTS rights text,
  ADD COLUMN IF NOT EXISTS land_type text,
  ADD COLUMN IF NOT EXISTS zoning text,
  ADD COLUMN IF NOT EXISTS planning_area text;

COMMENT ON COLUMN public.properties.cap_rate IS '表面利回り等（%）';
COMMENT ON COLUMN public.properties.rights IS '権利関係（自由記述）';
COMMENT ON COLUMN public.properties.land_type IS '地目（自由記述）';
COMMENT ON COLUMN public.properties.zoning IS '用途地域（自由記述）';
COMMENT ON COLUMN public.properties.planning_area IS '区域区分（市街化区域等、自由記述）';
