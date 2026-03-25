/**
 * Edge Function translate-property を呼び出し、物件名・住所の中国語翻訳を取得する
 * Supabase URL / Anon Key は .env の VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY から読み取る（supabase-config 経由）
 */
import { supabaseUrl, supabaseAnonKey } from './supabase-config';

const baseUrl = supabaseUrl;
const anonKey = supabaseAnonKey;

export type PropertyTranslationItem = {
  propertyId: number;
  title: string;
  address: string;
};

export type PropertyTranslationResult = {
  title_zh: string;
  address_zh: string;
  property_information_zh?: string;
};

const cache = new Map<number, PropertyTranslationResult>();

async function callTranslateProperty(body: {
  propertyId: number;
  title: string;
  address: string;
  property_information?: string;
}): Promise<PropertyTranslationResult>;
async function callTranslateProperty(body: { items: PropertyTranslationItem[] }): Promise<{ translations: PropertyTranslationResult[] }>;
async function callTranslateProperty(
  body:
    | { propertyId: number; title: string; address: string; property_information?: string }
    | { items: PropertyTranslationItem[] }
): Promise<PropertyTranslationResult | { translations: PropertyTranslationResult[] }> {
  const fallback = (): PropertyTranslationResult | { translations: PropertyTranslationResult[] } =>
    'items' in body
      ? { translations: body.items.map((i) => ({ title_zh: i.title, address_zh: i.address })) }
      : { title_zh: (body as { title: string }).title, address_zh: (body as { address: string }).address, property_information_zh: (body as { property_information?: string }).property_information ?? '' };
  if (!baseUrl || !anonKey) return fallback();

  try {
    const url = `${baseUrl.replace(/\/$/, '')}/functions/v1/translate-property`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) return fallback();
    return JSON.parse(text) as PropertyTranslationResult | { translations: PropertyTranslationResult[] };
  } catch {
    return fallback();
  }
}

/** 1件の物件の中国語翻訳を取得（キャッシュあり）。property_information を渡すと Property Information も翻訳する。 */
export async function getPropertyTranslation(
  propertyId: number,
  title: string,
  address: string,
  propertyInformation?: string
): Promise<PropertyTranslationResult> {
  const cached = cache.get(propertyId);
  const needInfo = (propertyInformation ?? '').trim().length > 0;
  if (cached && (!needInfo || cached.property_information_zh != null)) return cached;
  const result = (await callTranslateProperty({
    propertyId,
    title,
    address,
    property_information: propertyInformation ?? undefined,
  })) as PropertyTranslationResult;
  cache.set(propertyId, result);
  return result;
}

/** 複数物件の中国語翻訳を一括取得 */
export async function getPropertyTranslationsBatch(
  items: PropertyTranslationItem[]
): Promise<Map<number, PropertyTranslationResult>> {
  const map = new Map<number, PropertyTranslationResult>();
  const missing: PropertyTranslationItem[] = [];
  for (const item of items) {
    const cached = cache.get(item.propertyId);
    if (cached) map.set(item.propertyId, cached);
    else missing.push(item);
  }
  if (missing.length === 0) return map;
  const result = (await callTranslateProperty({ items: missing })) as { translations: PropertyTranslationResult[] };
  const list = result.translations ?? [];
  missing.forEach((item, i) => {
    const t = list[i] ?? { title_zh: item.title, address_zh: item.address };
    map.set(item.propertyId, t);
    cache.set(item.propertyId, t);
  });
  return map;
}

/** 言語が zh のとき物件リストの中国語翻訳を取得する hook 用の型 */
export interface PropertyForTranslation {
  id: number;
  title: string;
  address: string;
}

/**
 * 日本語のみのため、外部翻訳は行わず常に空の Map を返す。
 */
export async function fetchTranslationsForProperties(
  _properties: PropertyForTranslation[],
  _language: 'ja'
): Promise<Map<number, PropertyTranslationResult>> {
  return new Map();
}
