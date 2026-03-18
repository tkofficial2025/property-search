/**
 * 地図タイルの言語別設定
 * - en: CARTO Light（英語・ラテン文字のラベルが多め）
 * - zh: OpenStreetMap（現地語表記。日本では日本語）
 */

export type MapLanguage = 'en' | 'zh';

export interface TileLayerConfig {
  url: string;
  attribution: string;
}

const TILE_CONFIGS: Record<MapLanguage, TileLayerConfig> = {
  en: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  zh: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

export function getTileLayerConfig(language: MapLanguage): TileLayerConfig {
  return TILE_CONFIGS[language];
}

/** .env の VITE_MAPTILER_API_KEY を取得。空や未設定なら undefined */
export function getMaptilerApiKey(): string | undefined {
  const v = import.meta.env.VITE_MAPTILER_API_KEY;
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  return trimmed === '' ? undefined : trimmed;
}
