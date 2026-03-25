/**
 * 地図タイル（日本語ラベル中心の OSM）
 */

export type MapLanguage = 'ja';

export interface TileLayerConfig {
  url: string;
  attribution: string;
}

const JA_TILE: TileLayerConfig = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

export function getTileLayerConfig(_language: MapLanguage): TileLayerConfig {
  return JA_TILE;
}

/** .env の VITE_MAPTILER_API_KEY を取得。空や未設定なら undefined */
export function getMaptilerApiKey(): string | undefined {
  const v = import.meta.env.VITE_MAPTILER_API_KEY;
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  return trimmed === '' ? undefined : trimmed;
}
