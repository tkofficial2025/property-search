import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogDir = path.join(__dirname, '../content/blog');
const outputFile = path.join(__dirname, '../public/blog-posts.json');

// Markdownファイルを読み込んでJSONに変換
function generateBlogPosts() {
  const files = fs.readdirSync(blogDir).filter(
    (file) => file.endsWith('.md') && file !== 'README.md'
  );
  const posts = [];

  for (const file of files) {
    const filePath = path.join(blogDir, file);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    // MarkdownをHTMLに変換
    const processedContent = remark().use(html).processSync(content);
    const htmlContent = processedContent.toString();

    posts.push({
      id: posts.length + 1,
      title: {
        rendered: data.title || '',
      },
      content: {
        rendered: htmlContent,
      },
      excerpt: {
        rendered: content.substring(0, 150) + '...',
      },
      date: data.date || new Date().toISOString(),
      category: data.category || 'Uncategorized',
      featuredImage: data.featuredImage || null,
      slug: file.replace('.md', ''),
    });
  }

  // 日付でソート（新しい順）
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // JSONファイルとして出力
  fs.writeFileSync(outputFile, JSON.stringify({ posts }, null, 2));
  console.log(`✅ ${posts.length}件の記事を生成しました: ${outputFile}`);
}

generateBlogPosts();
