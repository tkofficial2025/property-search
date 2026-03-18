import { useEffect, useState } from 'react';
import { Header } from '@/app/components/Header';
import { Calendar, Tag, ArrowLeft } from 'lucide-react';
import { getBlogPostById } from '@/lib/blogPosts';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface BlogPost {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  date: string;
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      name: string;
      slug: string;
    }>>;
  };
}

interface BlogPostDetailPageProps {
  postId: number;
  onNavigate: (page: 'home' | 'buy' | 'rent' | 'consultation' | 'category' | 'blog') => void;
  onBack: () => void;
}

export function BlogPostDetailPage({ postId, onNavigate, onBack }: BlogPostDetailPageProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getBlogPostById(postId)
      .then((data) => {
        if (data) {
          setPost(data);
        } else {
          setError('記事が見つかりませんでした。');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('記事取得エラー:', err);
        setError('記事の読み込みに失敗しました。');
        setLoading(false);
      });
  }, [postId]);

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 記事の画像URLを取得
  const getFeaturedImage = (post: BlogPost) => {
    return post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
  };

  // 記事のカテゴリーを取得
  const getPostCategories = (post: BlogPost) => {
    return post._embedded?.['wp:term']?.[0] || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header onNavigate={onNavigate} currentPage="blog" />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C1121F]"></div>
            <p className="mt-4 text-sm md:text-base text-gray-600">{t('blog.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        <Header onNavigate={onNavigate} currentPage="blog" />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p className="text-sm md:text-base font-semibold">{t('blog.error')}</p>
            <p className="text-sm">{error ? t(error === 'not_found' ? 'blog.not_found' : 'blog.error_desc') : t('blog.not_found')}</p>
          </div>
          <button
            onClick={onBack}
            className="mt-6 px-4 py-2 bg-[#C1121F] text-white rounded-lg hover:bg-[#A00E1A] transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('blog.back_to_list')}
          </button>
        </div>
      </div>
    );
  }

  const featuredImage = getFeaturedImage(post);
  const postCategories = getPostCategories(post);

  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} currentPage="blog" />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* 戻るボタン */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm md:text-base text-gray-600 hover:text-gray-900 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span>{t('blog.back_to_list')}</span>
        </button>

        {/* 記事ヘッダー */}
        <header className="mb-8">
          {/* カテゴリー */}
          {postCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {postCategories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full"
                >
                  <Tag className="w-4 h-4" />
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          {/* タイトル */}
          <h1
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"
            dangerouslySetInnerHTML={{ __html: post.title.rendered }}
          />

          {/* 日付 */}
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Calendar className="w-5 h-5" />
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </div>
        </header>

        {/* アイキャッチ画像 */}
        {featuredImage && (
          <div className="mb-8">
            <img
              src={featuredImage}
              alt={post.title.rendered}
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* 記事本文 */}
        <article
          className="prose prose-sm md:prose max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content.rendered }}
          style={{
            lineHeight: '1.8',
            color: '#374151',
          }}
        />
      </div>
    </div>
  );
}
