/**
 * 駅名の表示（日本語UI：駅名 + 「駅」）
 */

export type Language = 'ja';

function addJaStationSuffix(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  if (trimmed.endsWith('駅') || /駅\s*$/.test(trimmed)) return trimmed;
  return `${trimmed}駅`;
}

/**
 * 駅名を表示用に整形（末尾の Station / Sta. を除き、必要なら「駅」を付与）
 */
export function getStationDisplay(station: string | undefined | null, _language: Language): string {
  if (!station || typeof station !== 'string') return '';
  const base = station
    .trim()
    .replace(/\s*(sta\.?|station)\s*$/i, '')
    .trim();
  return addJaStationSuffix(base);
}
