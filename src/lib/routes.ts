/**
 * ページとURLパスの対応。ブラウザの履歴と同期してページごとにURLを変える。
 */
export type Page =
  | 'home'
  | 'buy'
  | 'register'
  | 'consultation'
  | 'cookie'
  | 'terms'
  | 'privacy';

const PATH_TO_PAGE: Record<string, Page> = {
  '/': 'home',
  '/buy': 'buy',
  '/register': 'register',
  '/consultation': 'consultation',
  '/cookie-policy': 'cookie',
  '/terms': 'terms',
  '/privacy': 'privacy',
};

const PAGE_TO_PATH: Record<Page, string> = {
  home: '/',
  buy: '/buy',
  register: '/register',
  consultation: '/consultation',
  cookie: '/cookie-policy',
  terms: '/terms',
  privacy: '/privacy',
};

export function getPageFromPath(pathname: string): Page {
  const normalized = pathname.replace(/\/$/, '') || '/';
  return PATH_TO_PAGE[normalized] ?? 'home';
}

export function getPathFromPage(page: Page, _language?: string): string {
  return PAGE_TO_PATH[page];
}

export function getPathname(): string {
  return window.location.pathname;
}

export function pushState(path: string, search?: string): void {
  const url = search ? `${path}${search.startsWith('?') ? search : `?${search}`}` : path;
  window.history.pushState({ path, search: search ?? '' }, '', url);
}

export function replaceState(path: string, search?: string): void {
  const url = search ? `${path}${search.startsWith('?') ? search : `?${search}`}` : path;
  window.history.replaceState({ path, search: search ?? '' }, '', url);
}
