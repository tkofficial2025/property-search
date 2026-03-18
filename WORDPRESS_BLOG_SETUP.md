# WordPressブログセットアップガイド

画像のようなモダンなブログレイアウトをWordPressで作成する手順です。

## 必要な機能

1. **カテゴリーフィルターナビゲーション**
   - All, Lifestyle, Tech, Investment, Area, Buy などのカテゴリー
   - アクティブなカテゴリーに下線表示

2. **グリッドレイアウト**
   - 3カラムのレスポンシブグリッド
   - 記事カード形式

3. **記事カードデザイン**
   - サムネイル画像
   - カテゴリータグ（オレンジ色）
   - タイトル
   - 日付

## 推奨テーマ

### 1. **Astra** (無料)
- カスタマイズ性が高い
- ElementorやGutenbergと相性が良い
- 軽量で高速

### 2. **GeneratePress** (無料/有料)
- 軽量で高速
- カスタマイズ性が高い

### 3. **Neve** (無料)
- モダンなデザイン
- カスタマイズ性が高い

## ローカル環境へのインストール

### 方法1: Local by Flywheel（推奨・最も簡単）

**Windows向けの最も簡単な方法**

1. **Local by Flywheelをダウンロード**
   - https://localwp.com/ にアクセス
   - 「Download」をクリックしてインストーラーをダウンロード
   - インストーラーを実行してインストール

2. **新しいサイトを作成**
   - Localを起動
   - 「+ Create a new site」をクリック
   - サイト名を入力（例：tokyo-blog）
   - 「Continue」をクリック

3. **環境を選択**
   - 「Preferred」を選択（推奨設定）
   - 「Continue」をクリック

4. **WordPressの設定**
   - WordPressのユーザー名、パスワード、メールアドレスを入力
   - 「Add Site」をクリック

5. **サイトを起動**
   - 作成したサイトの「Start」ボタンをクリック
   - 「Open Site」をクリックしてサイトを開く
   - 「Open Site Admin」をクリックして管理画面にアクセス

**メリット:**
- インストールが簡単
- 自動でSSL証明書を設定
- ワンクリックでサイトの起動/停止
- 複数のサイトを管理可能

---

### 方法2: XAMPP（Windows向け）

**従来の方法、より細かい制御が可能**

1. **XAMPPをダウンロード**
   - https://www.apachefriends.org/ にアクセス
   - 「Download」をクリックしてXAMPPをダウンロード
   - インストーラーを実行してインストール
   - ApacheとMySQLを選択してインストール

2. **XAMPPを起動**
   - XAMPP Control Panelを起動
   - ApacheとMySQLの「Start」ボタンをクリック

3. **WordPressをダウンロード**
   - https://ja.wordpress.org/download/ にアクセス
   - WordPressをダウンロードして解凍

4. **WordPressを配置**
   - 解凍したWordPressフォルダを `C:\xampp\htdocs\` に移動
   - フォルダ名を変更（例：`tokyo-blog`）

5. **データベースを作成**
   - ブラウザで `http://localhost/phpmyadmin` にアクセス
   - 「新規作成」をクリック
   - データベース名を入力（例：`tokyo_blog`）
   - 「作成」をクリック

6. **WordPressのインストール**
   - ブラウザで `http://localhost/tokyo-blog` にアクセス
   - 言語を選択して「続ける」をクリック
   - データベース情報を入力：
     - データベース名: `tokyo_blog`
     - ユーザー名: `root`
     - パスワード: （空欄）
     - データベースのホスト名: `localhost`
     - テーブル接頭辞: `wp_`
   - 「送信」をクリック
   - サイト情報を入力して「WordPressをインストール」をクリック

**メリット:**
- 無料
- 細かい設定が可能
- 本番環境に近い環境

---

### 方法3: Docker（上級者向け）

**開発環境をコンテナ化**

1. **Docker Desktopをインストール**
   - https://www.docker.com/products/docker-desktop からダウンロード
   - インストールして起動

2. **docker-compose.ymlを作成**

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: wordpress_db
    restart: always
    environment:
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress
      MYSQL_ROOT_PASSWORD: rootpassword
    volumes:
      - db_data:/var/lib/mysql

  wordpress:
    depends_on:
      - db
    image: wordpress:latest
    container_name: wordpress_app
    restart: always
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress
      WORDPRESS_DB_NAME: wordpress
    volumes:
      - wordpress_data:/var/www/html

