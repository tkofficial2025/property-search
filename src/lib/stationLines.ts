/**
 * 駅名から路線情報を取得するマッピング
 * 日本の主要路線の色とロゴ情報
 */

export interface LineInfo {
  /** 路線名（例: "JR Yamanote Line", "Tokyo Metro Ginza Line"） */
  name: string;
  /** 路線の色（CSS色コード） */
  color: string;
  /** 路線の略称（ロゴ表示用、例: "JR", "G", "M"） */
  abbreviation: string;
  /** 路線会社（例: "JR East", "Tokyo Metro", "Toei"） */
  company: string;
  /** 公式ロゴ画像のパス */
  logoPath: string;
  /** 路線コード（ロゴファイル名用） */
  lineCode: string;
}

/**
 * 駅名を正規化（"Sta.", "Station"などの接尾辞を除去）
 */
function normalizeStationName(stationName: string): string {
  return stationName
    .toLowerCase()
    .replace(/\s*(sta\.?|station)\s*$/i, '')
    .trim();
}

/**
 * 路線の優先順位を取得（表示順序の決定用）
 * 数値が小さいほど優先度が高い
 * 
 * Sランク（止まると東京が麻痺）: 1-5
 * Aランク（主要幹線）: 6-12
 * Bランク（準幹線）: 13-18
 * Cランク（地域重要）: 19-24
 * その他: 25+
 */
function getLinePriority(line: LineInfo): number {
  // Sランク（止まると東京が麻痺）
  if (line.lineCode === 'jr-yamanote') return 1; // 山手線
  if (line.lineCode === 'jr-chuo-rapid') return 2; // 中央線快速
  if (line.lineCode === 'tokyo-metro-m') return 3; // 東京メトロ丸ノ内線
  if (line.lineCode === 'tokyo-metro-t') return 4; // 東京メトロ東西線
  if (line.lineCode === 'tokyo-metro-z') return 5; // 東京メトロ半蔵門線

  // Aランク（主要幹線）
  if (line.lineCode === 'jr-sobu-rapid') return 6; // 総武線快速
  if (line.lineCode === 'jr-keihin-tohoku') return 7; // 京浜東北線
  if (line.lineCode === 'jr-saikyo') return 8; // 埼京線
  if (line.lineCode === 'tokyu-toyoko') return 9; // 東急東横線
  if (line.lineCode === 'odakyu') return 10; // 小田急小田原線
  if (line.lineCode === 'seibu-ikebukuro') return 11; // 西武池袋線
  if (line.lineCode === 'keio') return 12; // 京王線

  // Bランク（準幹線）
  if (line.lineCode === 'tokyo-metro-c') return 13; // 東京メトロ千代田線
  if (line.lineCode === 'tokyo-metro-y') return 14; // 東京メトロ有楽町線
  if (line.lineCode === 'tokyo-metro-h') return 15; // 東京メトロ日比谷線
  if (line.lineCode === 'toei-e') return 16; // 都営大江戸線
  if (line.lineCode === 'tokyu-den-en-toshi') return 17; // 東急田園都市線
  if (line.lineCode === 'keikyu') return 18; // 京急本線

  // Cランク（地域重要）
  if (line.lineCode === 'toei-i') return 19; // 都営三田線
  if (line.lineCode === 'toei-a') return 20; // 都営浅草線
  if (line.lineCode === 'toei-arakawa') return 21; // 都電荒川線
  if (line.lineCode === 'rinkai') return 22; // りんかい線
  if (line.lineCode === 'yurikamome') return 23; // ゆりかもめ
  if (line.lineCode === 'keisei') return 24; // 京成線
  if (line.lineCode === 'tobu-tojo') return 25; // 東武東上線

  // その他の東京メトロ路線
  if (line.company === 'Tokyo Metro') return 26;
  // その他の都営地下鉄路線
  if (line.company === 'Toei') return 27;
  // その他のJR路線
  if (line.company === 'JR East') return 28;
  // その他の私鉄
  return 29;
}

/**
 * 駅名から路線情報を取得
 * 駅名に含まれるキーワードから路線を判定
 * 優先順位に基づいてソート（東京メトロ・都営地下鉄を優先）
 */
