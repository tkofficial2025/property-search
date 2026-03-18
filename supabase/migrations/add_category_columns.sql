-- propertiesテーブルにカテゴリーカラムを追加（存在しない場合のみ）
-- 8種類のカテゴリー: luxury, pet-friendly, furnished, high-rise-residence, no-key-money, for-students, designers, for-families

-- Luxury: is_featuredが既に存在する可能性があるので、カテゴリー用のカラムを追加
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS category_luxury boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS category_pet_friendly boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS category_furnished boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS category_high_rise_residence boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS category_no_key_money boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS category_for_students boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS category_designers boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS category_for_families boolean DEFAULT false;

-- コメントを追加
COMMENT ON COLUMN public.properties.category_luxury IS 'Luxury category (高級物件)';
COMMENT ON COLUMN public.properties.category_pet_friendly IS 'Pet friendly category (ペット可)';
COMMENT ON COLUMN public.properties.category_furnished IS 'Furnished category (家具付き)';
COMMENT ON COLUMN public.properties.category_high_rise_residence IS 'High-Rise Residence category (高層住宅)';
COMMENT ON COLUMN public.properties.category_no_key_money IS 'No key money category (礼金なし)';
COMMENT ON COLUMN public.properties.category_for_students IS 'For students category (学生向け)';
COMMENT ON COLUMN public.properties.category_designers IS 'Designers category (デザイナー向け)';
COMMENT ON COLUMN public.properties.category_for_families IS 'For families category (ファミリー向け)';

-- 既存のデータから自動的にカテゴリーを設定（オプション）
-- 既存のカラムからカテゴリーを推測して設定

-- Luxury: is_featuredがtrueの場合
UPDATE public.properties
SET category_luxury = true
WHERE is_featured = true AND category_luxury = false;

-- Pet friendly: pet_friendlyがtrueの場合
UPDATE public.properties
SET category_pet_friendly = true
WHERE pet_friendly = true AND category_pet_friendly = false;

-- Furnished: タイトルに"furnished"または"家具付き"が含まれる場合
UPDATE public.properties
SET category_furnished = true
WHERE (
  LOWER(title) LIKE '%furnished%' OR 
  LOWER(title) LIKE '%家具付き%'
) AND category_furnished = false;

-- High-Rise Residence: floorが5以上の場合
UPDATE public.properties
SET category_high_rise_residence = true
WHERE floor >= 5 AND category_high_rise_residence = false;

-- No key money: key_moneyが0またはnullの場合
UPDATE public.properties
SET category_no_key_money = true
WHERE (key_money IS NULL OR key_money = 0) AND category_no_key_money = false;

-- For students: タイトルに"student"または"学生"が含まれる場合
UPDATE public.properties
SET category_for_students = true
WHERE (
  LOWER(title) LIKE '%student%' OR 
  LOWER(title) LIKE '%学生%'
) AND category_for_students = false;

-- Designers: タイトルに"design"または"デザイナー"が含まれる場合
UPDATE public.properties
SET category_designers = true
WHERE (
  LOWER(title) LIKE '%design%' OR 
  LOWER(title) LIKE '%デザイナー%'
) AND category_designers = false;

-- For families: タイトルに"family"または"家族"が含まれる、またはbedsが2以上の場合
UPDATE public.properties
SET category_for_families = true
WHERE (
  LOWER(title) LIKE '%family%' OR 
  LOWER(title) LIKE '%家族%' OR
  beds >= 2
) AND category_for_families = false;
