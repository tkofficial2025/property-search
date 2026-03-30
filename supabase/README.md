# Supabase

## あなたのステップ（やること一覧）

### ローカル（PC 上）

1. **環境変数**  
   プロジェクトのルートで `.env` を作成し、Supabase の値を入れる。  
   - `copy env.example .env`（Windows）または `cp env.example .env`（Mac/Linux）  
   - `.env` を開き、`VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を Supabase の値に書き換える。  
   - 地図を使うなら `VITE_MAPTILER_API_KEY` も任意で設定。

---

### Supabase ダッシュボードでやること

**[Supabase Dashboard](https://supabase.com/dashboard)** を開き、自分のプロジェクトを選んでから次を実行する。

2. **API の値を確認**  
   - 左メニュー **Project Settings** → **API**  
   - **Project URL** と **anon public** のキーをコピーし、ローカルの `.env` の `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` に貼る（まだなら）。

3. **必要なテーブル・RLS を用意（SQL Editor）**  
   - 左メニュー **SQL Editor** → **New query**  
   - 次のファイルの中身を**順番に**コピーして貼り付け、**Run** する。  
     - `supabase/migrations/add_user_favorites.sql`（お気に入り）  
     - `supabase/migrations/add_property_inquiries.sql`（問い合わせ）  
     - `supabase/migrations/add_property_tour_requests.sql`、続けて `add_property_tour_requests_candidates.sql`（内見リクエスト）  
     - **RLS と管理者用:** `supabase/migrations/add_rls_privacy_and_admin_policies.sql`  
   - すでに実行済みのマイグレーションは飛ばしてよい。

4. **最初の管理者を 1 人登録（RLS を入れた場合だけ）**  
   - **SQL Editor** で次を実行（`あなたの管理者メール` を実際のメールに変える）。  
   ```sql
   INSERT INTO public.admin_users (id)
   SELECT id FROM auth.users WHERE email = 'あなたの管理者メール' LIMIT 1;
   ```  
   - そのメールでサインアップまたはログインしたあとで実行すること。

5. **メール送信（Edge Function）のシークレット**  
   - **Project Settings** → **Edge Functions** → **Secrets**  
   - 次を追加して **Save**。  
     - `RESEND_API_KEY` … Resend の API キー  
     - `OWNER_EMAIL` … 管理者が受け取るメールアドレス  
     - `FROM_EMAIL` … 送信元（例: `Tokyo Expat Housing <information@tkofficial.net>`）。Resend でドメイン認証したアドレスにすること。

6. **（任意）翻訳用のシークレット**  
   - 中国語翻訳を使う場合、同じ **Secrets** で `DEEPL_AUTH_KEY` を追加。

7. **（任意）物件登録の PDF 解析**  
   - 物件登録画面で PDF から情報を取り込む場合、同じ **Secrets** で `ANTHROPIC_API_KEY` を追加。  
   - ターミナルで `npx supabase functions deploy analyze-pdf --no-verify-jwt` を実行（詳細は下記「Edge Function（物件登録 PDF 解析 analyze-pdf）」）。

8. **（任意）サインアップですぐログインできるようにする**  
   - **Authentication** → **Providers** → **Email** で **Confirm email** をオフにする。

---

### ターミナル（Edge Function のデプロイ）

9. **メール送信 Function をデプロイ**  
   プロジェクトのルートで:  
   ```bash
   npx supabase login
   npx supabase link --project-ref <あなたのプロジェクトID>
   npx supabase functions deploy send-request-emails --no-verify-jwt
   ```  
   プロジェクト ID は Dashboard の **Settings** → **General** の **Reference ID**。

10. **（任意）翻訳 Function をデプロイ**  
   ```bash
   npx supabase functions deploy translate-property --no-verify-jwt
   ```

11. **（任意）PDF 解析 Function をデプロイ**  
   ```bash
   npx supabase functions deploy analyze-pdf --no-verify-jwt
   ```

---

**まとめ:**  
ローカルでは `.env` の設定、Supabase では「SQL の実行」「Secrets の設定」「必要なら管理者の追加」と「Confirm email オフ」、ターミナルでは `send-request-emails`（と必要なら `translate-property`・`analyze-pdf`）のデプロイをすれば動く状態になります。

---

## デプロイの流れ

### フロント（サイト本体）

1. リポジトリを Vercel / Netlify などに接続
2. **Build command:** `npm run build`（または `node scripts/generate-blog-posts.js && vite build`）
3. **Output directory:** `dist`
4. 環境変数に `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を設定（本番の Supabase プロジェクトの値）

