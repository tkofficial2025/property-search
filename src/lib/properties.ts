import { toDirectImageUrl } from './propertyImageUrl';
import { formatJpyPriceDisplay } from './formatJpyPrice';

/**
 * Supabase の properties テーブルから返る行（snake_case）
 */
export interface SupabasePropertyRow {
  id: number;
  title: string;
  address: string;
  price: number;
  beds: number;
  size: number;
  layout: string;
  image: string;
  station: string;
  walking_minutes: number;
  type: 'rent' | 'buy';
  is_featured: boolean | null;
  is_new: boolean | null;
  created_at?: string;
  // 追加項目（Supabase で登録可能）
  pet_friendly?: boolean | null;
  foreign_friendly?: boolean | null;
  floor?: number | null;
  balcony?: boolean | null;
  bicycle_parking?: boolean | null;
  delivery_box?: boolean | null;
  elevator?: boolean | null;
  south_facing?: boolean | null;
  images?: string[] | null;
  management_fee?: number | null;
  deposit?: number | null;
  key_money?: number | null;
  initial_fees_credit_card?: boolean | null;
  property_information?: string | null;
  /** Storage `property-pdfs` バケット内パス */
  source_pdf_path?: string | null;
  property_category?: string | null;
  cap_rate?: number | null;
  building_age_band?: string | null;
  /** ダッシュボード等のレガシー text[] と、マイグレーション追加の text の両方があり得る */
  rights_relation?: string[] | null;
  land_category?: string[] | null;
  zoning_types?: string[] | null;
  planning_areas?: string[] | null;
  rights?: string | null;
  land_type?: string | null;
  zoning?: string | null;
  planning_area?: string | null;
  building_area_sqm?: number | null;
  land_area_sqm?: number | null;
}

/**
 * 一覧・詳細で使う物件型（camelCase）
 */
export interface Property {
  id: number;
  title: string;
  address: string;
  price: number;
  beds: number;
  size: number;
  layout: string;
  image: string;
  station: string;
  walkingMinutes: number;
  type: 'rent' | 'buy';
  isFeatured?: boolean;
  isNew?: boolean;
  createdAt?: string;
  petFriendly?: boolean;
  foreignFriendly?: boolean;
  floor?: number;
  balcony?: boolean;
  bicycleParking?: boolean;
  deliveryBox?: boolean;
  elevator?: boolean;
  southFacing?: boolean;
  images?: string[];
  managementFee?: number;
  deposit?: number;
  keyMoney?: number;
  initialFeesCreditCard?: boolean;
  propertyInformation?: string;
  latitude?: number;
  longitude?: number;
  /** PDF 取り込み時に保存した元ファイル（Storage パス） */
  sourcePdfPath?: string | null;
  propertyCategory?: string;
  capRate?: number;
  /** 築年バンド（フィルタ値と同一キー推奨） */
  buildingAgeBand?: string;
  rights?: string;
  landType?: string;
  zoning?: string;
  planningArea?: string;
  /** DB の land_area_sqm（㎡）。無い場合は土地面積フィルタで size にフォールバック */
  landAreaSqm?: number;
}

/**
 * 一覧カード等で使う画像URL（先頭から利用）。`images` に有効なURLがあればその順、なければ空でない `image` のみ。
 */
export function getListingCardImageUrls(property: Pick<Property, 'image' | 'images'>): string[] {
  if (property.images && property.images.length > 0) {
    const filtered = property.images.filter((u): u is string => typeof u === 'string' && u.trim() !== '');
    if (filtered.length > 0) return filtered;
  }
  if (typeof property.image === 'string' && property.image.trim() !== '') {
    return [property.image.trim()];
  }
  return [];
}

/**
 * DB の text[]（rights_relation 等）を優先し、無ければ text スカラ（rights 等）を使う
 */
export function pickTextFromArrayOrScalar(
  row: Record<string, unknown>,
  arrayKey: string,
  scalarKey: string,
): string | undefined {
  const arr = row[arrayKey];
  if (Array.isArray(arr) && arr.length > 0) {
    const s = (arr as unknown[])
      .map((x) => String(x ?? '').trim())
      .filter(Boolean)
      .join(' ');
    if (s) return s;
  }
  const v = row[scalarKey];
  if (v != null && String(v).trim() !== '') return String(v).trim();
  return undefined;
}

