/**
 * Edge Function analyze-pdf を呼び出し、PDFから物件情報を抽出する
 */
import { supabaseUrl, supabaseAnonKey } from './supabase-config';

export interface PropertyExtractedData {
  // DBカラム
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
  initial_fees_credit_card?: boolean | null;
  pet_friendly?: boolean | null;
  elevator?: boolean | null;
  delivery_box?: boolean | null;
  balcony?: boolean | null;
  bicycle_parking?: boolean | null;
  south_facing?: boolean | null;
  is_featured?: boolean | null;
  is_new?: boolean | null;
  property_information?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // 検索フィルター対応（property_informationに埋め込んで保存）
  cap_rate?: number | null;       // 利回り(%)
  building_age?: number | null;   // 築年数
  land_area?: number | null;      // 土地面積(㎡)
  rights?: string | null;         // 権利関係
  land_type?: string | null;      // 地目
  zoning?: string | null;         // 用途地域
  planning_area?: string | null;  // 区域区分
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

/**
 * PDF を生バイナリ（application/octet-stream）で Edge Function に送る。
 * JSON の base64 より小さく、multipart がゲートウェイで 400 になるケースを避けやすい。
 */
export async function analyzePdfFile(file: File): Promise<AnalysisResult> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase not configured');
  }
  if (!file || file.size === 0) {
    throw new Error('PDFが空です。ファイルを選び直してください。');
  }
  const base = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/analyze-pdf`;
  const url = `${base}?filename=${encodeURIComponent(file.name)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
      'Content-Type': 'application/octet-stream',
    },
    body: file,
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

/** 小さなテスト用など、base64 を JSON で送る場合（非推奨: 大きいPDFで接続エラーになりやすい） */
export async function analyzePdf(base64: string, filename: string): Promise<AnalysisResult> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase not configured');
  }
  if (!base64 || typeof base64 !== 'string' || !base64.trim()) {
    throw new Error('PDFのデータが空です。ファイルを選び直してください。');
  }
  const url = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/analyze-pdf`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
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

/** バイナリを base64 に変換（Data URL の split より確実。JSON.stringify は undefined を省略するため空だと API が base64 未送信になる） */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes.length === 0) return '';
  let binary = '';
  const step = 8192;
  for (let i = 0; i < bytes.length; i += step) {
    const end = Math.min(i + step, bytes.length);
    const slice = bytes.subarray(i, end);
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }
  return btoa(binary);
}

/** ファイルをbase64文字列に変換 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result;
      if (!(buf instanceof ArrayBuffer) || buf.byteLength === 0) {
        reject(new Error('PDFが空か読み取れませんでした'));
        return;
      }
      try {
        const base64 = arrayBufferToBase64(buf);
        if (!base64) {
          reject(new Error('PDFのエンコードに失敗しました'));
          return;
        }
        resolve(base64);
      } catch (e) {
        reject(e instanceof Error ? e : new Error('PDFのエンコードに失敗しました'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('ファイルの読み取りに失敗しました'));
    reader.readAsArrayBuffer(file);
  });
}
