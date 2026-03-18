-- =============================================================================
-- RLS プライバシー強化 & 管理者アクセス制御のベース
-- =============================================================================
-- 要件:
-- - 物件 (properties): 誰でも SELECT 可能。管理者は全操作可能。
-- - お気に入り・問い合わせ・内見リクエスト: 作成者 (auth.uid()) のみ SELECT/INSERT/UPDATE。
-- - 管理者: admin_users に登録されたユーザーのみ全テーブルで全操作可能。
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 管理者判定用テーブル・関数
-- -----------------------------------------------------------------------------
-- 初回のみ: 最初の管理者は Dashboard → SQL Editor で以下を実行（service_role は RLS をバイパス）
--   INSERT INTO public.admin_users (id) SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1;
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.admin_users IS 'Users with admin rights (full access to all tables for support/GDPR)';

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $is_admin_fn$
SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid());
$is_admin_fn$;

COMMENT ON FUNCTION public.is_admin() IS 'True if current user is in admin_users (used by RLS policies)';

-- RLS: admin_users の読み取りは管理者のみ（自分が一覧にいるか確認するため）
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read admin_users" ON public.admin_users;
CREATE POLICY "Admins can read admin_users"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- 管理者の追加・削除は service_role または既存管理者のみ（トリガーで制御するか、Dashboard で手動）
DROP POLICY IF EXISTS "Service role can manage admin_users" ON public.admin_users;
CREATE POLICY "Service role can manage admin_users"
  ON public.admin_users FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 2. properties: 誰でも SELECT、管理者は全操作
-- -----------------------------------------------------------------------------
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read properties" ON public.properties;
CREATE POLICY "Allow public read properties"
  ON public.properties FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Admin full access properties" ON public.properties;
CREATE POLICY "Admin full access properties"
  ON public.properties FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. user_favorites: 既存ポリシー（自分のみ）＋管理者は全操作
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin full access user_favorites" ON public.user_favorites;
CREATE POLICY "Admin full access user_favorites"
  ON public.user_favorites FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. property_inquiries: 作成者のみ SELECT/UPDATE、INSERT は誰でも、管理者は全操作
--    user_id を追加し、ログインユーザーが送信した問い合わせは本人のみ閲覧可能に
-- -----------------------------------------------------------------------------
ALTER TABLE public.property_inquiries
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.property_inquiries.user_id IS 'Set when a logged-in user submits; used for RLS so only creator (or admin) can read';

CREATE INDEX IF NOT EXISTS property_inquiries_user_id_idx ON public.property_inquiries(user_id);

-- ログインユーザーが問い合わせした場合、user_id を自動でセット（アプリが渡さなくても RLS で本人のみ閲覧可能になる）
CREATE OR REPLACE FUNCTION public.set_property_inquiry_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $set_inquiry_user_id$
BEGIN
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$set_inquiry_user_id$;

DROP TRIGGER IF EXISTS set_property_inquiry_user_id_trigger ON public.property_inquiries;
CREATE TRIGGER set_property_inquiry_user_id_trigger
  BEFORE INSERT ON public.property_inquiries
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_property_inquiry_user_id();

-- 誰でも INSERT 可能（未ログインは user_id = null、ログイン時はトリガーで user_id = auth.uid() をセット）
DROP POLICY IF EXISTS "Allow insert property inquiries" ON public.property_inquiries;
CREATE POLICY "Allow insert property inquiries"
  ON public.property_inquiries FOR INSERT
  TO public
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 認証ユーザー全員の読み取りを廃止し、作成者（user_id = auth.uid()）または管理者のみ
DROP POLICY IF EXISTS "Allow read property inquiries for authenticated" ON public.property_inquiries;
CREATE POLICY "Users can read own property inquiries"
  ON public.property_inquiries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own property inquiries" ON public.property_inquiries;
CREATE POLICY "Users can update own property inquiries"
  ON public.property_inquiries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete own property inquiries" ON public.property_inquiries;
CREATE POLICY "Users can delete own property inquiries"
  ON public.property_inquiries FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. property_tour_requests: 既存（自分のみ）＋管理者は全操作
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin full access property_tour_requests" ON public.property_tour_requests;
CREATE POLICY "Admin full access property_tour_requests"
  ON public.property_tour_requests FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 既存の UPDATE ポリシーが無い場合は追加（作成者のみ更新可能）
DROP POLICY IF EXISTS "Users can update own tour requests" ON public.property_tour_requests;
CREATE POLICY "Users can update own tour requests"
  ON public.property_tour_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete own tour requests" ON public.property_tour_requests;
CREATE POLICY "Users can delete own tour requests"
  ON public.property_tour_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. property_tour_request_candidates: 既存（自分のリクエストのみ）＋管理者は全操作
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin full access property_tour_request_candidates" ON public.property_tour_request_candidates;
CREATE POLICY "Admin full access property_tour_request_candidates"
  ON public.property_tour_request_candidates FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