volumes:
  db_data:
  wordpress_data:
```

3. **起動**
   ```bash
   docker-compose up -d
   ```

4. **アクセス**
   - ブラウザで `http://localhost:8080` にアクセス
   - WordPressのインストール画面が表示される

---

## セットアップ手順

### ステップ1: WordPressのインストール

1. 上記のいずれかの方法でローカル環境にWordPressをインストール
2. 管理画面にログイン（通常は `http://localhost/サイト名/wp-admin`）

### ステップ2: テーマのインストール

1. **外観 > テーマ > 新規追加**
2. 「Astra」を検索してインストール・有効化

### ステップ3: ページビルダーの選択（オプション）

**無料で実現する方法（推奨）:**

WordPressの標準機能（Gutenberg）とカスタムコードで実現可能です。Elementorは不要です。

**有料版を使いたい場合のみ:**
1. **プラグイン > 新規追加**
2. 「Elementor」を検索してインストール・有効化（無料版でも基本的な機能は使えます）

### ステップ4: カテゴリーの設定

1. **投稿 > カテゴリー**
2. 以下のカテゴリーを作成：
   - Lifestyle
   - Tech
   - Investment
   - Area
   - Buy
   - Market
   - Guide
   - Rent

### ステップ5: カスタム投稿タイプの設定（オプション・通常は不要）

**注意:** 通常のブログ記事を投稿するだけなら、このステップは**スキップ**してOKです。カスタム投稿タイプは、通常の「投稿」とは別の種類のコンテンツを作りたい場合のみ必要です。

**カスタム投稿タイプが必要な場合のみ:**

1. **プラグインのインストール**
   - WordPress管理画面の左メニューから「**プラグイン**」をクリック
   - 「**新規追加**」をクリック
   - 検索ボックスに「**Custom Post Type UI**」と入力
   - 「**Custom Post Type UI**」を検索して見つけたら「**今すぐインストール**」をクリック
   - インストール後、「**有効化**」をクリック

2. **カスタム投稿タイプの作成**
   - 左メニューに「**CPT UI**」という項目が追加されます
   - 「**CPT UI > Add/Edit Post Types**」をクリック
   - 新しい投稿タイプ「Blog」を作成（通常は不要なので、このステップはスキップしてOK）

**通常のブログ記事を投稿するだけなら、このステップは完全にスキップして次のステップに進んでください。**

### ステップ6: テーマカスタマイズ

#### カテゴリーフィルターナビゲーション

**推奨方法: カスタムコード（完全無料・完全制御可能）**

**まず子テーマを作成（ファイルシステムに直接作成）:**

**重要:** 子テーマはWordPressの管理画面からは作成できません。ファイルシステムに直接ファイルを作成する必要があります。

### ローカル環境（Local by Flywheel / XAMPP）の場合:

