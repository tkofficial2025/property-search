-- Full Text Search用のtsvectorカラムを追加
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 検索対象となるカラムからtsvectorを生成する関数
CREATE OR REPLACE FUNCTION properties_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.address, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.station, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.layout, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成（INSERT/UPDATE時に自動でsearch_vectorを更新）
DROP TRIGGER IF EXISTS properties_search_vector_update_trigger ON public.properties;
CREATE TRIGGER properties_search_vector_update_trigger
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION properties_search_vector_update();

-- 既存データのsearch_vectorを更新
UPDATE public.properties
SET search_vector =
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(address, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(station, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(layout, '')), 'C');

-- GIN indexを作成（高速検索のため）
CREATE INDEX IF NOT EXISTS properties_search_vector_idx
  ON public.properties
  USING GIN (search_vector);

-- Full Text Search用のRPC関数を作成
CREATE OR REPLACE FUNCTION search_properties(
  search_query text,
  property_type_filter text DEFAULT NULL,
  result_limit integer DEFAULT 100
)
RETURNS TABLE (
  id integer,
  title text,
  address text,
  price bigint,
  beds integer,
  size numeric,
  layout text,
  image text,
  station text,
  walking_minutes integer,
  type text,
  is_featured boolean,
  is_new boolean,
  created_at timestamp with time zone,
  pet_friendly boolean,
  foreign_friendly boolean,
  floor integer,
  balcony boolean,
  bicycle_parking boolean,
  delivery_box boolean,
  elevator boolean,
  south_facing boolean,
  images text[],
  management_fee bigint,
  deposit bigint,
  key_money bigint,
  initial_fees_credit_card boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.address,
    p.price,
    p.beds,
    p.size,
    p.layout,
    p.image,
    p.station,
    p.walking_minutes,
    p.type,
    p.is_featured,
    p.is_new,
    p.created_at,
    p.pet_friendly,
    p.foreign_friendly,
    p.floor,
    p.balcony,
    p.bicycle_parking,
    p.delivery_box,
    p.elevator,
    p.south_facing,
    p.images,
    p.management_fee,
    p.deposit,
    p.key_money,
    p.initial_fees_credit_card
  FROM public.properties p
  WHERE 
    (search_query IS NULL OR search_query = '' OR p.search_vector @@ plainto_tsquery('english', search_query))
    AND (property_type_filter IS NULL OR p.type = property_type_filter)
  ORDER BY 
    CASE 
      WHEN search_query IS NOT NULL AND search_query != '' THEN ts_rank(p.search_vector, plainto_tsquery('english', search_query))
      ELSE 0
    END DESC,
    p.id DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- コメントを追加
COMMENT ON COLUMN public.properties.search_vector IS 'Full text search vector for title, address, station, and layout';
COMMENT ON INDEX properties_search_vector_idx IS 'GIN index for fast full text search';
COMMENT ON FUNCTION search_properties IS 'Full text search function for properties using plainto_tsquery';
