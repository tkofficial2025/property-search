import type { Property } from './properties';
import { filterPropertiesByAreas } from './wards';

/** ヒーロー検索で渡すパラメータ（QuickPropertySearch → App → Buy） */
export interface HeroSearchParams {
  propertyType: 'buy';
  selectedAreas: string[];
  propertyCategories?: string[];
  regions?: string[];
  priceBand?: string;
  minPriceOku?: number;
  maxPriceOku?: number;
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
  // DB に正規化カテゴリがあれば最優先で使う
  if (property.propertyCategory && categories.includes(property.propertyCategory)) {
    return true;
  }
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

function propertyHaystack(p: Property): string {
  return [p.title, p.propertyInformation, p.rights, p.landType, p.zoning, p.planningArea]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/** DBの cap_rate または備考・特記の文言から利回り%を推定 */
function resolvedCapRatePercent(p: Property): number | null {
  if (p.capRate != null && Number.isFinite(p.capRate)) return p.capRate;
  const t = p.propertyInformation ?? '';
  const m =
    t.match(/(?:表面|想定|満室時|実質|現行)?利回り[：:\s]*([0-9]+(?:\.[0-9]+)?)/i) ||
    t.match(/利回り[：:\s]*([0-9]+(?:\.[0-9]+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

function mentionsCapRateLoosely(p: Property): boolean {
  return /利回り/.test(p.propertyInformation ?? '');
}

function resolvedBuildingAgeYears(p: Property): number | null {
  const t = p.propertyInformation ?? '';
  const m =
    t.match(/築年数[：:\s]*([0-9]{1,3})/) ||
    t.match(/築\s*([0-9]{1,3})\s*年/) ||
    t.match(/築([0-9]{1,3})\s*年/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

function mentionsBuildingLoosely(p: Property): boolean {
  return /築\s*[0-9]|築年数|築年月|竣工|新築/.test(p.propertyInformation ?? '');
}

function matchesCapRateFilter(p: Property, capRate: string): boolean {
  const v = resolvedCapRatePercent(p);
  if (capRate === 'none') return v == null && !mentionsCapRateLoosely(p);
  if (v == null) return false;
  if (capRate === 'up-to-5') return v <= 5;
  if (capRate === '5-7') return v > 5 && v <= 7;
  if (capRate === '7-10') return v > 7 && v <= 10;
  if (capRate === '10-plus') return v > 10;
  return true;
}

function matchesBuildingAgeFilter(p: Property, buildingAge: string): boolean {
  const band = p.buildingAgeBand?.trim();
  if (band && band === buildingAge) return true;
  const age = resolvedBuildingAgeYears(p);
  const hay = propertyHaystack(p);
  if (buildingAge === 'unknown') {
    return !band && age == null && !mentionsBuildingLoosely(p);
  }
  if (buildingAge === 'no-building') {
    return band === 'no-building' || includesAny(hay, ['土地のみ', '建物なし', '更地', '未建築']);
  }
  if (age == null) return false;
  if (buildingAge === 'new-5') return age <= 5;
  if (buildingAge === '6-10') return age >= 6 && age <= 10;
  if (buildingAge === '11-20') return age >= 11 && age <= 20;
  if (buildingAge === '21-30') return age >= 21 && age <= 30;
  if (buildingAge === '31-plus') return age >= 31;
  return true;
}

const RIGHTS_KEYWORDS: Record<string, string[]> = {
  'full-ownership': ['所有権', '完全所有'],
  leasehold: ['借地', '賃借権', '地上権', '定期借地'],
  'bare-land': ['底地'],
  'condo-ownership': ['区分所有'],
  shared: ['共有', '持分'],
};

const LAND_KEYWORDS: Record<string, string[]> = {
  residential: ['宅地'],
  farm: ['田', '畑', '農地'],
  forest: ['山林', '原野'],
  misc: ['雑種地'],
  other: [],
};

const ZONING_KEYWORDS: Record<string, string[]> = {
  'residential-low': ['第一種低層住居専用'],
  'residential-mid': ['第一種中高層住居専用'],
  'residential-1': ['第一種住居地域'],
  'semi-residential': ['準住居地域'],
  'neighborhood-commercial': ['近隣商業地域'],
  commercial: ['商業地域'],
  'semi-industrial': ['準工業地域'],
  industrial: ['工業地域'],
  'industrial-exclusive': ['工業専用地域'],
  unspecified: ['未指定'],
};

const PLANNING_KEYWORDS: Record<string, string[]> = {
  urbanized: ['市街化区域'],
  'urbanization-control': ['市街化調整区域'],
  'non-zoned': ['非線引き'],
};

function matchesKeywordCode(p: Property, code: string, map: Record<string, string[]>): boolean {
  const kws = map[code];
  const hay = propertyHaystack(p);
  if (!kws?.length) {
    if (code === 'other') return includesAny(hay, ['その他', '他']);
    return false;
  }
  return includesAny(hay, kws.map((w) => w.toLowerCase()));
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
      const hay = `${p.title ?? ''} ${p.address ?? ''} ${p.station ?? ''} ${p.propertyInformation ?? ''} ${p.rights ?? ''} ${p.landType ?? ''} ${p.zoning ?? ''} ${p.planningArea ?? ''} ${p.capRate != null ? String(p.capRate) : ''} ${p.buildingAgeBand ?? ''} ${p.landAreaSqm != null ? String(p.landAreaSqm) : ''}`.toLowerCase();
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
  if (params.minPriceOku != null && params.minPriceOku >= 0) {
    list = list.filter((p) => p.price >= params.minPriceOku! * 100_000_000);
  }
  if (params.maxPriceOku != null && params.maxPriceOku >= 0) {
    list = list.filter((p) => p.price <= params.maxPriceOku! * 100_000_000);
  }

  list = list.filter((p) => matchesUpdatedWithin(p, params.updatedWithin));
  list = list.filter((p) => matchesWalkDistance(p, params.stationDistance));

  if (params.buildingAreaMin != null && params.buildingAreaMin > 0) {
    list = list.filter((p) => p.size >= toSquareMeter(params.buildingAreaMin!, params.buildingAreaUnit));
  }
  if (params.buildingAreaMax != null && params.buildingAreaMax > 0) {
    list = list.filter((p) => p.size <= toSquareMeter(params.buildingAreaMax!, params.buildingAreaUnit));
  }
  const landSqm = (p: Property) => p.landAreaSqm ?? p.size;
  if (params.landAreaMin != null && params.landAreaMin > 0) {
    list = list.filter((p) => landSqm(p) >= toSquareMeter(params.landAreaMin!, params.landAreaUnit));
  }
  if (params.landAreaMax != null && params.landAreaMax > 0) {
    list = list.filter((p) => landSqm(p) <= toSquareMeter(params.landAreaMax!, params.landAreaUnit));
  }

  if (params.capRate) {
    list = list.filter((p) => matchesCapRateFilter(p, params.capRate!));
  }
  if (params.buildingAge) {
    list = list.filter((p) => matchesBuildingAgeFilter(p, params.buildingAge!));
  }
  if (params.rights && params.rights.length > 0) {
    list = list.filter((p) => params.rights!.some((code) => matchesKeywordCode(p, code, RIGHTS_KEYWORDS)));
  }
  if (params.landTypes && params.landTypes.length > 0) {
    list = list.filter((p) => params.landTypes!.some((code) => matchesKeywordCode(p, code, LAND_KEYWORDS)));
  }
  if (params.zoningTypes && params.zoningTypes.length > 0) {
    list = list.filter((p) => params.zoningTypes!.some((code) => matchesKeywordCode(p, code, ZONING_KEYWORDS)));
  }
  if (params.planningAreas && params.planningAreas.length > 0) {
    list = list.filter((p) => params.planningAreas!.some((code) => matchesKeywordCode(p, code, PLANNING_KEYWORDS)));
  }

  return list;
}