### Edge Function（メール送信）

**初回だけ:** Supabase CLI でプロジェクトをリンクします。

```bash
# CLI 未インストールの場合: npm i -g supabase
supabase login
supabase link --project-ref <プロジェクトID>
```

プロジェクト ID は [Supabase Dashboard](https://supabase.com/dashboard) → 対象プロジェクト → **Settings** → **General** の **Reference ID** です。

**デプロイ:**

```bash
supabase functions deploy send-request-emails --no-verify-jwt
```

**シークレット:** Dashboard → **Project Settings** → **Edge Functions** → **Secrets** で `RESEND_API_KEY` と `OWNER_EMAIL` を追加して Save。

---

### Edge Function（翻訳 translate-property）

物件名・住所の中国語翻訳用。DeepL API を使います。

**デプロイ（プロジェクトはすでにリンク済みならこれだけでOK）:**

```bash
npx supabase functions deploy translate-property --no-verify-jwt
```
（プロジェクトのルートで実行してください。）

**初回だけ** ログイン・リンクが必要な場合:

```bash
npx supabase login
npx supabase link --project-ref mpvkdbfvaqrwayzntkdg
npx supabase functions deploy translate-property --no-verify-jwt
```

**シークレット:** Dashboard → **Project Settings** → **Edge Functions** → **Secrets** で次を追加して Save。

| 名前 | 説明 |
|------|------|
| `DEEPL_AUTH_KEY` | [DeepL](https://www.deepl.com/pro-api) の認証キー（無料プラン可） |

※ `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` は Supabase が自動で渡すため、手動設定不要です。

**翻訳キャッシュ（一度翻訳した結果を保存）:**  
Edge Function は DeepL で翻訳した結果を `property_translations` テーブルに保存します。同じ物件を再度表示するときは DB から読み、DeepL API を呼びません。キャッシュを使うには、次のマイグレーションを適用してください。

- **初回:** SQL Editor で `supabase/migrations/add_property_translations.sql` の内容を実行
- **property_information の翻訳も使う場合:** 続けて `supabase/migrations/add_property_translations_property_information.sql` を実行

---

### Edge Function（物件登録 PDF 解析 analyze-pdf）

サイトの「物件登録」画面から PDF を送り、Anthropic Claude で物件情報を抽出する関数です。

**シークレット:** Dashboard → **Project Settings** → **Edge Functions** → **Secrets**

| 名前 | 説明 |
|------|------|
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com/) の API キー |

**デプロイ（プロジェクトルートで）:**

```bash
npx supabase functions deploy analyze-pdf --no-verify-jwt
```

- フロントは PDF を **`application/octet-stream`** のボディで送り、元ファイル名はクエリ **`?filename=...`** で渡します（カスタムヘッダーは CORS のプリフライトで弾かれやすいため使いません）。
- この関数のコードを変えたら、**必ず再デプロイ**してください。

---

## ⚠️ 物件が一切取得されない場合（毎回ここを実行）

**Featured・賃貸・売却・詳細が 0 件になる**ときは、ほぼ **Row Level Security (RLS)** で `properties` の SELECT がブロックされています。

**対処（Supabase クラウド）:**

1. [Supabase Dashboard](https://supabase.com/dashboard) を開く
2. 左メニュー **SQL Editor** → **New query**
3. 以下をそのまま貼り付けて **Run** する

```sql
-- 物件テーブルを誰でも読めるようにする（RLS を無効化）
ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
```

4. ブラウザでサイトを再読み込みする

**注意:** `add_rls_privacy_and_admin_policies.sql` を適用している場合は、`properties` は RLS 有効のまま「誰でも SELECT」ポリシーで読めるため、上記の RLS 無効化は不要です。

---

## RLS と管理者（add_rls_privacy_and_admin_policies）

マイグレーション `add_rls_privacy_and_admin_policies.sql` で以下を適用します。

- **properties**: 誰でも SELECT 可能。管理者は全操作可能。
- **user_favorites / property_tour_requests / property_tour_request_candidates**: 作成者（`auth.uid()`）のみ SELECT・INSERT・UPDATE・DELETE。管理者は全操作可能。
- **property_inquiries**: 誰でも INSERT 可能（未ログインは `user_id` なし、ログイン時は自動で `user_id` をセット）。SELECT・UPDATE・DELETE は作成者または管理者のみ。

**最初の管理者の追加:** Dashboard → SQL Editor で実行（service_role で RLS をバイパス）。

```sql
INSERT INTO public.admin_users (id)
SELECT id FROM auth.users WHERE email = 'あなたの管理者メール' LIMIT 1;
```

---

## メール確認を無効にする（サインアップ後すぐログイン可能にする）

Supabase のダッシュボードで以下を設定してください。

1. プロジェクトを開く → **Authentication** → **Providers** → **Email**
2. **Confirm email** をオフにする

これでユーザーはメール確認なしでサインインできます。

## お気に入り（Favorites）機能

物件詳細のハートボタンで追加した物件は、Supabase の `user_favorites` テーブルに保存され、Favorites ページで一覧表示されます。

**いいねを押しても Favorites に反映されない場合:** まだ `user_favorites` テーブルが作成されていません。Supabase Dashboard → **SQL Editor** で **New query** を開き、`supabase/migrations/add_user_favorites.sql` の**ファイルの中身をすべて**コピーして貼り付け、**Run** してください。実行後、物件ページでもう一度ハートを押すと Favorites に追加されます。

## Check Availability and Request Property Details（物件詳細のメール送信）

物件詳細の「Check Availability and Request Property Details」で入力された**名前・メール・どの物件か**は `property_inquiries` テーブルに保存されます。

**まだテーブルがない場合:** Supabase Dashboard → **SQL Editor** → **New query** を開き、下の SQL を**すべて**コピーして貼り付け、**Run** してください。

```sql
-- property_inquiries テーブルを作成（名前・メール・物件を保存）
CREATE TABLE IF NOT EXISTS public.property_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text NOT NULL,
  property_id bigint NOT NULL,
  property_title text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_inquiries_property_id_idx ON public.property_inquiries(property_id);
CREATE INDEX IF NOT EXISTS property_inquiries_email_idx ON public.property_inquiries(email);

ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert property inquiries" ON public.property_inquiries;
CREATE POLICY "Allow insert property inquiries"
  ON public.property_inquiries FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read property inquiries for authenticated" ON public.property_inquiries;
CREATE POLICY "Allow read property inquiries for authenticated"
  ON public.property_inquiries FOR SELECT TO authenticated USING (true);
```

実行後、Table Editor に **property_inquiries** が表示され、Check Availability で送信したデータが保存されます。

---

## Room tour・資料請求時のメール送信（客と管理者に送る）

**Request a Tour** または **Check Availability and Request Property Details** 送信時に、**お客様**（確認メール）と**管理者（あなた）**（通知メール）にメールを送るには、Supabase Edge Function と Resend を設定します。

---

### Supabase でメールを送る方法（手順まとめ）

**流れ:** お客様がフォーム送信 → サイトが Supabase の Edge Function を呼ぶ → Function が Resend API でメール送信 → お客様と管理者に届く。

| 順番 | やること | どこで |
|------|----------|--------|
| 1 | Resend でアカウント作成・API キー発行 | [resend.com](https://resend.com) |
| 2 | Supabase に「Edge Function」をデプロイ | 自分のPCのターミナル |
| 3 | Supabase に「シークレット」を登録 | Supabase Dashboard |

**1. Resend の準備**

- [Resend](https://resend.com) にアクセス → サインアップ
- 左メニュー **API Keys** → **Create API Key** でキーを発行し、**コピー**（あとで使う）
- 送信元ドメインは未検証でも可（その場合は `onboarding@resend.dev` から送信）

**2. Edge Function のデプロイ（ターミナルで）**

プロジェクトのフォルダで以下を実行。初回だけ「ログイン」と「リンク」が必要。

```bash
cd "c:\Users\user\Dropbox\My PC (DESKTOP-Q5M3N18)\Desktop\Premium Real Estate Website"

# 初回のみ: ログイン（ブラウザが開く）またはトークンを使う
# トークンを使う場合: https://supabase.com/dashboard/account/tokens で発行し、
set SUPABASE_ACCESS_TOKEN=あなたのトークン

# 初回のみ: プロジェクトをリンク（プロジェクトIDは Dashboard → Settings → General の Reference ID）
npx supabase link --project-ref プロジェクトID

# デプロイ（毎回この1行でOK）
npx supabase functions deploy send-request-emails --no-verify-jwt
```

**3. シークレットの設定（Supabase Dashboard で）**

1. [Supabase Dashboard](https://supabase.com/dashboard) を開く
2. 対象プロジェクトをクリック
3. 左メニュー **Project Settings**（歯車アイコン）
4. 左の **Edge Functions** をクリック
5. **Secrets** タブを開く
6. **Add new secret** で次の2つを追加して **Save**:
   - **Name:** `RESEND_API_KEY` → **Value:** Resend でコピーした API キー
   - **Name:** `OWNER_EMAIL` → **Value:** 通知を受け取りたいメールアドレス（あなたのアドレス）

ここまでできれば、フォーム送信時にメールが送られます。届かない場合は「4. メールが送られないときの確認」を参照。

---

### 1. Resend の準備（詳細）

1. [Resend](https://resend.com) でアカウント作成
2. **API Keys** で API キーを発行
3. 送信元ドメインを検証（未検証の場合は `onboarding@resend.dev` が送信元になります）

### 2. Edge Function のデプロイとシークレット設定

Supabase CLI でプロジェクトをリンクしたうえで:

```bash
# 未ログインのフォーム（資料請求・Free Consultation）からも呼べるようにする
supabase functions deploy send-request-emails --no-verify-jwt
```

※ `--no-verify-jwt` を付けると、ログインしていないお客様が送るフォームからもメール送信が動きます。付けないと 401 で失敗することがあります。

**Supabase Dashboard** → **Project Settings** → **Edge Functions** で、次のシークレットを設定します。

| シークレット名      | 説明 |
|---------------------|------|
| `RESEND_API_KEY`    | Resend の API キー（必須） |
| `OWNER_EMAIL`       | 管理者（あなた）のメールアドレス。ここに通知が届きます |
| `FROM_EMAIL`        | （任意）送信元。未設定時は `Tokyo Expat Housing <information@tkofficial.net>` を使用します。 |

### 3. 動作

- **Room tour** を送信 → お客様のメールに「内見予約を受け付けました」、管理者に「新しい内見予約」が届きます。
- **資料請求** を送信 → お客様に「資料請求を受け付けました」、管理者に「新しい資料請求」が届きます。

メール送信に失敗しても、Room tour / 資料請求の保存はそのまま成功します（送信は非同期で実行されます）。

### 4. メールが送られないときの確認

1. **Edge Function をデプロイしたか**  
   `supabase functions deploy send-request-emails --no-verify-jwt` を実行しているか確認。

2. **シークレットが設定されているか**  
   Dashboard → **Project Settings** → **Edge Functions** → **Secrets** で `RESEND_API_KEY` と `OWNER_EMAIL` が入っているか確認。

3. **ブラウザのコンソール**  
   送信後に F12 → **Console** を開き、`[send-request-emails]` のエラーが出ていないか確認。  
   例: `401` なら JWT 検証で弾かれている → 上記のとおり `--no-verify-jwt` で再デプロイ。

4. **Supabase のログ**  
   Dashboard → **Edge Functions** → **send-request-emails** → **Logs** で、実行エラーや Resend API のエラーが出ていないか確認。

5. **Resend の送信元**  
   すべてのユーザー向けメールは **information@tkofficial.net** から送る想定です。Resend でドメイン（tkofficial.net）を検証し、未設定時はコード側で `information@tkofficial.net` を送信元に使います。変更したい場合は `FROM_EMAIL` シークレットで上書きできます。

**Supabase Auth のメール（パスワードリセット・サインアップ確認など）** を同じ送信元にしたい場合は、Supabase Dashboard → **Authentication** → **Email Templates** または **SMTP Settings** で、Resend をカスタム SMTP として設定し、送信元を `information@tkofficial.net` にしてください。
