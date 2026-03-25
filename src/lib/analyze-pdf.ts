/**
 * Edge Function analyze-pdf を呼び出し、PDFから物件情報を抽出する
 */
import { supabaseUrl, supabaseAnonKey } from './supabase-config';

export interface PropertyExtractedData {
  title?: string | null;
  address?: string | null;
  price?: number | null;
  management_fee?: number | null;
  beds?: number | null;
  size?: number | null;
  layout?: string | null;
  station?: string | null;
  walking_minutes?: number | null;
  floor?: number | null;
  type?: 'rent' | 'buy' | null;
  deposit?: number | null;
  key_money?: number | null;
  pet_friendly?: boolean | null;
  foreign_friendly?: boolean | null;
  elevator?: boolean | null;
  delivery_box?: boolean | null;
  balcony?: boolean | null;
  bicycle_parking?: boolean | null;
  south_facing?: boolean | null;
  is_featured?: boolean | null;
  is_new?: boolean | null;
  category_no_key_money?: boolean | null;
  category_luxury?: boolean | null;
  category_pet_friendly?: boolean | null;
  category_for_students?: boolean | null;
  category_for_families?: boolean | null;
  category_designers?: boolean | null;
  category_high_rise_residence?: boolean | null;
  property_information?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface AnalysisWarning {
  level: 'error' | 'warn';
  field: string;
  message: string;
}

export interface AnalysisResult {
  data: PropertyExtractedData;
  warnings: AnalysisWarning[];
}

export async function analyzePdf(base64: string, filename: string): Promise<AnalysisResult> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase not configured');
  }
  const url = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/analyze-pdf`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ base64, filename }),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      msg = JSON.parse(text)?.error ?? text;
    } catch { /* ignore */ }
    throw new Error(msg || String(res.status));
  }
  return JSON.parse(text) as AnalysisResult;
}

/** ファイルをbase64文字列に変換 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // "data:application/pdf;base64,XXXX" → "XXXX"
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
