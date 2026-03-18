-- property_translations に property_information フィールドを追加（DeepL 翻訳キャッシュ用）
ALTER TABLE public.property_translations
  DROP CONSTRAINT IF EXISTS property_translations_field_check;

ALTER TABLE public.property_translations
  ADD CONSTRAINT property_translations_field_check
  CHECK (field IN ('title', 'address', 'property_information'));

COMMENT ON TABLE public.property_translations IS 'Cached DeepL translations for property title/address/property_information (JA→ZH)';
