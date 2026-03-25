import type { Property } from './properties';
import { filterPropertiesByAreas } from './wards';

/** ヒーロー検索で渡すパラメータ（QuickPropertySearch → App → Buy） */
export interface HeroSearchParams {
  propertyType: 'buy';
  selectedAreas: string[];
  propertyCategories?: string[];
  regions?: string[];
  priceBand?: string;
  updatedWithin?: string;
  capRate?: string;
  buildingAge?: string;
  rights?: string[];
  landTypes?: string[];
  zoningTypes?: string[];
  planningAreas?: string[];
  stationDistance?: string;
  buildingAreaMin?: number;
  buildingAreaMax?: number;
  buildingAreaUnit?: 'sqm' | 'tsubo';
  landAreaMin?: number;
  landAreaMax?: number;
  landAreaUnit?: 'sqm' | 'tsubo';
  keyword?: string;
}

const TSUBO_TO_SQM = 3.305785;

function toSquareMeter(value: number, unit: 'sqm' | 'tsubo' = 'sqm'): number {
  return unit === 'tsubo' ? value * TSUBO_TO_SQM : value;
}

function parsePriceBand(priceBand?: string): [number, number] | null {
  if (!priceBand) return null;
  const oku = 100_000_000;
  if (priceBand === 'up-to-10') return [0, 10 * oku];
  if (priceBand === '10-50') return [10 * oku, 50 * oku];
  if (priceBand === '50-100') return [50 * oku, 100 * oku];
  if (priceBand === '100-plus') return [100 * oku, Infinity];
  if (priceBand === 'negotiable') return null;
  return null;
}

function includesAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

function matchesPropertyCategory(property: Property, categories: string[]): boolean {
  const hay = `${property.title} ${property.propertyInformation ?? ''}`.toLowerCase();
  const CATEGORY_KEYWORDS: Record<string, string[]> = {
    bldg: ['ビル', '一棟', 'building'],
    room: ['一室', '区分', 'フロア', 'マンション'],
    hotel: ['ホテル', '旅館', 'hotel', 'inn'],
    land: ['土地', '事業用地', '用地'],
    apartment: ['アパート', '収益アパート', 'apartment'],
    golf: ['ゴルフ', 'golf'],
    medical: ['病院', '医療', 'クリニック', 'hospital', 'medical'],
  };
  return categories.some((c) => includesAny(hay, CATEGORY_KEYWORDS[c] ?? []));
}

function matchesRegion(address: string, regions: string[]): boolean {
  const a = (address ?? '').toLowerCase();
  const REGION_KEYWORDS: Record<string, string[]> = {
    tokyo23: ['東京都', '東京'],
    'tokyo-other': ['八王子', '立川', '町田', '多摩', '調布'],
    osaka: ['大阪'],
    kyoto: ['京都'],
    'domestic-other': ['神奈川', '埼玉', '千葉', '名古屋', '福岡', '北海道', '沖縄'],
    overseas: ['海外', 'singapore', 'london', 'new york', 'dubai', 'hong kong'],
  };
  return regions.some((r) => includesAny(a, (REGION_KEYWORDS[r] ?? []).map((w) => w.toLowerCase())));
}

function matchesUpdatedWithin(property: Property, updatedWithin?: string): boolean {
  if (!updatedWithin || updatedWithin === 'all') return true;
  const source = property.createdAt;
  if (!source) return true;
  const ts = new Date(source).getTime();
  if (Number.isNaN(ts)) return true;
  const diffDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
  if (updatedWithin === '1w') return diffDays <= 7;
  if (updatedWithin === '1m') return diffDays <= 31;
  if (updatedWithin === '3m') return diffDays <= 93;
  return true;
}

function matchesWalkDistance(property: Property, stationDistance?: string): boolean {
  if (!stationDistance || stationDistance === 'any') return true;
  const w = property.walkingMinutes ?? 0;
  if (stationDistance === '1m') return w <= 1;
  if (stationDistance === '5m') return w <= 5;
  if (stationDistance === '10m') return w <= 10;
  if (stationDistance === 'bus') return w > 10;
  return true;
}

/**
 * ヒーロー検索パラメータで物件一覧をフィルタ
 */
export function filterPropertiesByHeroParams(
  properties: Property[],
  params: HeroSearchParams | null | undefined,
  type: 'buy'
): Property[] {
  if (!params || params.propertyType !== type) return properties;

  let list = properties;

  if (params.keyword && params.keyword.trim()) {
    const q = params.keyword.trim().toLowerCase();
    list = list.filter((p) => {
      const hay = `${p.title ?? ''} ${p.address ?? ''} ${p.station ?? ''} ${p.propertyInformation ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }

  if (params.selectedAreas.length > 0) {
    list = filterPropertiesByAreas(list, new Set(params.selectedAreas));
  }

  if (params.propertyCategories && params.propertyCategories.length > 0) {
    list = list.filter((p) => matchesPropertyCategory(p, params.propertyCategories!));
  }

  if (params.regions && params.regions.length > 0) {
    list = list.filter((p) => matchesRegion(p.address, params.regions!));
  }

  const budgetRange = parsePriceBand(params.priceBand);
  if (budgetRange) {
    const [min, max] = budgetRange;
    list = list.filter((p) => p.price >= min && p.price <= max);
  }

  list = list.filter((p) => matchesUpdatedWithin(p, params.updatedWithin));
  list = list.filter((p) => matchesWalkDistance(p, params.stationDistance));

  if (params.buildingAreaMin != null && params.buildingAreaMin > 0) {
    list = list.filter((p) => p.size >= toSquareMeter(params.buildingAreaMin!, params.buildingAreaUnit));
  }
  if (params.buildingAreaMax != null && params.buildingAreaMax > 0) {
    list = list.filter((p) => p.size <= toSquareMeter(params.buildingAreaMax!, params.buildingAreaUnit));
  }
  if (params.landAreaMin != null && params.landAreaMin > 0) {
    list = list.filter((p) => p.size >= toSquareMeter(params.landAreaMin!, params.landAreaUnit));
  }
  if (params.landAreaMax != null && params.landAreaMax > 0) {
    list = list.filter((p) => p.size <= toSquareMeter(params.landAreaMax!, params.landAreaUnit));
  }

  const textFilters = [
    ...(params.capRate ? [params.capRate] : []),
    ...(params.buildingAge ? [params.buildingAge] : []),
    ...(params.rights ?? []),
    ...(params.landTypes ?? []),
    ...(params.zoningTypes ?? []),
    ...(params.planningAreas ?? []),
  ];
  if (textFilters.length > 0) {
    list = list.filter((p) => {
      const hay = `${p.title} ${p.propertyInformation ?? ''}`.toLowerCase();
      return textFilters.some((token) => hay.includes(String(token).toLowerCase()));
    });
  }

  return list;
}
