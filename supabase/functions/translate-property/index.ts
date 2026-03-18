// DeepL で物件名・住所を日本語→中国語に翻訳。キャッシュは property_translations に保存。

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DEEPL_AUTH_KEY = Deno.env.get('DEEPL_AUTH_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const DEEPL_FREE = true; // 無料プランは api-free.deepl.com

type SingleRequest = { propertyId: number; title: string; address: string; property_information?: string };
type BatchRequest = { items: SingleRequest[] };

async function translateWithDeepL(texts: string[]): Promise<string[]> {
  if (!DEEPL_AUTH_KEY || texts.length === 0) return texts.map(() => '');
  const filtered = texts.filter((t) => t != null && String(t).trim() !== '');
  if (filtered.length === 0) return texts.map(() => '');

  const url = DEEPL_FREE
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `DeepL-Auth-Key ${DEEPL_AUTH_KEY}`,
    },
    body: JSON.stringify({
      text: filtered,
      target_lang: 'ZH',
      source_lang: 'JA',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[translate-property] DeepL error', res.status, err);
    return texts.map(() => '');
  }

  const data = (await res.json()) as { translations?: { text: string }[] };
  const translated = (data.translations ?? []).map((t) => t.text ?? '');
  return translated;
}

serve(async (req) => {
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };

  // Preflight: 200 で返す（一部環境で 204 が ok 扱いされない場合がある）
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: SingleRequest | BatchRequest;
  try {
    body = (await req.json()) as SingleRequest | BatchRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const items: SingleRequest[] = 'items' in body && Array.isArray(body.items)
    ? body.items
    : 'propertyId' in body && typeof body.propertyId === 'number'
      ? [body as SingleRequest]
      : [];

  if (items.length === 0) {
    return new Response(JSON.stringify({ error: 'Missing propertyId, title, address or items' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
  const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

  // 一括で property_translations を取得（1クエリで全件分のキャッシュを読む）
  type CacheRow = { property_id: number; field: string; value: string };
  const cacheByPropertyId = new Map<number, Map<string, string>>();
  if (supabase && items.length > 0) {
    const ids = [...new Set(items.map((i) => i.propertyId))];
    const { data: rows } = await supabase
      .from('property_translations')
      .select('property_id, field, value')
      .in('property_id', ids)
      .eq('lang', 'zh');
    for (const r of (rows ?? []) as CacheRow[]) {
      let m = cacheByPropertyId.get(r.property_id);
      if (!m) {
        m = new Map();
        cacheByPropertyId.set(r.property_id, m);
      }
      m.set(r.field, r.value ?? '');
    }
  }

  const results: { propertyId: number; title_zh: string; address_zh: string; property_information_zh: string }[] = [];

  for (const item of items) {
    const { propertyId, title, address, property_information } = item;
    const titleStr = String(title ?? '').trim();
    const addressStr = String(address ?? '').trim();
    const infoStr = property_information != null ? String(property_information).trim() : '';

    const cached = cacheByPropertyId.get(propertyId);
    let titleZh = cached?.get('title') ?? '';
    let addressZh = cached?.get('address') ?? '';
    let propertyInformationZh = cached?.get('property_information') ?? '';

    const toTranslate: string[] = [];
    const indices: ('title' | 'address' | 'property_information')[] = [];
    if (!titleZh && titleStr) {
      toTranslate.push(titleStr);
      indices.push('title');
    }
    if (!addressZh && addressStr) {
      toTranslate.push(addressStr);
      indices.push('address');
    }
    if (!propertyInformationZh && infoStr) {
      toTranslate.push(infoStr);
      indices.push('property_information');
    }

    if (toTranslate.length > 0 && DEEPL_AUTH_KEY) {
      const translated = await translateWithDeepL(toTranslate);
      let i = 0;
      for (const field of indices) {
        const value = translated[i++] ?? '';
        if (field === 'title') titleZh = value;
        else if (field === 'address') addressZh = value;
        else propertyInformationZh = value;
        if (supabase && value) {
          await supabase.from('property_translations').upsert(
            { property_id: propertyId, field, lang: 'zh', value },
            { onConflict: 'property_id,field,lang' }
          );
        }
      }
    }

    results.push({
      propertyId,
      title_zh: titleZh || titleStr,
      address_zh: addressZh || addressStr,
      property_information_zh: propertyInformationZh || infoStr,
    });
  }

  const isSingle = items.length === 1;
  const payload = isSingle
    ? { title_zh: results[0].title_zh, address_zh: results[0].address_zh, property_information_zh: results[0].property_information_zh }
    : { translations: results };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
  } catch (err) {
    console.error('[translate-property]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
