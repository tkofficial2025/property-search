/**
 * Nominatim はブラウザから直接呼ばない（CORS・429）。サーバー／Vite 開発ミドルウェアからのみ利用。
 * https://operations.osmfoundation.org/policies/nominatim/
 */

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const MIN_REQUEST_INTERVAL_MS = 1100;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

const DEFAULT_UA =
  'PropertySearch/1.0 (+https://github.com/tkofficial2025/property-search)';

function userAgent(): string {
  if (typeof process !== 'undefined' && process.env?.NOMINATIM_USER_AGENT) {
    return process.env.NOMINATIM_USER_AGENT;
  }
  return DEFAULT_UA;
}

const queryCache = new Map<string, { expiresAt: number; data: unknown[] }>();
let lastRequestAt = 0;
let requestQueue: Promise<void> = Promise.resolve();

async function runWithRateLimit<T>(task: () => Promise<T>): Promise<T> {
  const previous = requestQueue;
  let release!: () => void;
  requestQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  const waitMs = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  try {
    const result = await task();
    lastRequestAt = Date.now();
    return result;
  } finally {
    release();
  }
}

/** Nominatim search の JSON 配列を返す。4xx/5xx は例外（status 付き） */
export async function fetchNominatimSearchResults(query: string): Promise<unknown[]> {
  const now = Date.now();
  const cached = queryCache.get(query);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  return runWithRateLimit(async () => {
    const url = `${NOMINATIM_SEARCH}?q=${encodeURIComponent(query)}&format=json&limit=3&addressdetails=1&accept-language=ja&extratags=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent(),
        Accept: 'application/json',
        'Accept-Language': 'ja',
      },
    });

    if (!response.ok) {
      const err = new Error(`Nominatim ${response.status}`) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }

    const data: unknown = await response.json();
    const normalized = Array.isArray(data) ? data : [];
    queryCache.set(query, { data: normalized, expiresAt: Date.now() + CACHE_TTL_MS });
    return normalized;
  });
}
