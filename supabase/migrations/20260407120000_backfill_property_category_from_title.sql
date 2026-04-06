-- 既存の properties 行に対し、物件名から property_category を一括補正する。
-- アプリの PropertyRegisterPage.inferPropertyCategoryFromTitle と同じ優先順:
--   1) 「用地」または「土地」を含む → land
--   2) 上記に当てはまらず「ゴルフ」を含む → golf
--   3) 上記に当てはまらず「ホテル」を含む → hotel
--   4) 上記に当てはまず、連続3桁以上の数字を含む → room（マンション一室・フロア）
--
-- 適用: supabase db push / migration 実行、または Dashboard → SQL Editor で本ファイルを実行（postgres 権限のため RLS をバイパス）。

UPDATE public.properties
SET property_category = 'land'
WHERE title IS NOT NULL
  AND btrim(title) <> ''
  AND title ~ '用地|土地';

UPDATE public.properties
SET property_category = 'golf'
WHERE title IS NOT NULL
  AND btrim(title) <> ''
  AND title ~ 'ゴルフ'
  AND title !~ '用地|土地';

UPDATE public.properties
SET property_category = 'hotel'
WHERE title IS NOT NULL
  AND btrim(title) <> ''
  AND title ~ 'ホテル'
  AND title !~ '用地|土地'
  AND title !~ 'ゴルフ';

UPDATE public.properties
SET property_category = 'room'
WHERE title IS NOT NULL
  AND btrim(title) <> ''
  AND title ~ '[0-9]{3,}'
  AND title !~ '用地|土地'
  AND title !~ 'ゴルフ'
  AND title !~ 'ホテル';
