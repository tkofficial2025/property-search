/**
 * 住所から座標（緯度・経度）を取得するジオコーディング関数
 * OpenStreetMap Nominatim APIを使用（無料、レート制限あり）
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

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

/**
 * 住所を座標に変換
 * @param address 住所（例: "東京都渋谷区..."）
 * @returns 座標またはnull
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  if (!address || address.trim() === '') {
    return null;
  }

  try {
    // 住所を正規化
    const normalizedAddress = normalizeAddress(address);
    
    // 英語表記を日本語に変換したバージョンも作成
    const japaneseAddress = translateEnglishToJapanese(normalizedAddress);
    
    // 複数の検索戦略を試す（英語表記と日本語表記の両方）
    const searchQueries = [
      normalizedAddress, // 元の住所（英語表記の場合）
      japaneseAddress, // 日本語に変換した住所
      normalizedAddress.replace(/\d+-\d+-\d+.*$/, ''), // 英語表記の番地を削除（例: "4-8-9"）
      normalizedAddress.replace(/\d+丁目.*$/, ''), // 丁目以降を削除
      normalizedAddress.replace(/\d+番地.*$/, ''), // 番地以降を削除
      normalizedAddress.replace(/\d+番.*$/, ''), // 番以降を削除
      normalizedAddress.replace(/\d+号.*$/, ''), // 号以降を削除
      japaneseAddress.replace(/\d+丁目.*$/, ''), // 日本語版：丁目以降を削除
      japaneseAddress.replace(/\d+番地.*$/, ''), // 日本語版：番地以降を削除
    ].filter((q, index, self) => q && self.indexOf(q) === index); // 重複を削除

    for (const query of searchQueries) {
      if (!query.trim()) continue;
      
      const encodedAddress = encodeURIComponent(query);
      // 日本の住所に特化したパラメータを追加（英語表記も検索できるようにcountrycodesは指定しない）
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=3&addressdetails=1&accept-language=ja,en&extratags=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Premium Real Estate Website', // 必須
          'Accept-Language': 'ja,en',
        },
      });

      if (!response.ok) {
        continue; // 次の検索戦略を試す
      }

      const data = await response.json();
      
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
          const importance = parseFloat(result.importance || '0');
          const isJapan = result.address?.country_code === 'jp' || 
                         result.address?.country === 'Japan' ||
                         result.display_name?.includes('Japan') ||
                         result.display_name?.includes('日本');
          
          const score = importance + (isJapan ? 0.3 : 0);
          
          if (score > bestScore) {
            bestScore = score;
            bestResult = result;
          }
        }
        
        const lat = parseFloat(bestResult.lat);
        const lng = parseFloat(bestResult.lon);
        
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng };
        }
      }
      
      // レート制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * 複数の住所を一括でジオコーディング（レート制限を考慮して順次実行）
 * @param addresses 住所の配列
 * @returns 座標の配列（取得できなかった場合はnull）
 */
export async function geocodeAddresses(addresses: string[]): Promise<(Coordinates | null)[]> {
  const results: (Coordinates | null)[] = [];
  
  for (const address of addresses) {
    const coords = await geocodeAddress(address);
    results.push(coords);
    
    // レート制限を考慮して1秒待機
    if (addresses.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
