/**
 * Edge Function extract-property-fields-from-text（備考・特記のみから項目抽出）
 */
import { supabaseUrl, supabaseAnonKey } from './supabase-config';

export interface ExtractedInvestmentFields {
  cap_rate: number | null;
  building_age: number | null;
  rights: string | null;
  land_type: string | null;
  zoning: string | null;
  planning_area: string | null;
}

export async function extractPropertyFieldsFromText(text: string): Promise<ExtractedInvestmentFields> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase not configured');
  }
  const url = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/extract-property-fields-from-text`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({ text }),
  });
  const raw = await res.text();
  if (!res.ok) {
    let msg = raw;
    try {
      msg = JSON.parse(raw)?.error ?? raw;
    } catch {
      /* ignore */
    }
    throw new Error(msg || String(res.status));
  }
  const parsed = JSON.parse(raw) as { data: ExtractedInvestmentFields };
  return parsed.data;
}
