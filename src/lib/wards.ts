/**
 * 東京23区＋23区外の区名（英語）と address 判定用キーワード（英語・日本語）
 * TokyoWardsSection と Rent/Buy ページの絞り込みで共通利用
 */
export const WARD_MATCH_TERMS: Record<string, string[]> = {
  // 23区
  Chiyoda: ['chiyoda', '千代田'],
  Chuo: ['chuo', '中央区'],
  Minato: ['minato', '港区'],
  Shinjuku: ['shinjuku', '新宿'],
  Bunkyo: ['bunkyo', '文京'],
  Taito: ['taito', '台東'],
  Sumida: ['sumida', '墨田'],
  Koto: ['koto', '江東'],
  Shinagawa: ['shinagawa', '品川'],
  Meguro: ['meguro', '目黒'],
  Ota: ['ota', '大田'],
  Setagaya: ['setagaya', '世田谷'],
  Shibuya: ['shibuya', '渋谷'],
  Nakano: ['nakano', '中野'],
  Suginami: ['suginami', '杉並'],
  Toshima: ['toshima', '豊島'],
  Kita: ['kita', '北区'],
  Arakawa: ['arakawa', '荒川'],
  Itabashi: ['itabashi', '板橋'],
  Nerima: ['nerima', '練馬'],
  Adachi: ['adachi', '足立'],
  Katsushika: ['katsushika', '葛飾'],
  Edogawa: ['edogawa', '江戸川'],
  // 23区外（市部）
  Hachioji: ['hachioji', '八王子'],
  Tachikawa: ['tachikawa', '立川'],
  Musashino: ['musashino', '武蔵野'],
  Mitaka: ['mitaka', '三鷹'],
  Ome: ['ome', '青梅'],
  Fuchu: ['fuchu', '府中'],
  Akishima: ['akishima', '昭島'],
  Chofu: ['chofu', '調布'],
  Machida: ['machida', '町田'],
  Koganei: ['koganei', '小金井'],
  Kodaira: ['kodaira', '小平'],
  Hino: ['hino', '日野'],
  Higashimurayama: ['higashimurayama', '東村山'],
  Kokubunji: ['kokubunji', '国分寺'],
  Kunitachi: ['kunitachi', '国立'],
  Fussa: ['fussa', '福生'],
  Komae: ['komae', '狛江'],
  Higashiyamato: ['higashiyamato', '東大和'],
  Kiyose: ['kiyose', '清瀬'],
  Higashikurume: ['higashikurume', '東久留米'],
  Musashimurayama: ['musashimurayama', '武蔵村山'],
  Tama: ['tama', '多摩'],
  Inagi: ['inagi', '稲城'],
  Hamura: ['hamura', '羽村'],
  Akiruno: ['akiruno', 'あきる野'],
  Nishitokyo: ['nishitokyo', '西東京'],
};

/** 23区外（まとめて1選択肢） */
export const OUTSIDE_23_KEY = 'Outside23';

/** 東京23区の名前（英語）の配列 */
const TOKYO_23_WARD_NAMES_LIST = [
  'Chiyoda', 'Chuo', 'Minato', 'Shinjuku', 'Bunkyo', 'Taito', 'Sumida', 'Koto',
  'Shinagawa', 'Meguro', 'Ota', 'Setagaya', 'Shibuya', 'Nakano', 'Suginami',
  'Toshima', 'Kita', 'Arakawa', 'Itabashi', 'Nerima', 'Adachi', 'Katsushika', 'Edogawa'
] as const;

export const TOKYO_23_WARD_NAMES = TOKYO_23_WARD_NAMES_LIST as readonly string[];

/** Selected Area 用: 23区＋Outer 23 wards（渋谷区を人気で先頭に） */
const AREA_ORDER = [
  'Shibuya',
  ...TOKYO_23_WARD_NAMES.filter((name) => name !== 'Shibuya'),
];
export const AREA_OPTIONS: { value: string; label: string }[] = [
  ...AREA_ORDER.map((name) => ({ value: name, label: name })),
  { value: OUTSIDE_23_KEY, label: 'Outer 23 wards' },
];

/** Supabase の address で区を絞り込むための .or() 用文字列（ilike） */
export function wardFilterOr(wardName: string): string {
  const terms = WARD_MATCH_TERMS[wardName];
  if (!terms?.length) return '';
  return terms.map((t) => `address.ilike.%${t}%`).join(',');
}

/** address が指定区に一致するか */
export function addressMatchesWard(address: string, wardName: string): boolean {
  if (wardName === OUTSIDE_23_KEY) {
    // 23区外: 23区のいずれにも一致しない場合
    return !addressMatchesAnyWard(address);
  }
  const terms = WARD_MATCH_TERMS[wardName];
  if (!terms?.length) return false;
  const addr = (address ?? '').toLowerCase();
  return terms.some((t) => addr.includes(t.toLowerCase()) || addr.includes(t));
}

/** address が23区のいずれかに一致するか */
export function addressMatchesAnyWard(address: string): boolean {
  return TOKYO_23_WARD_NAMES.some((name) => addressMatchesWard(address, name));
}

/** 選択エリアで物件リストをフィルタ（selectedAreas が空なら全件） */
export function filterPropertiesByAreas<T extends { address: string }>(
  items: T[],
  selectedAreas: Set<string>
): T[] {
  if (!selectedAreas.size) return items;
  return items.filter((item) => {
    const addr = item.address ?? '';
    const matchesWard = (name: string) => name !== OUTSIDE_23_KEY && addressMatchesWard(addr, name);
    if (selectedAreas.has(OUTSIDE_23_KEY) && !addressMatchesAnyWard(addr)) return true;
    return TOKYO_23_WARD_NAMES.some((name) => selectedAreas.has(name) && matchesWard(name));
  });
}

export const WARD_NAMES = TOKYO_23_WARD_NAMES;
