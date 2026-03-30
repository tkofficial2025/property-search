import { fetchNominatimSearchResults } from '../src/lib/nominatimSearch';

function sendJson(res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void }, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default async function handler(req: { method?: string; query?: Record<string, string | string[] | undefined> }, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void }) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const raw = req.query?.q;
  const q = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  if (!q?.trim()) {
    sendJson(res, 400, { error: 'Missing q' });
    return;
  }

  try {
    const data = await fetchNominatimSearchResults(q);
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400');
    sendJson(res, 200, data);
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 429) {
      sendJson(res, 429, { error: 'rate_limited' });
      return;
    }
    sendJson(res, 502, { error: 'geocoding_failed' });
  }
}