1. **WordPressのインストールフォルダを開く**
   - **Local by Flywheelの場合:**
     - Localアプリでサイトを右クリック > 「Reveal in Finder」（Mac）または「Open Site Shell」（Windows）
     - または、Localアプリでサイトを選択 > 「Open Site Shell」をクリック
     - フォルダパスは通常: `C:\Users\ユーザー名\Local Sites\サイト名\app\public\wp-content\themes\`
   
   - **XAMPPの場合:**
     - `C:\xampp\htdocs\サイト名\wp-content\themes\` を開く

2. **子テーマフォルダを作成**
   - `themes` フォルダ内に新しいフォルダを作成
   - フォルダ名: `astra-child`（小文字、ハイフン推奨）

3. **style.cssファイルを作成**
   - `astra-child` フォルダ内に `style.css` という名前のファイルを作成
   - メモ帳やテキストエディタで開いて、以下のコードを貼り付けて保存:
   ```css
   /*
   Theme Name: Astra Child
   Template: astra
   */
   @import url("../astra/style.css");
   ```

4. **functions.phpファイルを作成**
   - `astra-child` フォルダ内に `functions.php` という名前のファイルを作成
   - 最初は空ファイルでOK（後でコードを追加します）

5. **子テーマを有効化**
   - WordPress管理画面にアクセス
   - 左メニューから「**外観 > テーマ**」をクリック
   - 「**Astra Child**」というテーマが表示されるので、クリックして「**有効化**」をクリック

### レンタルサーバーの場合（FTPまたはファイルマネージャーを使用）:

1. **FTPソフトまたはサーバーのファイルマネージャーで接続**
2. `wp-content/themes/` フォルダに移動
3. 上記と同じ手順で `astra-child` フォルダとファイルを作成

**子テーマのfunctions.phpに追加:**

```php
<?php
// カテゴリーフィルターメニュー
function custom_category_filter_menu() {
    $categories = get_categories();
    $current_category = get_queried_object();
    $is_home = is_home() || is_front_page();
    
    echo '<nav class="category-filter-nav">';
    echo '<a href="' . home_url() . '" class="category-link' . ($is_home ? ' active' : '') . '">All</a>';
    foreach ($categories as $category) {
        $active = isset($current_category->term_id) && $current_category->term_id == $category->term_id;
        echo '<a href="' . get_category_link($category->term_id) . '" class="category-link' . ($active ? ' active' : '') . '">' . $category->name . '</a>';
    }
    echo '</nav>';
}
add_action('wp_head', 'custom_category_filter_menu');
```

#### グリッドレイアウト

**CSS（子テーマのstyle.cssまたはカスタマイザー）:**

```css
.blog-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    padding: 2rem 0;
}

@media (max-width: 768px) {
    .blog-grid {
        grid-template-columns: 1fr;
    }
}

.blog-card {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.3s, box-shadow 0.3s;
}

.blog-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.blog-card-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.blog-card-content {
    padding: 1.5rem;
}

.blog-card-categories {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.blog-card-category {
    color: #ff6b35; /* オレンジ色 */
    font-size: 0.875rem;
    font-weight: 500;
}

.blog-card-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    line-height: 1.4;
}

.blog-card-date {
    color: #6b7280;
    font-size: 0.875rem;
}

.category-filter-nav {
    display: flex;
    gap: 2rem;
    padding: 1.5rem 0;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 2rem;
}

.category-link {
    text-decoration: none;
    color: #374151;
    font-weight: 500;
    padding-bottom: 0.5rem;
    position: relative;
}

.category-link.active,
.category-link:hover {
    color: #111827;
}

.category-link.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: #111827;
}
```

### ステップ7: ホームページテンプレートの作成

**子テーマに `home.php` を作成:**

```php
<?php get_header(); ?>

<div class="container" style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
    <?php custom_category_filter_menu(); ?>
    
    <?php
    if (have_posts()) :
        echo '<div class="blog-grid">';
        while (have_posts()) : the_post();
            ?>
            <article class="blog-card">
                <?php if (has_post_thumbnail()) : ?>
                    <a href="<?php the_permalink(); ?>">
                        <img src="<?php the_post_thumbnail_url('large'); ?>" 
                             alt="<?php the_title(); ?>" 
                             class="blog-card-image">
                    </a>
                <?php endif; ?>
                
                <div class="blog-card-content">
                    <div class="blog-card-categories">
                        <?php
                        $categories = get_the_category();
                        foreach ($categories as $category) {
                            echo '<span class="blog-card-category">' . $category->name . '</span>';
                        }
                        ?>
                    </div>
                    
                    <h2 class="blog-card-title">
                        <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                    </h2>
                    
                    <div class="blog-card-date">
                        <?php echo get_the_date('F jS, Y'); ?>
                    </div>
                </div>
            </article>
            <?php
        endwhile;
        echo '</div>';
        
        // ページネーション
        the_posts_pagination();
    else :
        echo '<p>記事が見つかりませんでした。</p>';
    endif;
    ?>
</div>

<?php get_footer(); ?>
```

**子テーマに `archive.php` も作成（カテゴリーページ用）:**

親テーマの `archive.php` をコピーして、上記の `home.php` と同じコードを使用します。

### ステップ8: CSSを子テーマに追加

**子テーマの `style.css` に上記のCSSコードを追加:**

```css
/*
Theme Name: Astra Child
Template: astra
*/
@import url("../astra/style.css");

