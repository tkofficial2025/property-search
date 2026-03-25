import { Header } from '@/app/components/Header';
import { Skeleton } from '@/app/components/ui/skeleton';

interface PropertyDetailPageSkeletonProps {
  onNavigate?: (page: 'home' | 'buy') => void;
  currentPage?: 'buy';
}

/** 物件詳細ページのレイアウトに合わせたスケルトン（チラつき防止） */
export function PropertyDetailPageSkeleton({ onNavigate, currentPage = 'buy' }: PropertyDetailPageSkeletonProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} currentPage={currentPage} />

      <div className="max-w-7xl mx-auto px-6 pt-10 pb-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Image area - モバイル: 1枚 / デスクトップ: メイン+3枚 */}
            <div className="space-y-2">
              <div className="md:hidden relative aspect-[16/10] rounded-xl overflow-hidden">
                <Skeleton className="w-full h-full rounded-xl" />
              </div>
              <div className="hidden md:grid grid-cols-4 gap-2">
                <div className="col-span-3 aspect-[16/10] rounded-xl overflow-hidden">
                  <Skeleton className="w-full h-full rounded-xl" />
                </div>
                <div className="col-span-1 grid grid-rows-3 gap-2">
                  <Skeleton className="w-full rounded-lg min-h-[80px]" />
                  <Skeleton className="w-full rounded-lg min-h-[80px]" />
                  <Skeleton className="w-full rounded-lg min-h-[80px]" />
                </div>
              </div>
            </div>

            {/* Address */}
            <Skeleton className="h-5 w-3/4 max-w-md" />

            {/* Title + favorite */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <Skeleton className="h-9 w-64 md:w-96" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>

            {/* Station */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-5 w-40" />
            </div>

            {/* Specs card */}
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
              <div className="grid grid-cols-2 gap-x-4 md:gap-x-8 gap-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex justify-between items-center gap-2 py-2 border-b border-gray-100">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>

            {/* CTA block placeholder */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Skeleton className="h-12 flex-1 rounded-xl" />
              <Skeleton className="h-12 flex-1 rounded-xl" />
            </div>
          </div>

          {/* Right column - CTA card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
