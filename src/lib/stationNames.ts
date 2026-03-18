/**
 * 駅名の正規化と中国語表示用マッピング
 * Station name normalization and Chinese display for property pages/cards
 */

export type Language = 'en' | 'zh';

/**
 * Normalize station name for lookup (lowercase, remove "Station"/"Sta.", trim)
 */
export function normalizeStationKey(station: string): string {
  if (!station || typeof station !== 'string') return '';
  return station
    .toLowerCase()
    .replace(/\s*(sta\.?|station)\s*$/i, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Station name (normalized key) → Chinese display name
 * Covers major Tokyo area stations and common listing stations.
 */
const STATION_ZH: Record<string, string> = {
  // JR Yamanote & major hubs
  shibuya: '涩谷',
  shinjuku: '新宿',
  ikebukuro: '池袋',
  tokyo: '东京',
  ueno: '上野',
  shinagawa: '品川',
  osaki: '大崎',
  gotanda: '五反田',
  meguro: '目黑',
  ebisu: '惠比寿',
  yoyogi: '代代木',
  harajuku: '原宿',
  shimbashi: '新桥',
  yurakucho: '有乐町',
  akihabara: '秋叶原',
  okachimachi: '御徒町',
  tabata: '田端',
  'nishi-nippori': '西日暮里',
  nippori: '日暮里',
  komagome: '驹込',
  sugamo: '巢鸭',
  otsuka: '大塚',
  mejiro: '目白',
  takadanobaba: '高田马场',
  'shin-okubo': '新大久保',
  // Chuo / Sobu
  nakano: '中野',
  koenji: '高圆寺',
  asagaya: '阿佐谷',
  ogikubo: '荻洼',
  'nishi-ogikubo': '西荻洼',
  kichijoji: '吉祥寺',
  mitaka: '三鹰',
  'musashi-sakai': '武藏境',
  kokubunji: '国分寺',
  kunitachi: '国立',
  tachikawa: '立川',
  hino: '日野',
  hachioji: '八王子',
  'shinjuku-nishiguchi': '新宿西口',
  yotsuya: '四谷',
  ichigaya: '市谷',
  iidabashi: '饭田桥',
  suidobashi: '水道桥',
  ochanomizu: '御茶水',
  kinshicho: '锦丝町',
  ryogoku: '两国',
  kameido: '龟户',
  'nishi-funabashi': '西船桥',
  funabashi: '船桥',
  // Keihin-Tohoku / Negishi
  omori: '大森',
  kamata: '蒲田',
  kawasaki: '川崎',
  tsunashima: '纲岛',
  yokohama: '横滨',
  sakuragicho: '樱木町',
  kannai: '关内',
  ishikawacho: '石川町',
  negishi: '根岸',
  // Saikyo / Shonan-Shinjuku
  itabashi: '板桥',
  jujo: '十条',
  akabane: '赤羽',
  omiya: '大宫',
  'musashi-uki': '武藏浦和',
  'nishi-uki': '西浦和',
  // Tokyo Metro - Ginza
  ginza: '银座',
  asakusa: '浅草',
  tawaramachi: '田原町',
  inaricho: '稻荷町',
  'ueno-hirokoji': '上野广小路',
  'mitsukoshi-mae': '三越前',
  nihonbashi: '日本桥',
  kyobashi: '京桥',
  toranomon: '虎之门',
  'tameike-sanno': '溜池山王',
  'akasaka-mitsuke': '赤坂见附',
  'aoyama-itchome': '表参道',
  gaienmae: '外苑前',
  omotesando: '表参道',
  // Tokyo Metro - Marunouchi
  marunouchi: '丸之内',
  kasuga: '春日',
  myogadani: '茗荷谷',
  'shin-otsuka': '新大塚',
  korakuen: '后乐园',
  todaimae: '东大前',
  honkomagome: '本驹込',
  // Tokyo Metro - Hibiya
  hibiya: '日比谷',
  nakameguro: '中目黑',
  hiroo: '广尾',
  roppongi: '六本木',
  kamiyacho: '霞关',
  'toranomon-hills': '虎之门Hills',
  kasumigaseki: '霞关',
  'higashi-ginza': '东银座',
  tsukiji: '筑地',
  hatchobori: '八丁堀',
  kayabacho: '茅场町',
  ningyocho: '人形町',
  kodemmacho: '小传马町',
  'nakao-okachimachi': '仲御徒町',
  iriya: '入谷',
  minowa: '三之轮',
  'minami-senju': '南千住',
  'kita-senju': '北千住',
  // Tokyo Metro - Tozai (nakano already above)
  // Tokyo Metro - Chiyoda
  chiyoda: '千代田',
  'yoyogi-uehara': '代代木上原',
  ayase: '绫濑',
  // Tokyo Metro - Hanzomon
  hanzomon: '半藏门',
  mitsukoshimae: '三越前',
  suitengumae: '水天宫前',
  'kiyosumi-shirakawa': '清澄白河',
  sumiyoshi: '住吉',
  oyama: '大山',
  'senju-ohashi': '千住大桥',
  jimbocho: '神保町',
  ogawamachi: '小川町',
  iwamotocho: '岩本町',
  'bakuro-yokoyama': '马喰横山',
  hamacho: '滨町',
  morishita: '森下',
  kikukawa: '菊川',
  nagatacho: '永田町',
  // Tokyo Metro - Namboku
  'shirokane-takanawa': '白金高轮',
  shirokanedai: '白金台',
  'azabu-juban': '麻布十番',
  'roppongi-itchome': '六本木一丁目',
  // 'tameike-sanno' already above
  'nishi-sugamo': '西巢鸭',
  'akabane-iwabuchi': '赤羽岩渊',
  // Tokyo Metro - Fukutoshin
  wakoshi: '和光市',
  'chikatetsu-akatsuka': '地下铁赤塚',
  heiwadai: '和平台',
  hikawadai: '氷川台',
  'kotake-mukaihara': '小竹向原',
  senkawa: '千川',
  kanamecho: '要町',
  gokokuji: '护国寺',
  // Toei - Oedo
  nogizaka: '乃木坂',
  tochomae: '都厅前',
  // Other common
  shinbashi: '新桥',
  hamamatsucho: '滨松町',
  asakusabashi: '浅草桥',
  otemachi: '大手町',
  nijubashimae: '二重桥前',
  nakanobu: '中延',
  'musashi-koyama': '武藏小山',
  fudomae: '不动前',
  zoshigaya: '杂司谷',
  'nishi-waseda': '西早稻田',
  waseda: '早稻田',
  'higashi-shinjuku': '东新宿',
  'wakamatsu-kawada': '若松河田',
  'ushigome-yanagicho': '牛込柳町',
  'ushigome-kagurazaka': '牛込神乐坂',
  // iidabashi, otemachi, nihonbashi, ningyocho already above
  kudanshita: '九段下',
  takebashi: '竹桥',
  'monzen-nakacho': '门前仲町',
  kiba: '木场',
  // morishita, ryogoku already above
  'shin-okachimachi': '新御徒町',
  kuramae: '藏前',
  // asakusa already above
  'honjo-azumabashi': '本所吾妻桥',
  oshiage: '押上',
  // Minato / Meguro area
  tamachi: '田町',
  takanawa: '高轮',
  mita: '三田',
  // suidobashi, ochanomizu, akihabara already above
  kanda: '神田',
};

/** Suffix for "station" per language (e.g. " Station", "站", "駅") */
const STATION_SUFFIX: Record<Language, string> = {
  en: ' Station',
  zh: '站',
};

function addStationSuffix(name: string, language: Language): string {
  const suffix = STATION_SUFFIX[language];
  if (!name || name.endsWith(suffix) || name.endsWith(' Station') || name.endsWith('站') || name.endsWith('駅')) {
    return name;
  }
  return name + suffix;
}

/**
 * Returns the station name to display. For Chinese (zh), returns the translated name if available; otherwise the original.
 * For English (en), returns the original station string.
 * Appends the word for "station" (Station / 站) in the current language.
 */
export function getStationDisplay(station: string | undefined | null, language: Language): string {
  if (!station || typeof station !== 'string') return '';
  const raw = language === 'en' ? station : (STATION_ZH[normalizeStationKey(station)] ?? station);
  return addStationSuffix(raw, language);
}