/* ここに上記のCSSコード（.blog-grid, .blog-card など）をすべて追加 */
```

**注意:** カテゴリーフィルターは通常のリンクで動作するため、JavaScriptは不要です。ページ遷移で自動的にフィルタリングされます。

## プラグイン推奨（すべて無料版でOK・すべてオプション）

**重要:** ブログを表示するだけなら、以下のプラグインは**すべて不要**です。WordPressの標準機能だけで実現できます。

**必要に応じて追加できるプラグイン:**

1. **Yoast SEO** - SEO最適化（無料版で十分・オプション）
   - インストール方法: プラグイン > 新規追加 > 「Yoast SEO」を検索 > インストール > 有効化

2. **WP Super Cache** - キャッシュ（無料・パフォーマンス向上・オプション）
   - インストール方法: プラグイン > 新規追加 > 「WP Super Cache」を検索 > インストール > 有効化

**注意:** 
- Elementorは不要です
- Custom Post Type UIも通常は不要です（通常の「投稿」で十分）
- Advanced Custom Fieldsも通常は不要です
- WordPressの標準機能とカスタムコードで完全に実現できます

## 完成イメージ

- 上部にカテゴリーフィルターナビゲーション
- 3カラムのグリッドレイアウト
- 各記事カードに画像、カテゴリータグ、タイトル、日付
- レスポンシブデザイン（モバイルは1カラム）

## 記事の投稿と表示

### ステップ1: 記事を投稿する

1. **WordPress管理画面にログイン**
   - `http://localhost/サイト名/wp-admin` にアクセス
   - ユーザー名とパスワードでログイン

2. **新規投稿を作成**
   - 左メニューから「投稿 > 新規追加」をクリック
   - タイトルを入力
   - 本文を入力
   - 右側の「カテゴリー」から該当するカテゴリーを選択（例：Lifestyle、Techなど）
   - 「アイキャッチ画像を設定」で記事のサムネイル画像を設定
   - 「公開」をクリック

3. **複数の記事を投稿**
   - 同様の手順で複数の記事を作成
   - 各記事に異なるカテゴリーを設定

### ステップ2: ブログページの設定

1. **固定ページを作成（ホームページ用）**
   - 「固定ページ > 新規追加」
   - タイトル: 「Home」または「Blog」
   - 本文は空欄でOK
   - 「公開」をクリック

2. **投稿ページの設定**
   - 「設定 > 表示設定」
   - 「ホームページの表示」で「最新の投稿」を選択
   - または「固定ページ」を選択して、上で作成した「Home」ページを選択
   - 「変更を保存」をクリック

3. **アーカイブページの確認**
   - フロントエンドで `http://localhost/サイト名` にアクセス
   - 投稿した記事が表示されることを確認

### ステップ3: カテゴリーフィルターの動作確認

1. **カテゴリーメニューの確認**
   - フロントエンドでカテゴリーフィルターが表示されているか確認
   - 「All」をクリックして全記事が表示されるか確認
   - 各カテゴリー（Lifestyle、Techなど）をクリックして、該当記事のみが表示されるか確認

2. **グリッドレイアウトの確認**
   - 記事が3カラムのグリッドで表示されているか確認
   - モバイル表示で1カラムになるか確認

### ステップ4: カスタマイズの適用

上記のCSSとPHPコードを適用すると：
- ✅ カテゴリーフィルターナビゲーションが表示される
- ✅ 記事がグリッドレイアウトで表示される
- ✅ 各記事カードに画像、カテゴリータグ、タイトル、日付が表示される
- ✅ カテゴリーをクリックすると該当記事のみが表示される

## トラブルシューティング

### 記事が表示されない場合

1. **パーマリンク設定を確認**
   - 「設定 > パーマリンク設定」
   - 「投稿名」を選択して「変更を保存」をクリック

2. **テーマのアーカイブテンプレートを確認**
   - 子テーマを作成して `archive.php` と `home.php` をカスタマイズ
   - 上記のステップ7のコードを使用

3. **キャッシュをクリア**
   - ブラウザのキャッシュをクリア
   - プラグインのキャッシュをクリア（使用している場合）

## 次のステップ

1. 子テーマを作成してカスタマイズを保護
2. カスタムCSSとJavaScriptを追加
3. 記事を投稿してテスト
4. パフォーマンス最適化