const PROPERTIES_WRITE_WHITELIST = new Set([
  'title',
  'address',
  'type',
  'station',
  'layout',
  'image',
  'images',
  'price',
  'beds',
  'size',
  'building_area_sqm',
  'walking_minutes',
  'floor',
  'management_fee',
  'deposit',
  'key_money',
  'latitude',
  'longitude',
  'pet_friendly',
  'foreign_friendly',
  'elevator',
  'delivery_box',
  'balcony',
  'bicycle_parking',
  'south_facing',
  'initial_fees_credit_card',
  'is_featured',
  'is_new',
  'property_category',
  'region_group',
  'cap_rate',
  'building_age_band',
  'property_information',
  'rights_relation',
  'land_category',
  'zoning_types',
  'planning_areas',
  'land_area_sqm',
  'source_pdf_path',
]);

/** `properties` への insert/update 用。DB に無い列（land_type 等）が混ざらないようホワイトリストで絞る */
export function sanitizePropertiesWritePayload(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (PROPERTIES_WRITE_WHITELIST.has(k)) out[k] = v;
  }
  return out;
}

/** 行オブジェクトから値を取得（snake_case / camelCase 両対応） */
function get(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

/** "5分" や 5 を数値に変換 */
function toNumber(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const s = String(v ?? '').replace(/\D/g, '');
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Supabase の行をフロント用の Property に変換（DB のカラム名の揺れに対応）
 */
function toBool(v: unknown): boolean {
  if (v === true || v === 'true' || v === 1) return true;
  return false;
}

function toOptionalNumber(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

/** images を配列に正規化（PostgREST の text[] / JSON 文字列 / 単一 URL に対応） */
function normalizeImages(imagesRaw: unknown): string[] {
  if (Array.isArray(imagesRaw)) {
    return (imagesRaw as unknown[]).map((x) => String(x ?? '').trim()).filter(Boolean);
  }
  if (typeof imagesRaw === 'string' && imagesRaw.trim()) {
    try {
      const parsed = JSON.parse(imagesRaw) as unknown;
      if (Array.isArray(parsed)) return (parsed as unknown[]).map((x) => String(x ?? '').trim()).filter(Boolean);
      return [imagesRaw.trim()];
    } catch {
      return [imagesRaw.trim()];
    }
  }
  return [];
}

export function mapSupabaseRowToProperty(row: SupabasePropertyRow | Record<string, unknown>): Property {
  const r = row as Record<string, unknown>;
  const imagesRaw = get(r, 'images');
  const images = normalizeImages(imagesRaw);
  const imageRaw = get(r, 'image');
  const imageStr = imageRaw != null && imageRaw !== '' ? String(imageRaw).trim() : '';
  const typeVal = String(get(r, 'type') ?? 'rent').toLowerCase();
  const type = (typeVal === 'rent' || typeVal === 'buy') ? typeVal as 'rent' | 'buy' : 'rent';
  return {
    id: Number(get(r, 'id') ?? 0),
    title: String(get(r, 'title') ?? ''),
    address: String(get(r, 'address') ?? ''),
    price: Number(get(r, 'price') ?? 0),
    beds: Number(get(r, 'beds') ?? 0),
    size: Number(get(r, 'size', 'building_area_sqm') ?? 0),
    layout: String(get(r, 'layout') ?? ''),
    image: toDirectImageUrl(imageStr || (images[0] ?? '')),
    station: String(get(r, 'station') ?? ''),
    walkingMinutes: toNumber(get(r, 'walking_minutes', 'walkingMinutes')),
    type,
    isFeatured: Boolean(get(r, 'is_featured', 'isFeatured') ?? false),
    isNew: Boolean(get(r, 'is_new', 'isNew') ?? false),
    createdAt: get(r, 'created_at', 'createdAt') ? String(get(r, 'created_at', 'createdAt')) : undefined,
    petFriendly: toBool(get(r, 'pet_friendly', 'petFriendly')),
    foreignFriendly: toBool(get(r, 'foreign_friendly', 'foreignFriendly')),
    floor: toOptionalNumber(get(r, 'floor')),
    balcony: toBool(get(r, 'balcony')),
    bicycleParking: toBool(get(r, 'bicycle_parking', 'bicycleParking')),
    deliveryBox: toBool(get(r, 'delivery_box', 'deliveryBox')),
    elevator: toBool(get(r, 'elevator')),
    southFacing: toBool(get(r, 'south_facing', 'southFacing')),
    images: (() => {
      if (images.length === 0) return undefined;
      const usedFirstForMain = !imageStr && images.length > 0;
      const rest = usedFirstForMain ? images.slice(1) : images;
      return rest.length > 0 ? rest.map(toDirectImageUrl) : undefined;
    })(),
    managementFee: toOptionalNumber(get(r, 'management_fee', 'managementFee')),
    deposit: toOptionalNumber(get(r, 'deposit')),
    keyMoney: toOptionalNumber(get(r, 'key_money', 'keyMoney')),
    initialFeesCreditCard: toBool(get(r, 'initial_fees_credit_card', 'initialFeesCreditCard')),
    propertyInformation: get(r, 'property_information', 'propertyInformation') != null ? String(get(r, 'property_information', 'propertyInformation')) : undefined,
    latitude: toOptionalNumber(get(r, 'latitude')),
    longitude: toOptionalNumber(get(r, 'longitude')),
    sourcePdfPath: (() => {
      const v = get(r, 'source_pdf_path', 'sourcePdfPath');
      if (v == null || String(v).trim() === '') return undefined;
      return String(v);
    })(),
    propertyCategory: (() => {
      const v = get(r, 'property_category', 'propertyCategory');
      if (v == null || String(v).trim() === '') return undefined;
      return String(v).trim();
    })(),
    capRate: toOptionalNumber(get(r, 'cap_rate', 'capRate')),
    buildingAgeBand: (() => {
      const v = get(r, 'building_age_band', 'buildingAgeBand');
      if (v == null || String(v).trim() === '') return undefined;
      return String(v).trim();
    })(),
    rights: pickTextFromArrayOrScalar(r, 'rights_relation', 'rights'),
    landType: pickTextFromArrayOrScalar(r, 'land_category', 'land_type'),
    zoning: pickTextFromArrayOrScalar(r, 'zoning_types', 'zoning'),
    planningArea: pickTextFromArrayOrScalar(r, 'planning_areas', 'planning_area'),
    landAreaSqm: toOptionalNumber(get(r, 'land_area_sqm', 'landAreaSqm')),
  };
}

/**
 * カルーセル用の物件型（価格・サイズは表示用文字列）
 */
export interface FeaturedProperty {
  id: number;
  title: string;
  location: string;
  /** 表示用文字列（レガシー） */
  price: string;
  /** 円建て価格（通貨変換用） */
  priceYen: number;
  type: 'Rent' | 'Buy';
  image: string;
  beds: number;
  baths: number;
  size: string;
  station?: string;
  walkingMinutes?: number;
}

/**
 * Supabase の行をカルーセル用の FeaturedProperty に変換（DB のカラム名の揺れに対応）
 */
export function mapSupabaseRowToFeaturedProperty(row: SupabasePropertyRow | Record<string, unknown>): FeaturedProperty {
  const r = row as Record<string, unknown>;
  const typeVal = String(get(r, 'type') ?? 'rent').toLowerCase();
  const type = typeVal === 'rent' ? 'Rent' : 'Buy';
  const price = Number(get(r, 'price') ?? 0);
  const priceStr = formatJpyPriceDisplay(price, typeVal === 'rent' ? 'rent' : 'buy');
  const pdfPathRaw = get(r, 'source_pdf_path', 'sourcePdfPath');
  const sourcePdfPath = pdfPathRaw != null && String(pdfPathRaw).trim() !== '' ? String(pdfPathRaw) : undefined;
  return {
    id: Number(get(r, 'id') ?? 0),
    title: String(get(r, 'title') ?? ''),
    location: String(get(r, 'address') ?? ''),
    price: priceStr,
    priceYen: price,
    type,
    image: String(get(r, 'image') ?? ''),
    beds: Number(get(r, 'beds') ?? 0),
    baths: 1,
    size: `${Number(get(r, 'size', 'building_area_sqm') ?? 0)}㎡`,
    station: String(get(r, 'station') ?? ''),
    walkingMinutes: toNumber(get(r, 'walking_minutes', 'walkingMinutes')),
    sourcePdfPath,
  };
}