export function getStationLines(stationName: string): LineInfo[] {
  const station = normalizeStationName(stationName);
  const lines: LineInfo[] = [];

  // JR東日本 - 山手線（Sランク）
  if (
    station.includes('shinjuku') ||
    station.includes('shibuya') ||
    station.includes('tokyo') ||
    station.includes('ikebukuro') ||
    station.includes('ueno') ||
    station.includes('akihabara') ||
    station.includes('yoyogi') ||
    station.includes('harajuku') ||
    station.includes('ebisu') ||
    station.includes('meguro') ||
    station.includes('gotanda') ||
    station.includes('osaki') ||
    station.includes('shinagawa') ||
    station.includes('tamachi') ||
    station.includes('hamamatsucho') ||
    station.includes('shimbashi') ||
    station.includes('yurakucho') ||
    station.includes('kanda') ||
    station.includes('okachimachi') ||
    station.includes('nishi-nippori') ||
    station.includes('nippori') ||
    station.includes('komagome') ||
    station.includes('sugamo') ||
    station.includes('otsuka') ||
    station.includes('tabata') ||
    station.includes('nishi-nippori')
  ) {
    lines.push({
      name: 'JR Yamanote Line',
      color: '#00B04F', // JR緑
      abbreviation: 'JR',
      company: 'JR East',
      logoPath: '', // JRは公式ロゴ不使用、色付きアイコンで表示
      lineCode: 'jr-yamanote',
    });
  }

  // JR東日本 - 中央線快速（Sランク）
  if (
    station.includes('chuo') ||
    station.includes('nakano') ||
    station.includes('koenji') ||
    station.includes('asagaya') ||
    station.includes('ogikubo') ||
    station.includes('nishi-ogikubo') ||
    station.includes('kichijoji') ||
    station.includes('mitaka') ||
    station.includes('musashi-sakai') ||
    station.includes('higashi-koganei') ||
    station.includes('musashi-koganei') ||
    station.includes('kokubunji') ||
    station.includes('nishi-kokubunji') ||
    station.includes('kunitachi') ||
    station.includes('tachikawa') ||
    station.includes('hino') ||
    station.includes('toyoda') ||
    station.includes('hachioji')
  ) {
    lines.push({
      name: 'JR Chuo Line Rapid',
      color: '#FF6600', // オレンジ
      abbreviation: 'JC',
      company: 'JR East',
      logoPath: '',
      lineCode: 'jr-chuo-rapid',
    });
  }

  // JR東日本 - 総武線快速（Aランク）
  if (
    station.includes('sobu') ||
    station.includes('kanda') ||
    station.includes('akihabara') ||
    station.includes('asakusabashi') ||
    station.includes('ryogoku') ||
    station.includes('kinshicho') ||
    station.includes('kameido') ||
    station.includes('hirai') ||
    station.includes('kameido') ||
    station.includes('nishi-funabashi') ||
    station.includes('funabashi') ||
    station.includes('tsudanuma') ||
    station.includes('makuhari') ||
    station.includes('kaihin-makuhari') ||
    station.includes('kemigawa') ||
    station.includes('inage') ||
    station.includes('chiba')
  ) {
    lines.push({
      name: 'JR Sobu Line Rapid',
      color: '#FFD700', // 黄色
      abbreviation: 'JO',
      company: 'JR East',
      logoPath: '',
      lineCode: 'jr-sobu-rapid',
    });
  }

  // JR東日本 - 京浜東北線（Aランク）
  if (
    station.includes('keihin-tohoku') ||
    station.includes('keihin') ||
    station.includes('saitama') ||
    station.includes('omiya') ||
    station.includes('akabane') ||
    station.includes('tabata') ||
    station.includes('nishi-nippori') ||
    station.includes('nippori') ||
    station.includes('ueno') ||
    station.includes('okachimachi') ||
    station.includes('akihabara') ||
    station.includes('kanda') ||
    station.includes('tokyo') ||
    station.includes('yurakucho') ||
    station.includes('shimbashi') ||
    station.includes('hamamatsucho') ||
    station.includes('tamachi') ||
    station.includes('shinagawa') ||
    station.includes('omori') ||
    station.includes('kamata') ||
    station.includes('kawasaki') ||
    station.includes('tsurumi') ||
    station.includes('yokohama') ||
    station.includes('sakuragicho') ||
    station.includes('kannai') ||
    station.includes('ishikawacho') ||
    station.includes('yamate') ||
    station.includes('negishi') ||
    station.includes('sakuragicho') ||
    station.includes('hinodecho') ||
    station.includes('totsuka') ||
    station.includes('ofuna') ||
    station.includes('fujisawa')
  ) {
    lines.push({
      name: 'JR Keihin-Tohoku Line',
      color: '#00BFFF', // ライトブルー
      abbreviation: 'JK',
      company: 'JR East',
      logoPath: '',
      lineCode: 'jr-keihin-tohoku',
    });
  }

  // JR東日本 - 埼京線（Aランク）
  if (
    station.includes('saikyo') ||
    station.includes('osaki') ||
    station.includes('gotanda') ||
    station.includes('ebisu') ||
    station.includes('shibuya') ||
    station.includes('shinjuku') ||
    station.includes('ikebukuro') ||
    station.includes('itabashi') ||
    station.includes('jujo') ||
    station.includes('akabane') ||
    station.includes('uki') ||
    station.includes('musashi-uki') ||
    station.includes('nishi-uki') ||
    station.includes('omiya') ||
    station.includes('minami-omiya') ||
    station.includes('yono') ||
    station.includes('kita-yono') ||
    station.includes('hasuda') ||
    station.includes('higashi-omiya') ||
    station.includes('omiya')
  ) {
    lines.push({
      name: 'JR Saikyo Line',
      color: '#00BFFF', // ライトブルー
      abbreviation: 'JS',
      company: 'JR East',
      logoPath: '',
      lineCode: 'jr-saikyo',
    });
  }

  // 東京メトロ - 銀座線（オレンジ）
  if (
    station.includes('ginza') ||
    station.includes('asakusa') ||
    station.includes('tawaramachi') ||
    station.includes('inaricho') ||
    station.includes('ueno') ||
    station.includes('ueno-hirokoji') ||
    station.includes('suehirocho') ||
    station.includes('kanda') ||
    station.includes('mitsukoshi-mae') ||
    station.includes('nihonbashi') ||
    station.includes('kyobashi') ||
    station.includes('shimbashi') ||
    station.includes('toranomon') ||
    station.includes('tameike-sanno') ||
    station.includes('akasaka-mitsuke') ||
    station.includes('aoyama-itchome') ||
    station.includes('gaienmae') ||
    station.includes('omotesando') ||
    station.includes('shibuya')
  ) {
    lines.push({
      name: 'Tokyo Metro Ginza Line',
      color: '#FF9500', // オレンジ
      abbreviation: 'G',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-g.jpg',
      lineCode: 'tokyo-metro-g',
    });
  }

  // 東京メトロ - 丸ノ内線（赤）
  if (
    station.includes('marunouchi') ||
    station.includes('ikebukuro') ||
    station.includes('shinjuku') ||
    station.includes('kasuga') ||
    station.includes('myogadani') ||
    station.includes('shin-otsuka') ||
    station.includes('otsuka') ||
    station.includes('sugamo') ||
    station.includes('komagome') ||
    station.includes('honkomagome') ||
    station.includes('todaimae') ||
    station.includes('korakuen') ||
    station.includes('myogadani') ||
    station.includes('shin-otsuka')
  ) {
    lines.push({
      name: 'Tokyo Metro Marunouchi Line',
      color: '#E60012', // 赤
      abbreviation: 'M',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-m.jpg',
      lineCode: 'tokyo-metro-m',
    });
  }

  // 東京メトロ - 日比谷線（グレー）
  if (
    station.includes('hibiya') ||
    station.includes('nakameguro') ||
    station.includes('ebisu') ||
    station.includes('hiroo') ||
    station.includes('roppongi') ||
    station.includes('kamiyacho') ||
    station.includes('toranomon-hills') ||
    station.includes('kasumigaseki') ||
    station.includes('ginza') ||
    station.includes('higashi-ginza') ||
    station.includes('tsukiji') ||
    station.includes('hatchobori') ||
    station.includes('kayabacho') ||
    station.includes('ningyocho') ||
    station.includes('kodemmacho') ||
    station.includes('akihabara') ||
    station.includes('nakao-okachimachi') ||
    station.includes('ueno') ||
    station.includes('iriya') ||
    station.includes('minowa') ||
    station.includes('minami-senju') ||
    station.includes('kita-senju')
  ) {
    lines.push({
      name: 'Tokyo Metro Hibiya Line',
      color: '#9CA3AF', // グレー
      abbreviation: 'H',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-h.jpg',
      lineCode: 'tokyo-metro-h',
    });
  }

  // 東京メトロ - 東西線（青）※早稲田はJRではなく東西線・都電荒川線
  if (
    station.includes('tozai') ||
    station.includes('nakano') ||
    station.includes('nishi-funabashi') ||
    station.includes('waseda') ||
    station.includes('早稲田') ||
    station.includes('早稻田') ||
    station.includes('takadanobaba') ||
    station.includes('kagurazaka') ||
    station.includes('iidabashi') ||
    station.includes('kudanshita') ||
    station.includes('otemachi') ||
    station.includes('nihonbashi') ||
    station.includes('kayabacho') ||
    station.includes('monzen-nakacho') ||
    station.includes('kiba') ||
    station.includes('toyocho') ||
    station.includes('minami-sunamachi') ||
    station.includes('nishi-kasai') ||
    station.includes('kasai') ||
    station.includes('urayasu') ||
    station.includes('minami-gyotoku') ||
    station.includes('gyotoku') ||
    station.includes('myoden') ||
    station.includes('baraki-nakayama')
  ) {
    lines.push({
      name: 'Tokyo Metro Tozai Line',
      color: '#009BBF', // 青
      abbreviation: 'T',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-t.jpg',
      lineCode: 'tokyo-metro-t',
    });
  }

  // 東京メトロ - 千代田線（緑）
  if (
    station.includes('chiyoda') ||
    station.includes('yoyogi-uehara') ||
    station.includes('ayase')
  ) {
    lines.push({
      name: 'Tokyo Metro Chiyoda Line',
      color: '#00B04F', // 緑
      abbreviation: 'C',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-c.jpg',
      lineCode: 'tokyo-metro-c',
    });
  }

  // 東京メトロ - 半蔵門線（紫）- Sランク
  // 半蔵門線の主要駅を優先的に判定
  if (
    station.includes('hanzomon') ||
    station.includes('mitsukoshimae') ||
    station.includes('suitengumae') ||
    station.includes('kiyosumi-shirakawa') ||
    station.includes('sumiyoshi') ||
    station.includes('kinshicho') ||
    station.includes('oyama') ||
    station.includes('senju-ohashi') ||
    station.includes('kita-senju') ||
    station.includes('ayase') ||
    station.includes('jimbocho') ||
    station.includes('ogawamachi') ||
    station.includes('iwamotocho') ||
    station.includes('bakuro-yokoyama') ||
    station.includes('hamacho') ||
    station.includes('morishita') ||
    station.includes('kikukawa') ||
    station.includes('nagatacho') ||
    station.includes('akasaka-mitsuke') ||
    station.includes('aoyama-itchome') ||
    station.includes('omotesando') ||
    station.includes('gaienmae') ||
    station.includes('shibuya') && !station.includes('ginza') && !station.includes('fukutoshin') && !station.includes('den-en-toshi')
  ) {
    lines.push({
      name: 'Tokyo Metro Hanzomon Line',
      color: '#8F76D6', // 紫
      abbreviation: 'Z',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-z.jpg',
      lineCode: 'tokyo-metro-z',
    });
  }

  // 東京メトロ - 南北線（エメラルドグリーン）
  if (
    station.includes('nanboku') ||
    station.includes('akabane-iwabuchi') ||
    station.includes('meguro')
  ) {
    lines.push({
      name: 'Tokyo Metro Namboku Line',
      color: '#00ADA9', // エメラルドグリーン
      abbreviation: 'N',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-n.jpg',
      lineCode: 'tokyo-metro-n',
    });
  }

  // 東京メトロ - 有楽町線（金色）
  if (
    station.includes('yurakucho') ||
    station.includes('wakoshi') ||
    station.includes('wako-shi') ||
    station.includes('chikatetsu-akatsuka') ||
    station.includes('heiwadai') ||
    station.includes('hikawadai') ||
    station.includes('kotake-mukaihara') ||
    station.includes('senkawa') ||
    station.includes('kanamecho') ||
    station.includes('ikebukuro') ||
    station.includes('gokokuji') ||
    station.includes('edogawabashi') ||
    station.includes('iidabashi') ||
    station.includes('ichigaya') ||
    station.includes('kojimachi') ||
    station.includes('nagatacho') ||
    station.includes('sakuradamon') ||
    station.includes('yurakucho') ||
    station.includes('ginza-itchome') ||
    station.includes('shintomicho') ||
    station.includes('tsukishima') ||
    station.includes('toyosu') ||
    station.includes('tatsumi') ||
    station.includes('shin-kiba')
  ) {
    lines.push({
      name: 'Tokyo Metro Yurakucho Line',
      color: '#C1A340', // 金色（ゴールド）
      abbreviation: 'Y',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-y.jpg',
      lineCode: 'tokyo-metro-y',
    });
  }

  // 東京メトロ - 副都心線（茶色）
  if (
    station.includes('fukutoshin') ||
    station.includes('wako-shi') ||
    station.includes('chikatetsu-narimasu') ||
    station.includes('chikatetsu-akatsuka') ||
    station.includes('heiwadai') ||
    station.includes('hikawadai') ||
    station.includes('kotake-mukaihara') ||
    station.includes('senkawa') ||
    station.includes('kanamecho') ||
    station.includes('ikebukuro') ||
    station.includes('zoshigaya') ||
    station.includes('nishi-waseda') ||
    station.includes('higashi-shinjuku') ||
    station.includes('shinjuku-sanchome') ||
    station.includes('kita-sando') ||
    station.includes('meiji-jingumae') ||
    station.includes('harajuku') ||
    station.includes('shibuya')
  ) {
    lines.push({
      name: 'Tokyo Metro Fukutoshin Line',
      color: '#9B7D4E', // 茶色
      abbreviation: 'F',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-f.png',
      lineCode: 'tokyo-metro-f',
    });
  }

  // 都営地下鉄 - 浅草線（ピンク）
  if (
    station.includes('asakusa') ||
    station.includes('otsuka') ||
    station.includes('nishi-magome') ||
    station.includes('honjo-azumabashi') ||
    station.includes('higashi-nihombashi') ||
    station.includes('ningyocho') ||
    station.includes('higashi-ginza') ||
    station.includes('takadanobaba') ||
    station.includes('shirokane-takanawa') ||
    station.includes('mita') ||
    station.includes('daimon') ||
    station.includes('bakuro-yokoyama') ||
    station.includes('honjo-azumabashi') ||
    station.includes('kuramae') ||
    station.includes('asakusabashi') ||
    station.includes('honjo-azumabashi') ||
    station.includes('otsuka') ||
    station.includes('iriya') ||
    station.includes('minowa') ||
    station.includes('minami-senju') ||
    station.includes('kitasenju') ||
    station.includes('ayase') ||
    station.includes('nishi-magome')
  ) {
    lines.push({
      name: 'Toei Asakusa Line',
      color: '#E85298', // ピンク
      abbreviation: 'A',
      company: 'Toei',
      logoPath: '/station-logos/toei-a.png',
      lineCode: 'toei-a',
    });
  }

  // 都営地下鉄 - 三田線（青）
  if (
    station.includes('mita') ||
    station.includes('meguro') ||
    station.includes('nishi-takashimadaira') ||
    station.includes('shirokane-takanawa') ||
    station.includes('mita') ||
    station.includes('sengakuji') ||
    station.includes('takanawadai') ||
    station.includes('shirokanedai') ||
    station.includes('shirokane-takanawa') ||
    station.includes('hibiya') ||
    station.includes('otemachi') ||
    station.includes('suehirocho') ||
    station.includes('kanda') ||
    station.includes('jimbocho') ||
    station.includes('ogawamachi') ||
    station.includes('iwamotocho') ||
    station.includes('kasuga') ||
    station.includes('hakusan') ||
    station.includes('sengoku') ||
    station.includes('sugamo') ||
    station.includes('nishi-sugamo') ||
    station.includes('shin-itabashi') ||
    station.includes('itabashi-kuyakushomae') ||
    station.includes('itabashi-honcho') ||
    station.includes('motohasunuma') ||
    station.includes('shimura-sakaue') ||
    station.includes('shimura-sanchome') ||
    station.includes('hasune') ||
    station.includes('nishi-takashimadaira')
  ) {
    lines.push({
      name: 'Toei Mita Line',
      color: '#0079C2', // 青
      abbreviation: 'I',
      company: 'Toei',
      logoPath: '/station-logos/toei-i.png',
      lineCode: 'toei-i',
    });
  }

  // 都営地下鉄 - 新宿線（緑）
  if (
    station.includes('shinjuku') ||
    station.includes('shinjuku-sanchome') ||
    station.includes('akebono-bashi') ||
    station.includes('ichigaya') ||
    station.includes('kudanshita') ||
    station.includes('jimbocho') ||
    station.includes('ogawamachi') ||
    station.includes('iwamotocho') ||
    station.includes('bakuro-yokoyama') ||
    station.includes('hamacho') ||
    station.includes('morishita') ||
    station.includes('kikukawa') ||
    station.includes('sumiyoshi') ||
    station.includes('nishi-ojima') ||
    station.includes('ojima') ||
    station.includes('higashi-ojima') ||
    station.includes('funabori') ||
    station.includes('ichinoe') ||
    station.includes('mizue') ||
    station.includes('shinozaki') ||
    station.includes('moto-yawata')
  ) {
    lines.push({
      name: 'Toei Shinjuku Line',
      color: '#6CBB5A', // 緑
      abbreviation: 'S',
      company: 'Toei',
      logoPath: '/station-logos/toei-s.jpg',
      lineCode: 'toei-s',
    });
  }

  // 都営地下鉄 - 大江戸線（ルビー）
  if (
    station.includes('oedo') ||
    station.includes('roppongi') ||
    station.includes('tochomae') ||
    station.includes('kasuga') ||
    station.includes('honjo-azumabashi') ||
    station.includes('morishita') ||
    station.includes('kikukawa') ||
    station.includes('sumiyoshi') ||
    station.includes('nishi-ojima') ||
    station.includes('ojima') ||
    station.includes('higashi-ojima') ||
    station.includes('funabori') ||
    station.includes('mizue') ||
    station.includes('shinozaki') ||
    station.includes('otsuka') ||
    station.includes('idobash') ||
    station.includes('uchisaiwaicho') ||
    station.includes('akabanebashi') ||
    station.includes('azabu-juban') ||
    station.includes('roppongi') ||
    station.includes('aoyama-itchome') ||
    station.includes('kokuritsu-kyogijo') ||
    station.includes('yoyogi') ||
    station.includes('shinjuku-nishiguchi') ||
    station.includes('tochomae') ||
    station.includes('nishishinjuku-gochome') ||
    station.includes('nakano-sakaue') ||
    station.includes('higashi-nakano') ||
    station.includes('nakai') ||
    station.includes('ochiai-minami-nagasaki') ||
    station.includes('shin-egota') ||
    station.includes('nerima') ||
    station.includes('toshimaen') ||
    station.includes('nerima-kasugacho') ||
    station.includes('hikarigaoka')
  ) {
    lines.push({
      name: 'Toei Oedo Line',
      color: '#E60012', // ルビー
      abbreviation: 'E',
      company: 'Toei',
      logoPath: '/station-logos/toei-e.png',
      lineCode: 'toei-e',
    });
  }

  // 都電荒川線（Toden Arakawa Line）※早稲田はJRではなく東西線・都電荒川線
  if (
    station.includes('arakawa') ||
    station.includes('waseda') ||
    station.includes('早稲田') ||
    station.includes('早稻田') ||
    station.includes('omokagebashi') ||
    station.includes('gakushuinshita') ||
    station.includes('mukohara') ||
    station.includes('kishibojimmae') ||
    station.includes('oji-ekimae') ||
    station.includes('asukayama') ||
    station.includes('takinoguchi') ||
    station.includes('nishigahara') ||
    station.includes('koshinzuka') ||
    station.includes('shin-koshinzuka') ||
    station.includes('higashi-ikebukuro') ||
    station.includes('otsuka-ekimae') ||
    station.includes('sugamoinari') ||
    station.includes('minowabashi') ||
    station.includes('miyanoi') ||
    station.includes('ogashiwa') ||
    station.includes('arakawa-yuenchimae') ||
    station.includes('arakawa-shakomae') ||
    station.includes('kajiwara') ||
    station.includes('sakaecho') ||
    station.includes('machiya') ||
    station.includes('arakawa-nichome') ||
    station.includes('arakawa-nanachome') ||
    station.includes('arakawa-kuyakushomae') ||
    station.includes('sannowabashi')
  ) {
    lines.push({
      name: 'Toei Arakawa Line (Toden)',
      color: '#E46C04', // 都電オレンジ
      abbreviation: 'SA', // 荒川
      company: 'Toei',
      logoPath: '/station-logos/toei-arakawa.png',
      lineCode: 'toei-arakawa',
    });
  }

  // 小田急線（Odakyu Line）- 緑色
  if (
    station.includes('odawara') ||
    station.includes('hakone') ||
    station.includes('shinjuku') ||
    station.includes('shibuya') ||
    station.includes('yoyogi-uehara') ||
    station.includes('machida') ||
    station.includes('sagamihara') ||
    station.includes('hon-atsugi') ||
    station.includes('isehara') ||
    station.includes('hakone-yumoto') ||
    station.includes('gotemba') ||
    station.includes('kawasaki') ||
    station.includes('mukogaoka-yuen') ||
    station.includes('yoyogi-hachiman') ||
    station.includes('setagaya-daita') ||
    station.includes('umegaoka') ||
    station.includes('gokokuji') ||
    station.includes('kyodo') ||
    station.includes('chitose-funabashi') ||
    station.includes('shimo-kitazawa') ||
    station.includes('sangubashi') ||
    station.includes('yoyogi-hachiman') ||
    station.includes('yoyogi-uehara')
  ) {
    lines.push({
      name: 'Odakyu Line',
      color: '#00A650', // 小田急緑
      abbreviation: 'OH',
      company: 'Odakyu',
      logoPath: '', // 色付きアイコンで表示
      lineCode: 'odakyu',
    });
  }

  // 京王線（Keio Line）- オレンジ色
  if (
    station.includes('keio') ||
    station.includes('hachioji') ||
    station.includes('takaosanguchi') ||
    station.includes('meidaimae') ||
    station.includes('chofu') ||
    station.includes('fuchu') ||
    station.includes('kokuryo') ||
    station.includes('nishi-chofu') ||
    station.includes('tama-reien') ||
    station.includes('tama-dobutsukoen') ||
    station.includes('hirayama') ||
    station.includes('hodokubo') ||
    station.includes('takahatafudo') ||
    station.includes('minamidaira') ||
    station.includes('shibasaki') ||
    station.includes('tama') ||
    station.includes('sakurajosui') ||
    station.includes('kitano') ||
    station.includes('shibuya')
  ) {
    lines.push({
      name: 'Keio Line',
      color: '#FF6600', // 京王オレンジ
      abbreviation: 'KO',
      company: 'Keio',
      logoPath: '', // 色付きアイコンで表示
      lineCode: 'keio',
    });
  }

  // 東急 - 東横線（Aランク）
  if (
    station.includes('toyoko') ||
    station.includes('shibuya') ||
    station.includes('daikanyama') ||
    station.includes('nakameguro') ||
    station.includes('toritsu-daigaku') ||
    station.includes('gakugei-daigaku') ||
    station.includes('jiyugaoka') ||
    station.includes('den-en-chofu') ||
    station.includes('tamagawa') ||
    station.includes('musashi-kosugi') ||
    station.includes('motomachi-chukagai') ||
    station.includes('yokohama') ||
    station.includes('sakuragicho') ||
    station.includes('kikuna') ||
    station.includes('myorenji') ||
    station.includes('hakuraku') ||
    station.includes('higashi-hakuraku') ||
      station.includes('tsunashima')
    ) {
    lines.push({
      name: 'Tokyu Toyoko Line',
      color: '#E60012', // 東急赤
      abbreviation: 'TY',
      company: 'Tokyu',
      logoPath: '',
      lineCode: 'tokyu-toyoko',
    });
  }

  // 東急 - 田園都市線（Bランク）
  if (
    station.includes('den-en-toshi') ||
    station.includes('shibuya') ||
    station.includes('ikejiri-ohashi') ||
    station.includes('sangenjaya') ||
    station.includes('komazawa-daigaku') ||
    station.includes('sakura-shinmachi') ||
    station.includes('yutenji') ||
    station.includes('futako-tamagawa') ||
    station.includes('musashi-koyama') ||
    station.includes('tsukushino') ||
    station.includes('miyazakidai') ||
    station.includes('yagiyama') ||
    station.includes('fujigaoka') ||
    station.includes('aobadai') ||
    station.includes('tama-plaza') ||
    station.includes('azamino') ||
    station.includes('nagatsuta') ||
    station.includes('chuo-rinkan') ||
    station.includes('minami-machida') ||
    station.includes('tsukushino') ||
    station.includes('sagami-ono') ||
    station.includes('odakyu-sagamihara')
  ) {
    lines.push({
      name: 'Tokyu Den-en-toshi Line',
      color: '#00B04F', // 緑
      abbreviation: 'DT',
      company: 'Tokyu',
      logoPath: '',
      lineCode: 'tokyu-den-en-toshi',
    });
  }

  // 京急線（Keikyu）- 青色
  if (
    station.includes('keikyu') ||
    station.includes('haneda') ||
    station.includes('yokohama') ||
    station.includes('kamata') ||
    station.includes('keikyu-kamata') ||
    station.includes('rokkakubashi') ||
    station.includes('kanazawa-bunko') ||
    station.includes('oppama') ||
    station.includes('tsujido') ||
    station.includes('shin-zushi') ||
    station.includes('yokosuka-chuo') ||
    station.includes('keikyu-tomigaoka') ||
    station.includes('keikyu-kurihama') ||
    station.includes('misakiguchi') ||
    station.includes('hinodecho') ||
    station.includes('kawasaki') ||
    station.includes('sueyoshicho') ||
    station.includes('keikyu-kawasaki') ||
    station.includes('haginaka') ||
    station.includes('tsunashima') ||
    station.includes('keikyu-tsunashima') ||
    station.includes('shinagawa') ||
    station.includes('keikyu-shinagawa')
  ) {
    lines.push({
      name: 'Keikyu Line',
      color: '#1E90FF', // 京急青
      abbreviation: 'KK',
      company: 'Keikyu',
      logoPath: '', // 色付きアイコンで表示
      lineCode: 'keikyu',
    });
  }

  // 東武 - 東上線（Cランク）
  if (
    station.includes('tobu-tojo') ||
    (station.includes('tobu') && station.includes('tojo')) ||
    station.includes('ikebukuro') ||
    station.includes('shimo-itabashi') ||
    station.includes('ojima') ||
    station.includes('higashi-ojima') ||
    station.includes('wako-shi') ||
    station.includes('fujimino') ||
    station.includes('shiki') ||
    station.includes('yashio') ||
    station.includes('mizuhodai') ||
    station.includes('minami-koshigaya') ||
    station.includes('kawagoe') ||
    station.includes('hon-kawagoe') ||
    station.includes('sakado') ||
    station.includes('tsurugashima') ||
    station.includes('wakaba') ||
    station.includes('shiki') ||
    station.includes('yashio') ||
    station.includes('mizuhodai') ||
    station.includes('minami-koshigaya') ||
    station.includes('shingashi') ||
    station.includes('kawagoe-shi') ||
    station.includes('hon-kawagoe') ||
    station.includes('sakado') ||
    station.includes('tsurugashima') ||
    station.includes('wakaba')
  ) {
    lines.push({
      name: 'Tobu Tojo Line',
      color: '#E60012', // 東武赤
      abbreviation: 'TB',
      company: 'Tobu',
      logoPath: '',
      lineCode: 'tobu-tojo',
    });
  }

  // 西武線（Seibu）- 黄色
  if (
    station.includes('seibu') ||
    station.includes('ikebukuro') ||
    station.includes('hanno') ||
    station.includes('chichibu') ||
    station.includes('kawagoe') ||
    station.includes('hon-kawagoe') ||
    station.includes('toshimaen') ||
    station.includes('nerima') ||
    station.includes('shakujii-koen') ||
    station.includes('oji') ||
    station.includes('akabane-iwabuchi') ||
    station.includes('higashi-jujo') ||
    station.includes('shimo-itabashi') ||
    station.includes('nerima-takanodai') ||
    station.includes('shakujii-koen') ||
    station.includes('oji') ||
    station.includes('akabane-iwabuchi') ||
    station.includes('higashi-jujo') ||
    station.includes('shimo-itabashi') ||
    station.includes('nerima-takanodai') ||
    station.includes('hanno') ||
    station.includes('chichibu') ||
    station.includes('kawagoe') ||
    station.includes('hon-kawagoe')
  ) {
    lines.push({
      name: 'Seibu Line',
      color: '#FFD700', // 西武黄
      abbreviation: 'SW',
      company: 'Seibu',
      logoPath: '', // 色付きアイコンで表示
      lineCode: 'seibu',
    });
  }

  // 京成線（Keisei）- オレンジ色
  if (
    station.includes('keisei') ||
    station.includes('narita') ||
    station.includes('ueno') ||
    station.includes('nihombashi') ||
    station.includes('asakusa') ||
    station.includes('aoto') ||
    station.includes('keisei-ueno') ||
    station.includes('keisei-otsuka') ||
    station.includes('yawata') ||
    station.includes('keisei-yawata') ||
    station.includes('keisei-kamata') ||
    station.includes('keisei-takasago') ||
    station.includes('keisei-sakura') ||
    station.includes('keisei-narita') ||
    station.includes('keisei-narita-airport') ||
    station.includes('narita-airport') ||
    station.includes('keisei-chiba') ||
    station.includes('keisei-funabashi') ||
    station.includes('keisei-tsudanuma') ||
    station.includes('keisei-makuhari') ||
    station.includes('keisei-kaihin-makuhari') ||
    station.includes('keisei-inage') ||
    station.includes('keisei-chiba-chuo')
  ) {
    lines.push({
      name: 'Keisei Line',
      color: '#FF8C00', // 京成オレンジ
      abbreviation: 'KS',
      company: 'Keisei',
      logoPath: '', // 色付きアイコンで表示
      lineCode: 'keisei',
    });
  }

  // 京浜急行線（Keihin Kyuko）- 青色
  if (
    station.includes('keihin') ||
    station.includes('haneda') ||
    station.includes('yokohama') ||
    station.includes('kamata') ||
    station.includes('rokkakubashi') ||
    station.includes('kanazawa-bunko') ||
    station.includes('oppama') ||
    station.includes('tsujido') ||
    station.includes('shin-zushi') ||
    station.includes('yokosuka-chuo')
  ) {
    // 京急線と同じなので、重複を避ける
    if (!lines.some(l => l.lineCode === 'keikyu')) {
      lines.push({
        name: 'Keihin Kyuko Line',
        color: '#1E90FF', // 京急青
        abbreviation: 'KK',
        company: 'Keikyu',
        logoPath: '', // 色付きアイコンで表示
        lineCode: 'keikyu',
      });
    }
  }

  // デフォルト: 路線が見つからない場合はJRを表示
  if (lines.length === 0) {
    lines.push({
      name: 'JR Line',
      color: '#00B04F', // JR緑
      abbreviation: 'JR',
      company: 'JR East',
      logoPath: '',
      lineCode: 'jr-yamanote',
    });
  }

  // 優先順位でソート（東京メトロ・都営地下鉄を優先）
  return lines.sort((a, b) => getLinePriority(a) - getLinePriority(b));
}

