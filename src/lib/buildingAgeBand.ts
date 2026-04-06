/**
 * Supabase `building_age_band` と QuickPropertySearch の築年数オプションを揃える
 */
export function yearsToBuildingAgeBand(years: number): string | null {
  if (!Number.isFinite(years) || years < 0) return null;
  if (years <= 5) return 'new-5';
  if (years <= 10) return '6-10';
  if (years <= 20) return '11-20';
  if (years <= 30) return '21-30';
  return '31-plus';
}

/** フォームの「築年（年）」入力の初期値用（代表値） */
export function bandToRepresentativeYears(band: string | null | undefined): number | null {
  if (band == null || String(band).trim() === '') return null;
  const b = String(band).trim();
  const map: Record<string, number> = {
    'new-5': 3,
    '6-10': 8,
    '11-20': 15,
    '21-30': 25,
    '31-plus': 40,
  };
  return map[b] ?? null;
}
