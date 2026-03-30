import { toDirectImageUrl } from './propertyImageUrl';

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
    size: Number(get(r, 'size') ?? 0),
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
  const priceStr = typeVal === 'rent' ? `¥${price.toLocaleString()}/mo` : `¥${price.toLocaleString()}`;
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
    size: `${Number(get(r, 'size') ?? 0)}㎡`,
    station: String(get(r, 'station') ?? ''),
    walkingMinutes: toNumber(get(r, 'walking_minutes', 'walkingMinutes')),
    sourcePdfPath,
  };
}
