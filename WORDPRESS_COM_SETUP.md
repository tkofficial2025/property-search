# WordPress.comセットアップガイド

WordPress.comを使用して、どこからでもアクセスできるオンラインWordPressをセットアップします。

## ステップ1: WordPress.comでアカウント作成

1. **WordPress.comにアクセス**
   - https://wordpress.com/ を開く
   - 「無料で始める」または「Get Started」をクリック

2. **アカウント情報を入力**
   - メールアドレスを入力
   - ユーザー名とパスワードを設定
   - 「アカウントを作成」をクリック

3. **メール認証**
   - 登録したメールアドレスに確認メールが届く
   - メール内のリンクをクリックして認証

---

## ステップ2: サイトを作成

1. **サイト名を入力**
   - 「サイト名は？」と聞かれたら、サイト名を入力
   - 例: "Tokyo Expat Housing Blog"

2. **サイトURLを選択**
   - 無料プラン: `yoursite.wordpress.com` 形式
   - 例: `tokyo-expat-housing-blog.wordpress.com`
   - 有料プラン: 独自ドメインを使用可能

3. **プランを選択**
   - **無料プラン**: 基本的な機能で十分な場合
   - **有料プラン**: カスタマイズや独自ドメインが必要な場合

4. **サイトを作成**
   - 「サイトを作成」をクリック

---

## ステップ3: WordPress管理画面にアクセス

1. **ダッシュボードにアクセス**
   - 作成したサイトの管理画面に自動的に移動
   - または、`https://yoursite.wordpress.com/wp-admin` にアクセス

2. **ログイン**
   - WordPress.comのアカウントでログイン

---

## ステップ4: 記事を書く

1. **新規投稿を作成**
   - 左メニューから「投稿 > 新規追加」をクリック

2. **記事を書く**
   - タイトルを入力
   - 本文を入力
   - カテゴリーを選択
   - アイキャッチ画像を設定

3. **公開**
   - 「公開」をクリック

---

## ステップ5: Reactアプリの設定

1. **WordPress.comのAPI URLを確認**
   - WordPress.comのサイトURL: `https://yoursite.wordpress.com`
   - API URL: `https://yoursite.wordpress.com/wp-json/wp/v2`

2. **`.env`ファイルを更新**
   ```
   VITE_WORDPRESS_API_URL=https://yoursite.wordpress.com/wp-json/wp/v2
   ```

3. **開発サーバーを再起動**
   ```bash
   # 現在のサーバーを停止（Ctrl+C）
   # 再度起動
   pnpm dev
   ```

---

## ステップ6: カテゴリーの設定

1. **カテゴリーを作成**
   - WordPress管理画面 > 投稿 > カテゴリー
   - 以下のカテゴリーを作成:
     - Lifestyle
     - Tech
     - Investment
     - Area
     - Buy
     - Market
     - Guide
     - Rent

2. **記事にカテゴリーを設定**
   - 記事作成時に右側の「カテゴリー」から選択

---

## ステップ7: ローカルの記事を移行（オプション）

既にローカルのWordPressに記事がある場合:

1. **ローカルのWordPressからエクスポート**
   - ローカルのWordPress管理画面にアクセス
   - 「ツール > エクスポート」をクリック
   - 「すべてのコンテンツ」を選択
   - 「エクスポートファイルをダウンロード」をクリック

2. **WordPress.comにインポート**
   - WordPress.comの管理画面 > ツール > インポート
   - 「WordPress」を選択
   - 「WordPressインポーターを実行」をクリック
   - エクスポートしたファイルをアップロード
   - 「インポートを実行」をクリック

---

## トラブルシューティング

### APIがアクセスできない場合

WordPress.comの無料プランでは、REST APIが制限されている可能性があります。

**解決策:**

1. **WordPress.comの設定を確認**
   - 管理画面 > 設定 > 一般
   - 「検索エンジンでの表示」が「検索エンジンにサイトを表示しない」になっていないか確認

2. **API URLを確認**
   - ブラウザで `https://yoursite.wordpress.com/wp-json/wp/v2/posts` にアクセス
   - JSONデータが表示されればOK
   - エラーが出る場合は、WordPress.comのサポートに問い合わせ

3. **有料プランにアップグレード**
   - 無料プランでAPIが制限されている場合、有料プランにアップグレード

---

## メリット

- ✅ どこからでもアクセス可能
- ✅ 自動バックアップ
- ✅ セキュリティ対策済み
- ✅ 無料プランあり
- ✅ 簡単セットアップ

---

## 次のステップ

1. WordPress.comで記事を書く
2. Reactアプリで記事が表示されることを確認
3. 他のパソコンからもWordPress.comにアクセスして記事を書く
