import { type Property } from './properties';

export type SortOption = 
  | 'popularity'
  | 'price-asc'
  | 'price-desc'
  | 'size-asc'
  | 'size-desc'
  | 'walking-asc'
  | 'walking-desc'
  | 'newest'
  | 'oldest';

/**
 * 物件を並び替える
 */
export function sortProperties(properties: Property[], sortOption: SortOption): Property[] {
  const sorted = [...properties];

  switch (sortOption) {
    case 'popularity':
      // 人気順: isFeatured > isNew > id降順
      return sorted.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return b.id - a.id;
      });

    case 'price-asc':
      // 価格順（低→高）
      return sorted.sort((a, b) => a.price - b.price);

    case 'price-desc':
      // 価格順（高→低）
      return sorted.sort((a, b) => b.price - a.price);

    case 'size-asc':
      // 面積順（小→大）
      return sorted.sort((a, b) => a.size - b.size);

    case 'size-desc':
      // 面積順（大→小）
      return sorted.sort((a, b) => b.size - a.size);

    case 'walking-asc':
      // 駅近順（徒歩分数が少ない順）
      return sorted.sort((a, b) => {
        const aWalk = a.walkingMinutes || 999;
        const bWalk = b.walkingMinutes || 999;
        return aWalk - bWalk;
      });

    case 'walking-desc':
      // 駅遠順（徒歩分数が多い順）
      return sorted.sort((a, b) => {
        const aWalk = a.walkingMinutes || 0;
        const bWalk = b.walkingMinutes || 0;
        return bWalk - aWalk;
      });

    case 'newest':
      // 新着順（created_at降順、なければid降順）
      return sorted.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (a.createdAt && !b.createdAt) return -1;
        if (!a.createdAt && b.createdAt) return 1;
        return b.id - a.id;
      });

    case 'oldest':
      // 古い順（created_at昇順、なければid昇順）
      return sorted.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (a.createdAt && !b.createdAt) return -1;
        if (!a.createdAt && b.createdAt) return 1;
        return a.id - b.id;
      });

    default:
      return sorted;
  }
}

/**
 * 並び替えオプションのラベル
 */
export const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'price-asc', label: 'Price (Low to High)' },
  { value: 'price-desc', label: 'Price (High to Low)' },
  { value: 'size-asc', label: 'Size (Small to Large)' },
  { value: 'size-desc', label: 'Size (Large to Small)' },
  { value: 'walking-asc', label: 'Walking Distance (Near)' },
  { value: 'walking-desc', label: 'Walking Distance (Far)' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];
