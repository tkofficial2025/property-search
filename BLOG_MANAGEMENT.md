# ブログ記事のGitHub管理方法

WordPressの記事をGitHubで管理する方法を説明します。

## 方法1: Markdownファイルとして管理（推奨）

記事をMarkdownファイルとして`content/blog/`フォルダに保存し、ビルド時に読み込みます。

### メリット
- ✅ GitHubでバージョン管理できる
- ✅ Markdownで書きやすい
- ✅ ローカルWordPress不要
- ✅ デプロイ時に自動的にビルドに含まれる

### 実装手順

1. **Markdownファイルの構造**
   ```
   content/blog/
   ├── 2024-01-15-tokyo-expat-housing-guide.md
   ├── 2024-01-20-investment-tips.md
   └── ...
   ```

2. **Markdownファイルのフォーマット**
   ```markdown
   ---
   title: "Tokyo Expat Housing Guide"
   date: "2024-01-15"
   category: "Guide"
   featuredImage: "/blog-images/tokyo-expat-housing.jpg"
   ---

   # Tokyo Expat Housing Guide

   記事の本文をここに書きます...
   ```

3. **ビルド時にMarkdownを読み込む**
   - ViteプラグインまたはカスタムスクリプトでMarkdownをパース
   - JSONファイルとして出力、または直接Reactコンポーネントで読み込み

---

## 方法2: JSONファイルとして管理

WordPressから記事をエクスポートしてJSONファイルとして管理します。

### メリット
- ✅ WordPressの既存記事をそのまま移行できる
- ✅ 構造が明確
- ✅ 簡単に実装できる

### 実装手順

1. **WordPressから記事をエクスポート**
   - WordPress REST APIから記事を取得
   - JSONファイルとして保存

2. **JSONファイルの構造**
   ```json
   {
     "posts": [
       {
         "id": 1,
         "title": "Tokyo Expat Housing Guide",
         "date": "2024-01-15",
         "category": "Guide",
         "content": "...",
         "featuredImage": "/blog-images/tokyo-expat-housing.jpg"
       }
     ]
   }
   ```

3. **Reactアプリで読み込む**
   - `public/blog-posts.json`に配置
   - ビルド時に読み込み

---

## 方法3: GitHub Actionsで自動取得

GitHub ActionsでWordPressから記事を自動取得してビルドに含めます。

### メリット
- ✅ WordPressで記事を書ける
- ✅ GitHubで管理される
- ✅ 自動化できる

### 実装手順

1. **GitHub Actionsワークフローを作成**
   - WordPress REST APIから記事を取得
   - JSONファイルとしてコミット

2. **ビルド時にJSONを読み込む**
   - ビルドプロセスでJSONを読み込み

---

## 推奨: 方法1（Markdownファイル）

最もシンプルで、Git管理に適しています。