/**
 * 駅名から主要路線を1つ取得（複数ある場合は最初の1つ）
 */
export function getPrimaryStationLine(stationName: string): LineInfo {
  const lines = getStationLines(stationName);
  return lines[0] || {
    name: 'JR Yamanote Line',
    color: '#00B04F',
    abbreviation: 'JR',
    company: 'JR East',
    logoPath: '',
    lineCode: 'jr-yamanote',
  };
}

/**
 * すべての利用可能な路線リストを取得（ドロップダウン用）
 */
export function getAllRailwayLines(): LineInfo[] {
  return [
    // JR - Sランク
    {
      name: 'JR Yamanote Line',
      color: '#00B04F',
      abbreviation: 'JR',
      company: 'JR East',
      logoPath: '',
      lineCode: 'jr-yamanote',
    },
    {
      name: 'JR Chuo Line Rapid',
      color: '#FF6600',
      abbreviation: 'JC',
      company: 'JR East',
      logoPath: '',
      lineCode: 'jr-chuo-rapid',
    },
    // JR - Aランク
    {
      name: 'JR Sobu Line Rapid',
      color: '#FFD700',
      abbreviation: 'JO',
      company: 'JR East',
      logoPath: '',
      lineCode: 'jr-sobu-rapid',
    },
    {
      name: 'JR Keihin-Tohoku Line',
      color: '#00BFFF',
      abbreviation: 'JK',
      company: 'JR East',
      logoPath: '',
      lineCode: 'jr-keihin-tohoku',
    },
    {
      name: 'JR Saikyo Line',
      color: '#00BFFF',
      abbreviation: 'JS',
      company: 'JR East',
      logoPath: '',
      lineCode: 'jr-saikyo',
    },
    // 東京メトロ
    {
      name: 'Tokyo Metro Ginza Line',
      color: '#FF9500',
      abbreviation: 'G',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-g.jpg',
      lineCode: 'tokyo-metro-g',
    },
    {
      name: 'Tokyo Metro Marunouchi Line',
      color: '#E60012',
      abbreviation: 'M',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-m.jpg',
      lineCode: 'tokyo-metro-m',
    },
    {
      name: 'Tokyo Metro Hibiya Line',
      color: '#9CA3AF',
      abbreviation: 'H',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-h.jpg',
      lineCode: 'tokyo-metro-h',
    },
    {
      name: 'Tokyo Metro Tozai Line',
      color: '#009BBF',
      abbreviation: 'T',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-t.jpg',
      lineCode: 'tokyo-metro-t',
    },
    {
      name: 'Tokyo Metro Chiyoda Line',
      color: '#00B04F',
      abbreviation: 'C',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-c.jpg',
      lineCode: 'tokyo-metro-c',
    },
    {
      name: 'Tokyo Metro Hanzomon Line',
      color: '#8F76D6',
      abbreviation: 'Z',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-z.jpg',
      lineCode: 'tokyo-metro-z',
    },
    {
      name: 'Tokyo Metro Namboku Line',
      color: '#00ADA9',
      abbreviation: 'N',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-n.jpg',
      lineCode: 'tokyo-metro-n',
    },
    {
      name: 'Tokyo Metro Yurakucho Line',
      color: '#C1A340',
      abbreviation: 'Y',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-y.jpg',
      lineCode: 'tokyo-metro-y',
    },
    {
      name: 'Tokyo Metro Fukutoshin Line',
      color: '#9B7D4E',
      abbreviation: 'F',
      company: 'Tokyo Metro',
      logoPath: '/station-logos/tokyo-metro-f.png',
      lineCode: 'tokyo-metro-f',
    },
    // 都営地下鉄
    {
      name: 'Toei Asakusa Line',
      color: '#E85298',
      abbreviation: 'A',
      company: 'Toei',
      logoPath: '/station-logos/toei-a.png',
      lineCode: 'toei-a',
    },
    {
      name: 'Toei Mita Line',
      color: '#0079C2',
      abbreviation: 'I',
      company: 'Toei',
      logoPath: '/station-logos/toei-i.png',
      lineCode: 'toei-i',
    },
    {
      name: 'Toei Shinjuku Line',
      color: '#6CBB5A',
      abbreviation: 'S',
      company: 'Toei',
      logoPath: '/station-logos/toei-s.jpg',
      lineCode: 'toei-s',
    },
    {
      name: 'Toei Oedo Line',
      color: '#E60012',
      abbreviation: 'E',
      company: 'Toei',
      logoPath: '/station-logos/toei-e.png',
      lineCode: 'toei-e',
    },
    // 私鉄 - Aランク
    {
      name: 'Tokyu Toyoko Line',
      color: '#E60012',
      abbreviation: 'TY',
      company: 'Tokyu',
      logoPath: '',
      lineCode: 'tokyu-toyoko',
    },
    {
      name: 'Odakyu Line',
      color: '#00A650',
      abbreviation: 'OH',
      company: 'Odakyu',
      logoPath: '',
      lineCode: 'odakyu',
    },
    {
      name: 'Seibu Ikebukuro Line',
      color: '#FFD700',
      abbreviation: 'SW',
      company: 'Seibu',
      logoPath: '',
      lineCode: 'seibu-ikebukuro',
    },
    {
      name: 'Keio Line',
      color: '#FF6600',
      abbreviation: 'KO',
      company: 'Keio',
      logoPath: '',
      lineCode: 'keio',
    },
    // 私鉄 - Bランク
    {
      name: 'Tokyu Den-en-toshi Line',
      color: '#00B04F',
      abbreviation: 'DT',
      company: 'Tokyu',
      logoPath: '',
      lineCode: 'tokyu-den-en-toshi',
    },
    {
      name: 'Keikyu Line',
      color: '#1E90FF',
      abbreviation: 'KK',
      company: 'Keikyu',
      logoPath: '',
      lineCode: 'keikyu',
    },
    // 私鉄 - Cランク
    {
      name: 'Tobu Tojo Line',
      color: '#E60012',
      abbreviation: 'TB',
      company: 'Tobu',
      logoPath: '',
      lineCode: 'tobu-tojo',
    },
    {
      name: 'Keisei Line',
      color: '#FF8C00',
      abbreviation: 'KS',
      company: 'Keisei',
      logoPath: '',
      lineCode: 'keisei',
    },
    {
      name: 'Rinkai Line',
      color: '#0066CC',
      abbreviation: 'R',
      company: 'Rinkai',
      logoPath: '',
      lineCode: 'rinkai',
    },
    {
      name: 'Yurikamome',
      color: '#00B04F',
      abbreviation: 'U',
      company: 'Yurikamome',
      logoPath: '',
      lineCode: 'yurikamome',
    },
  ];
}

/**
 * 路線コードから路線情報を取得
 */
export function getLineInfoByCode(lineCode: string): LineInfo | null {
  const allLines = getAllRailwayLines();
  return allLines.find(line => line.lineCode === lineCode) || null;
}
