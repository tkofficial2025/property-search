-- 既存の properties に新しい項目のサンプルデータを入れる
-- Supabase SQL Editor で New query → この内容を貼って Run

-- 賃貸 (type = 'rent'): 管理費・敷金・礼金・クレカ等をセット（id でバリエーション）
UPDATE public.properties
SET
  floor = (id % 5) + 1,
  balcony = (id % 2) = 0,
  bicycle_parking = (id % 3) <> 0,
  delivery_box = (id % 2) = 1,
  elevator = (id % 4) <> 0,
  south_facing = (id % 3) = 0,
  pet_friendly = (id % 4) = 0,
  foreign_friendly = (id % 2) = 0,
  management_fee = CASE WHEN (id % 3) = 0 THEN 12000 WHEN (id % 3) = 1 THEN 15000 ELSE 8000 END,
  deposit = CASE WHEN (id % 4) = 0 THEN 0 ELSE (price * 1) END,
  key_money = CASE WHEN (id % 3) = 0 THEN 0 WHEN (id % 3) = 1 THEN (price * 1) ELSE (price * 2) END,
  initial_fees_credit_card = (id % 2) = 0,
  images = CASE
    WHEN image IS NOT NULL AND image <> '' THEN ARRAY[image, image]
    ELSE NULL
  END
WHERE type = 'rent';

-- 売買 (type = 'buy'): 管理費・設備フラグ等をセット
UPDATE public.properties
SET
  floor = (id % 8) + 2,
  balcony = (id % 2) = 0,
  bicycle_parking = true,
  delivery_box = (id % 2) = 0,
  elevator = true,
  south_facing = (id % 3) <> 0,
  pet_friendly = (id % 4) = 0,
  foreign_friendly = true,
  management_fee = CASE WHEN (id % 3) = 0 THEN 25000 WHEN (id % 3) = 1 THEN 18000 ELSE 32000 END,
  images = CASE
    WHEN image IS NOT NULL AND image <> '' THEN ARRAY[image, image]
    ELSE NULL
  END
WHERE type = 'buy';
