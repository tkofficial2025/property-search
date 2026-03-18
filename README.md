# Premium Real Estate Website

This is a code bundle for Premium Real Estate Website. The original project is available at https://www.figma.com/design/HMtH6uiKpYIQhBmQjPs7nz/Premium-Real-Estate-Website.

## Running the code

Run `npm i` to install the dependencies.

**環境変数（ローカル）**: ルートの `env.example` をコピーして `.env` を作成し、`VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を設定してください。地図・翻訳用のキーは任意です。

```bash
# Windows
copy env.example .env

# Mac / Linux
cp env.example .env
```

Run `npm run dev` to start the development server.

**地図の表示言語**: サイトの言語（英語/中国語）に合わせて地図を切り替えています。  
- **MapTiler API キーを設定した場合**: 地図の地名・住所ラベルが英語／中国語で表示されます。[MapTiler Cloud](https://cloud.maptiler.com/)で無料アカウントを作成し、API キーを取得して環境変数 `VITE_MAPTILER_API_KEY` に設定してください。  
- **キー未設定の場合**: 英語時は CARTO、中国語時は OpenStreetMap のタイルを使用します（日本では現地語表記になることがあります）。

## Vercel にデプロイする

1. **Vercel にログイン**  
   [vercel.com](https://vercel.com) で GitHub アカウントを使ってログインする。

2. **プロジェクトをインポート**  
   - **Add New…** → **Project** をクリック  
   - GitHub の **ryukikudo2000/Realestate** リポジトリを選ぶ（または「Import」で接続）  
   - **Framework Preset** は **Vite** のまま（`vercel.json` で設定済み）

3. **環境変数を設定**  
   **Environment Variables** で次の2つを追加する（本番用に **Production** にチェック）:

   | Name | Value |
   |------|--------|
   | `VITE_SUPABASE_URL` | Supabase の Project URL（例: `https://xxxxx.supabase.co`） |
   | `VITE_SUPABASE_ANON_KEY` | Supabase の anon public key |
   | `VITE_MAPTILER_API_KEY` | （任意）MapTiler の API キー。設定すると地図の地名が英語／中国語で表示されます。[MapTiler Cloud](https://cloud.maptiler.com/account/keys/)で取得。 |
   | `DEEPL_AUTH_KEY` | （任意・サーバー側のみ）DeepL API キー。住所・物件名の翻訳用。**ブラウザに渡さず、Supabase Edge Function 等のサーバーでのみ使用。** |

   値は [Supabase Dashboard](https://supabase.com/dashboard) → 対象プロジェクト → **Settings** → **API** で確認できる。

4. **Deploy** をクリックしてデプロイする。

5. 完了後、表示された URL（例: `https://xxxx.vercel.app`）でサイトが表示される。  
   メール送信を使う場合は、Supabase の **Edge Functions** のシークレット（`RESEND_API_KEY` / `OWNER_EMAIL`）も設定する（`supabase/README.md` 参照）。
