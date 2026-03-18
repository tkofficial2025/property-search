import type { Property } from './properties';
import { filterPropertiesByAreas } from './wards';

/** ヒーロー検索で渡すパラメータ（QuickPropertySearch → App → Buy/Rent） */
export interface HeroSearchParams {
  propertyType: 'rent' | 'buy';
  selectedAreas: string[];
  budget: string;
  bedroomCount: string;
  sizeMin?: number;
  sizeMax?: number;
  keyword?: string;
  /** Advanced filters（ヒーローでチェックした条件） */
  luxury?: boolean;
  petFriendly?: boolean;
  foreignFriendly?: boolean;
  furnished?: boolean;
  highRiseResidence?: boolean;
  noKeyMoney?: boolean;
  forStudents?: boolean;
  designers?: boolean;
  forFamilies?: boolean;
}

/** 予算文字列を [min, max] 円に変換（buy: 百万円、rent: 円/月） */
function parseBudgetRange(budget: string, type: 'rent' | 'buy'): [number, number] | null {
  if (!budget.trim()) return null;
  if (type === 'buy') {
    // 0-50m, 50m-80m, 80m-120m, 120m-200m, 200m+
    const m = 1_000_000;
    if (budget === '0-50m') return [0, 50 * m];
    if (budget === '50m-80m') return [50 * m, 80 * m];
    if (budget === '80m-120m') return [80 * m, 120 * m];
    if (budget === '120m-200m') return [120 * m, 200 * m];
    if (budget === '200m+') return [200 * m, Infinity];
  } else {
    // 0-150k, 150k-250k, 250k-400k, 400k-600k, 600k+
    const k = 1000;
    if (budget === '0-150k') return [0, 150 * k];
    if (budget === '150k-250k') return [150 * k, 250 * k];
    if (budget === '250k-400k') return [250 * k, 400 * k];
    if (budget === '400k-600k') return [400 * k, 600 * k];
    if (budget === '600k+') return [600 * k, Infinity];
  }
  return null;
}

/** 寝室条件を最小ベッド数に（studio=0, 1br=1, 2br=2, 3br=3, 4br+=4） */
function minBedsForBedroomOption(bedroomCount: string): number | null {
  if (!bedroomCount.trim()) return null;
  if (bedroomCount === 'studio') return 0;
  if (bedroomCount === '1br') return 1;
  if (bedroomCount === '2br') return 2;
  if (bedroomCount === '3br') return 3;
  if (bedroomCount === '4br+') return 4;
  return null;
}

function matchesBedrooms(property: Property, minBeds: number): boolean {
  // studio = 0 or 1 bed
  if (minBeds === 0) return property.beds <= 1;
  return property.beds >= minBeds;
}

/**
 * ヒーロー検索パラメータで物件一覧をフィルタ
 */
export function filterPropertiesByHeroParams(
  properties: Property[],
  params: HeroSearchParams | null | undefined,
  type: 'rent' | 'buy'
): Property[] {
  if (!params || params.propertyType !== type) return properties;

  let list = properties;

  if (params.selectedAreas.length > 0) {
    list = filterPropertiesByAreas(list, new Set(params.selectedAreas));
  }

  const budgetRange = parseBudgetRange(params.budget, type);
  if (budgetRange) {
    const [min, max] = budgetRange;
    list = list.filter((p) => p.price >= min && p.price <= max);
  }

  const minBeds = minBedsForBedroomOption(params.bedroomCount);
  if (minBeds !== null) {
    list = list.filter((p) => matchesBedrooms(p, minBeds));
  }

  if (params.sizeMin != null && params.sizeMin > 0) {
    list = list.filter((p) => p.size >= params.sizeMin!);
  }
  if (params.sizeMax != null && params.sizeMax > 0) {
    list = list.filter((p) => p.size <= params.sizeMax!);
  }

  if (params.petFriendly) list = list.filter((p) => p.petFriendly === true);
  if (params.foreignFriendly) list = list.filter((p) => p.foreignFriendly === true);
  if (params.luxury) list = list.filter((p) => p.isFeatured === true);
  if (params.furnished) {
    list = list.filter((p) => {
      const t = (p.title ?? '').toLowerCase();
      return t.includes('furnished') || t.includes('家具付き');
    });
  }
  if (params.highRiseResidence) list = list.filter((p) => (p.floor ?? 0) >= 5);
  if (params.noKeyMoney) list = list.filter((p) => p.keyMoney != null && p.keyMoney === 0);
  if (params.forStudents) {
    list = list.filter((p) => {
      const t = (p.title ?? '').toLowerCase();
      return t.includes('student') || t.includes('学生');
    });
  }
  if (params.designers) {
    list = list.filter((p) => {
      const t = (p.title ?? '').toLowerCase();
      return t.includes('design') || t.includes('デザイナー');
    });
  }
  if (params.forFamilies) {
    list = list.filter((p) => {
      const t = (p.title ?? '').toLowerCase();
      return t.includes('family') || t.includes('家族') || (p.beds ?? 0) >= 2;
    });
  }

  // キーワードは Rent/Buy 一覧側で実施（中国語 title_zh/address_zh を参照するため）
  // params.keyword は initialSearchParams 経由で searchQuery に渡され一覧でフィルタされる

  return list;
}
