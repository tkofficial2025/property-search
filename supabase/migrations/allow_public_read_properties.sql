-- 物件一覧・Featured・詳細を Supabase から取得できるようにする。
-- RLS が有効だとポリシーがないと 0 件になるため、ここで SELECT を許可する。
--
-- 使い方（クラウド）: Supabase Dashboard → SQL Editor でこのファイル全体を実行
-- 使い方（ローカル）: supabase migration up

-- 方法1: RLS を無効化（テーブル全体を誰でも読めるようにする・いちばん確実）
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;

-- 方法2を使う場合は上記をコメントアウトし、以下を有効にする
-- ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow public read access on properties" ON public.properties;
-- CREATE POLICY "Allow public read access on properties"
--   ON public.properties FOR SELECT TO public USING (true);
