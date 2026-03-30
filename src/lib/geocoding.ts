/**
 * 住所から座標（緯度・経度）を取得するジオコーディング関数
 * Nominatim はブラウザから直接呼ばず /api/geocode 経由（CORS・利用規約対応）
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

const addressCache = new Map<string, Coordinates | null>();
const inFlightByAddress = new Map<string, Promise<Coordinates | null>>();

/**
 * 住所を正規化（日本語・英語両対応）
 */
function normalizeAddress(address: string): string {
  let normalized = address.trim();
  
  // 全角数字を半角に変換
  normalized = normalized.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
  
  // 英語表記の住所を日本語表記に変換（例: "Yotsuya 4-8-9" → "四谷4-8-9"）
  // ただし、英語表記のままでも検索できるように両方試す
  
  // 丁目・番地の表記を統一（日本語）
  normalized = normalized
    .replace(/(\d+)[丁目]/g, '$1丁目')
    .replace(/(\d+)[番地]/g, '$1番地')
    .replace(/(\d+)[番]/g, '$1番')
    .replace(/(\d+)[号]/g, '$1号');
  
  return normalized;
}

/**
 * 英語表記の住所を日本語表記に変換（主要な地名のみ）
 */
function translateEnglishToJapanese(address: string): string {
  const translations: Record<string, string> = {
    'Tokyo': '東京都',
    'Shinjuku': '新宿区',
    'Shibuya': '渋谷区',
    'Yotsuya': '四谷',
    'Minato': '港区',
    'Chiyoda': '千代田区',
    'Chuo': '中央区',
    'Setagaya': '世田谷区',
    'Meguro': '目黒区',
    'Ota': '大田区',
    'Shinagawa': '品川区',
    'Koto': '江東区',
    'Sumida': '墨田区',
    'Taito': '台東区',
    'Arakawa': '荒川区',
    'Itabashi': '板橋区',
    'Nerima': '練馬区',
    'Nakano': '中野区',
    'Suginami': '杉並区',
    'Toshima': '豊島区',
    'Kita': '北区',
    'Adachi': '足立区',
    'Katsushika': '葛飾区',
    'Edogawa': '江戸川区',
  };
  
  let translated = address;
  for (const [en, ja] of Object.entries(translations)) {
    // 大文字小文字を区別しない置換
    translated = translated.replace(new RegExp(en, 'gi'), ja);
  }
  
  return translated;
}

type ProxyFetchResult = {
  data: unknown[] | null;
  rateLimited: boolean;
};

/** 同一オリジンの /api/geocode 経由（本番は Vercel、開発は Vite ミドルウェア） */
async function fetchNominatimViaProxy(query: string): Promise<ProxyFetchResult> {
  const url = `/api/geocode?q=${encodeURIComponent(query)}`;
  let response = await fetch(url);
  if (response.status === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    response = await fetch(url);
  }
  if (response.status === 429) {
    return { data: null, rateLimited: true };
  }
  if (!response.ok) {
    return { data: null, rateLimited: false };
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return { data: null, rateLimited: false };
  }
  const data: unknown = await response.json();
  return { data: Array.isArray(data) ? data : null, rateLimited: false };
}

/**
 * 住所を座標に変換
 * @param address 住所（例: "東京都渋谷区..."）
 * @returns 座標またはnull
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  if (!address || address.trim() === '') {
    return null;
  }

  const normalizedAddressKey = normalizeAddress(address);
  if (addressCache.has(normalizedAddressKey)) {
    return addressCache.get(normalizedAddressKey) ?? null;
  }

  const inFlight = inFlightByAddress.get(normalizedAddressKey);
  if (inFlight) {
    return inFlight;
  }

  const promise = (async () => {
    try {
    // 住所を正規化
    const normalizedAddress = normalizedAddressKey;
    
    // 英語表記を日本語に変換したバージョンも作成
    const japaneseAddress = translateEnglishToJapanese(normalizedAddress);
    
    // 複数の検索戦略を試す（英語表記と日本語表記の両方）
    const searchQueries = [
      normalizedAddress, // 元の住所（英語表記の場合）
      japaneseAddress, // 日本語に変換した住所
      normalizedAddress.replace(/\d+丁目.*$/, ''), // 丁目以降を削除
    ].filter((q, index, self) => q && self.indexOf(q) === index); // 重複を削除

    for (const query of searchQueries) {
      if (!query.trim()) continue;

      const { data, rateLimited } = await fetchNominatimViaProxy(query);
      if (rateLimited) {
        break;
      }
      if (!data) {
        continue;
      }
      
      if (Array.isArray(data) && data.length > 0) {
        // 最も関連性の高い結果を選択
        let bestResult = data[0];
        let bestScore = 0;
        
        for (const result of data) {
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          
          // 座標が有効か確認
          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            continue;
          }
          
          // スコア計算（重要度 + 日本国内かどうか）
          const importance = parseFloat(String(result.importance ?? '0'));
          const addr = result.address as Record<string, unknown> | undefined;
          const displayName = String(result.display_name ?? '');
          const isJapan =
            addr?.country_code === 'jp' ||
            addr?.country === 'Japan' ||
            displayName.includes('Japan') ||
            displayName.includes('日本');
          
          const score = importance + (isJapan ? 0.3 : 0);
          
          if (score > bestScore) {
            bestScore = score;
            bestResult = result;
          }
        }
        
        const lat = parseFloat(String(bestResult.lat));
        const lng = parseFloat(String(bestResult.lon));
        
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          const coords = { lat, lng };
          addressCache.set(normalizedAddressKey, coords);
          return coords;
        }
      }
      
      // Nominatim 利用規約: 公開 API は最大 1 リクエスト/秒程度
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }

    addressCache.set(normalizedAddressKey, null);
    return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      addressCache.set(normalizedAddressKey, null);
      return null;
    } finally {
      inFlightByAddress.delete(normalizedAddressKey);
    }
  })();

  inFlightByAddress.set(normalizedAddressKey, promise);
  return promise;
}

/**
 * 複数の住所を一括でジオコーディング（レート制限を考慮して順次実行）
 * @param addresses 住所の配列
 * @returns 座標の配列（取得できなかった場合はnull）
 */
export async function geocodeAddresses(addresses: string[]): Promise<(Coordinates | null)[]> {
  const uniqueAddresses = [...new Set(addresses)];
  const resolved = new Map<string, Coordinates | null>();

  for (const address of uniqueAddresses) {
    const coords = await geocodeAddress(address);
    resolved.set(address, coords);
    
    // レート制限を考慮して1秒待機
    if (uniqueAddresses.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return addresses.map((address) => resolved.get(address) ?? null);
}
