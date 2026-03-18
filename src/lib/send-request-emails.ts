/**
 * Edge Function send-request-emails を fetch で直接呼ぶ（メール送信）
 * Supabase URL / Anon Key は .env の VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY から読み取る（supabase-config 経由）
 */
import { supabaseUrl, supabaseAnonKey } from './supabase-config';

const baseUrl = supabaseUrl;
const anonKey = supabaseAnonKey;

export type SendRequestEmailsBody =
  | { type: 'tour'; userEmail: string; userName: string; propertyId: number; propertyTitle?: string; candidateDates?: { date: string; timeRange: string }[] }
  | { type: 'inquiry'; email: string; name: string; propertyId: number; propertyTitle?: string }
  | {
      type: 'consultation';
      name: string;
      email: string;
      phone?: string;
      interest: 'rent' | 'buy';
      preferredDate?: string;
      preferOnlineMeeting?: boolean;
      message?: string;
    };

export async function sendRequestEmails(body: SendRequestEmailsBody): Promise<{ ok: boolean; error?: string }> {
  if (!baseUrl || !anonKey) {
    console.warn('[send-request-emails] Supabase URL or anon key missing');
    return { ok: false, error: 'Supabase not configured' };
  }
  const url = `${baseUrl.replace(/\/$/, '')}/functions/v1/send-request-emails`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error('[send-request-emails]', res.status, text);
      return { ok: false, error: text || String(res.status) };
    }
    let data: { results?: { ok: boolean; error?: string }[] } = {};
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: true };
    }
    const hasError = data.results?.some((r) => !r.ok);
    if (hasError) {
      const msg = data.results?.find((r) => !r.ok)?.error || 'Send failed';
      console.error('[send-request-emails]', msg);
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[send-request-emails]', msg);
    return { ok: false, error: msg };
  }
}
