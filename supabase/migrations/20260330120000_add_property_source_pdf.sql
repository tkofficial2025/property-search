-- 物件に PDF 取り込み元ファイルの Storage パスを保存（バケット内キー、例: 123/1710000000-doc.pdf）
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS source_pdf_path text;

COMMENT ON COLUMN public.properties.source_pdf_path IS 'Supabase Storage bucket property-pdfs 内のオブジェクトパス（公開 URL 生成用）';

-- Storage: 公開読み取り、認証ユーザーがアップロード・削除
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-pdfs',
  'property-pdfs',
  true,
  52428800,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read property pdfs" ON storage.objects;
CREATE POLICY "Public read property pdfs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-pdfs');

DROP POLICY IF EXISTS "Authenticated upload property pdfs" ON storage.objects;
CREATE POLICY "Authenticated upload property pdfs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-pdfs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated update property pdfs" ON storage.objects;
CREATE POLICY "Authenticated update property pdfs"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'property-pdfs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated delete property pdfs" ON storage.objects;
CREATE POLICY "Authenticated delete property pdfs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'property-pdfs' AND auth.role() = 'authenticated');
