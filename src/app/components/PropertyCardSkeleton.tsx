import { Skeleton } from '@/app/components/ui/skeleton';

/** 一覧・グリッドの1カード分のスケルトン（レイアウトシフト防止） */
export function PropertyCardSkeleton() {
  return (
    <div className="relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      {/* Image: モバイル h-64 / PC h-52 */}
      <div className="relative h-64 md:h-52 w-full overflow-hidden">
        <Skeleton className="w-full h-full rounded-none" />
      </div>
      {/* Content */}
      <div className="p-4">
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-4 w-4/5 mb-3" />
        <Skeleton className="h-6 w-24 mb-3" />
        <div className="flex gap-2 mb-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
