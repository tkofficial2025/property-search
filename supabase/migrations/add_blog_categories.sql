-- ブログカテゴリーテーブルを作成（存在しない場合）
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 既存のカテゴリーを確認して、存在しないものだけを追加
-- 8種類のカテゴリー: Lifestyle, Tech, Investment, Area, Buy, Market, Guide, Rent

INSERT INTO public.blog_categories (name, slug)
SELECT name, slug
FROM (VALUES
  ('Lifestyle', 'lifestyle'),
  ('Tech', 'tech'),
  ('Investment', 'investment'),
  ('Area', 'area'),
  ('Buy', 'buy'),
  ('Market', 'market'),
  ('Guide', 'guide'),
  ('Rent', 'rent')
) AS new_categories(name, slug)
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_categories 
  WHERE blog_categories.name = new_categories.name 
     OR blog_categories.slug = new_categories.slug
);

-- インデックスを追加（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON public.blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_name ON public.blog_categories(name);

-- コメントを追加
COMMENT ON TABLE public.blog_categories IS 'ブログ記事のカテゴリーマスタ';
COMMENT ON COLUMN public.blog_categories.name IS 'カテゴリー名（表示用）';
COMMENT ON COLUMN public.blog_categories.slug IS 'カテゴリーのスラッグ（URL用）';
