-- レンタルカテゴリーテーブルを作成（存在しない場合）
CREATE TABLE IF NOT EXISTS public.rental_categories (
  id SERIAL PRIMARY KEY,
  category_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 既存のカテゴリーを確認して、存在しないものだけを追加
-- 8種類のカテゴリー: luxury, pet-friendly, furnished, top-floor, no-key-money, for-students, designers, for-families

INSERT INTO public.rental_categories (category_id, name, icon_url)
SELECT category_id, name, icon_url
FROM (VALUES
  ('luxury', 'Luxury', 'https://img.icons8.com/?size=100&id=100235&format=png&color=000000'),
  ('pet-friendly', 'Pet friendly', NULL),
  ('furnished', 'Furnished', NULL),
  ('top-floor', 'High-Rise Residence', NULL),
  ('no-key-money', 'No key money', NULL),
  ('for-students', 'For students', NULL),
  ('designers', 'Designers', NULL),
  ('for-families', 'For families', NULL)
) AS new_categories(category_id, name, icon_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.rental_categories 
  WHERE rental_categories.category_id = new_categories.category_id
);

-- インデックスを追加（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_rental_categories_category_id ON public.rental_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_rental_categories_name ON public.rental_categories(name);

-- コメントを追加
COMMENT ON TABLE public.rental_categories IS 'レンタル物件のカテゴリーマスタ（Search by Categoriesセクション用）';
COMMENT ON COLUMN public.rental_categories.category_id IS 'カテゴリーID（一意の識別子）';
COMMENT ON COLUMN public.rental_categories.name IS 'カテゴリー名（表示用）';
COMMENT ON COLUMN public.rental_categories.icon_url IS 'カテゴリーアイコンのURL（オプション）';
