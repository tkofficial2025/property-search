import type { BlogPost } from '@/app/pages/BlogPage';

interface BlogPostsData {
  posts: Array<{
    id: number;
    title: { rendered: string };
    content: { rendered: string };
    excerpt: { rendered: string };
    date: string;
    category: string;
    featuredImage: string | null;
    slug: string;
  }>;
}

let cachedPosts: BlogPost[] | null = null;

export async function getBlogPosts(): Promise<BlogPost[]> {
  // キャッシュがあれば返す
  if (cachedPosts) {
    return cachedPosts;
  }

  try {
    const response = await fetch('/blog-posts.json');
    if (!response.ok) {
      throw new Error('Failed to fetch blog posts');
    }
    const data: BlogPostsData = await response.json();

    // WordPress API形式に変換
    cachedPosts = data.posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      date: post.date,
      link: `/blog/${post.slug}`,
      featured_media: 0,
      _embedded: {
        'wp:featuredmedia': post.featuredImage
          ? [{ source_url: post.featuredImage }]
          : undefined,
        'wp:term': [
          [
            {
              id: 0,
              name: post.category,
              slug: post.category.toLowerCase().replace(/\s+/g, '-'),
            },
          ],
        ],
      },
    }));

    return cachedPosts;
  } catch (error) {
    console.error('Error loading blog posts:', error);
    return [];
  }
}

export async function getBlogPostById(id: number): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  return posts.find((post) => post.id === id) || null;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  return posts.find((post) => post.link === `/blog/${slug}`) || null;
}
