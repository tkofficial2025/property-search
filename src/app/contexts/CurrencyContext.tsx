import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';

const FX_CACHE_KEY = 'fx_rates';
const FX_API = 'https://api.frankfurter.app/latest?from=JPY&to=USD,CNY,KRW,AUD,CAD';

export type Currency = 'JPY' | 'USD' | 'CNY' | 'KRW' | 'AUD' | 'CAD';

interface FxCache {
  date: string; // YYYY-MM-DD
  jpyPerUsd: number;
  jpyPerCny: number;
  jpyPerKrw: number;
  jpyPerAud: number;
  jpyPerCad: number;
}

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** 1 USD = N JPY（取得できない場合は 150 をフォールバック） */
  jpyPerUsd: number;
  /** 1 CNY = N JPY（取得できない場合は 20 をフォールバック） */
  jpyPerCny: number;
  /** 1 KRW = N JPY（取得できない場合は 0.1 をフォールバック） */
  jpyPerKrw: number;
  /** 1 AUD = N JPY（取得できない場合は 100 をフォールバック） */
  jpyPerAud: number;
  /** 1 CAD = N JPY（取得できない場合は 110 をフォールバック） */
  jpyPerCad: number;
  /** レート取得日 YYYY-MM-DD（キャッシュまたはAPI応答） */
  rateDate: string | null;
  loading: boolean;
  error: string | null;
  /** 円建て価格を選択中通貨でフォーマット（賃貸は type: 'rent'、売買は type: 'buy'） */
  formatPrice: (priceYen: number, type: 'rent' | 'buy') => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function todayString(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function loadCachedRate(): FxCache | null {
  try {
    const raw = localStorage.getItem(FX_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FxCache;
    if (
      parsed?.date &&
      typeof parsed.jpyPerUsd === 'number' && parsed.jpyPerUsd > 0 &&
      typeof parsed.jpyPerCny === 'number' && parsed.jpyPerCny > 0 &&
      typeof parsed.jpyPerKrw === 'number' && parsed.jpyPerKrw > 0 &&
      typeof parsed.jpyPerAud === 'number' && parsed.jpyPerAud > 0 &&
      typeof parsed.jpyPerCad === 'number' && parsed.jpyPerCad > 0
    ) return parsed;
  } catch {
    // ignore
  }
  return null;
}

function saveCachedRate(date: string, jpyPerUsd: number, jpyPerCny: number, jpyPerKrw: number, jpyPerAud: number, jpyPerCad: number) {
  try {
    localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ date, jpyPerUsd, jpyPerCny, jpyPerKrw, jpyPerAud, jpyPerCad }));
  } catch {
    // ignore
  }
}

/** Language for rent suffix: zh → /月, en → /mo. Pass from parent that has LanguageProvider. */
export function CurrencyProvider({ children, language = 'en' }: { children: ReactNode; language?: 'en' | 'zh' }) {
  const [currency, setCurrency] = useState<Currency>('JPY');
  const [jpyPerUsd, setJpyPerUsd] = useState<number>(150);
  const [jpyPerCny, setJpyPerCny] = useState<number>(20);
  const [jpyPerKrw, setJpyPerKrw] = useState<number>(0.1);
  const [jpyPerAud, setJpyPerAud] = useState<number>(100);
  const [jpyPerCad, setJpyPerCad] = useState<number>(110);
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = todayString();
    const cached = loadCachedRate();
    if (cached && cached.date === today) {
      setJpyPerUsd(cached.jpyPerUsd);
      setJpyPerCny(cached.jpyPerCny);
      setJpyPerKrw(cached.jpyPerKrw);
      setJpyPerAud(cached.jpyPerAud);
      setJpyPerCad(cached.jpyPerCad);
      setRateDate(cached.date);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(FX_API)
      .then((res) => res.json())
      .then((data: { rates?: { USD?: number; CNY?: number; KRW?: number; AUD?: number; CAD?: number }; date?: string }) => {
        if (cancelled) return;
        const date = data?.date ?? today;
        // JPYからUSD, CNY, KRW, AUD, CADへのレートを取得
        // APIは1 JPY = X USD/CNY/KRW/AUD/CADを返すので、逆数を取る必要がある
        const usdRate = data?.rates?.USD;
        const cnyRate = data?.rates?.CNY;
        const krwRate = data?.rates?.KRW;
        const audRate = data?.rates?.AUD;
        const cadRate = data?.rates?.CAD;
        
        if (typeof usdRate === 'number' && usdRate > 0) {
          setJpyPerUsd(1 / usdRate); // 1 USD = 1/usdRate JPY
        }
        if (typeof cnyRate === 'number' && cnyRate > 0) {
          setJpyPerCny(1 / cnyRate); // 1 CNY = 1/cnyRate JPY
        }
        if (typeof krwRate === 'number' && krwRate > 0) {
          setJpyPerKrw(1 / krwRate); // 1 KRW = 1/krwRate JPY
        }
        if (typeof audRate === 'number' && audRate > 0) {
          setJpyPerAud(1 / audRate); // 1 AUD = 1/audRate JPY
        }
        if (typeof cadRate === 'number' && cadRate > 0) {
          setJpyPerCad(1 / cadRate); // 1 CAD = 1/cadRate JPY
        }
        
        if (usdRate && cnyRate && krwRate && audRate && cadRate) {
          setRateDate(date);
          saveCachedRate(date, 1 / usdRate, 1 / cnyRate, 1 / krwRate, 1 / audRate, 1 / cadRate);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to fetch rate');
          const cached = loadCachedRate();
          if (cached) {
            setJpyPerUsd(cached.jpyPerUsd);
            setJpyPerCny(cached.jpyPerCny);
            setJpyPerKrw(cached.jpyPerKrw);
            setJpyPerAud(cached.jpyPerAud);
            setJpyPerCad(cached.jpyPerCad);
            setRateDate(cached.date);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rentSuffix = language === 'zh' ? '/月' : '/mo';
  const useWan = language === 'zh'; // 中国語のときは K/M ではなく万単位

  const formatPrice = useCallback<CurrencyContextValue['formatPrice']>(
    (priceYen, type) => {
      if (currency === 'JPY') {
        if (useWan && priceYen >= 10000) {
          const wan = priceYen / 10000;
          const wanStr = wan === Math.floor(wan) ? wan.toFixed(0) : wan.toFixed(1);
          return type === 'rent' ? `¥${wanStr}万${rentSuffix}` : `¥${wanStr}万`;
        }
        if (!useWan) {
          if (type === 'rent') {
            if (priceYen >= 100000) return `¥${(priceYen / 1000).toFixed(0)}k${rentSuffix}`;
            return `¥${priceYen.toLocaleString()}${rentSuffix}`;
          }
          if (priceYen >= 1000000) return `¥${(priceYen / 1000000).toFixed(1)}M`;
        }
        return type === 'rent' ? `¥${priceYen.toLocaleString()}${rentSuffix}` : `¥${priceYen.toLocaleString()}`;
      }
      
      if (currency === 'USD') {
        const usd = priceYen / jpyPerUsd;
        if (type === 'rent') {
          if (usd >= 1000) return `$${(usd / 1000).toFixed(1)}k${rentSuffix}`;
          return `$${Math.round(usd).toLocaleString()}${rentSuffix}`;
        }
        if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`;
        if (usd >= 1000) return `$${(usd / 1000).toFixed(1)}k`;
        return `$${Math.round(usd).toLocaleString()}`;
      }
      
      if (currency === 'CNY') {
        const cny = priceYen / jpyPerCny;
        if (type === 'rent') {
          if (cny >= 10000) return `¥${(cny / 10000).toFixed(1)}万${rentSuffix}`;
          return `¥${Math.round(cny).toLocaleString()}${rentSuffix}`;
        }
        if (cny >= 1_000_000) return `¥${(cny / 10000).toFixed(1)}万`;
        if (cny >= 10000) return `¥${(cny / 10000).toFixed(1)}万`;
        return `¥${Math.round(cny).toLocaleString()}`;
      }
      
      if (currency === 'KRW') {
        const krw = priceYen / jpyPerKrw;
        if (type === 'rent') {
          if (krw >= 1000000) return `₩${(krw / 1000000).toFixed(1)}M${rentSuffix}`;
          if (krw >= 1000) return `₩${(krw / 1000).toFixed(0)}k${rentSuffix}`;
          return `₩${Math.round(krw).toLocaleString()}${rentSuffix}`;
        }
        if (krw >= 100_000_000) return `₩${(krw / 100000000).toFixed(1)}억`;
        if (krw >= 1000000) return `₩${(krw / 1000000).toFixed(1)}M`;
        if (krw >= 1000) return `₩${(krw / 1000).toFixed(0)}k`;
        return `₩${Math.round(krw).toLocaleString()}`;
      }
      
      if (currency === 'AUD') {
        const aud = priceYen / jpyPerAud;
        if (type === 'rent') {
          if (aud >= 1000) return `A$${(aud / 1000).toFixed(1)}k${rentSuffix}`;
          return `A$${Math.round(aud).toLocaleString()}${rentSuffix}`;
        }
        if (aud >= 1_000_000) return `A$${(aud / 1_000_000).toFixed(2)}M`;
        if (aud >= 1000) return `A$${(aud / 1000).toFixed(1)}k`;
        return `A$${Math.round(aud).toLocaleString()}`;
      }
      
      if (currency === 'CAD') {
        const cad = priceYen / jpyPerCad;
        if (type === 'rent') {
          if (cad >= 1000) return `C$${(cad / 1000).toFixed(1)}k${rentSuffix}`;
          return `C$${Math.round(cad).toLocaleString()}${rentSuffix}`;
        }
        if (cad >= 1_000_000) return `C$${(cad / 1_000_000).toFixed(2)}M`;
        if (cad >= 1000) return `C$${(cad / 1000).toFixed(1)}k`;
        return `C$${Math.round(cad).toLocaleString()}`;
      }
      
      return `¥${priceYen.toLocaleString()}`;
    },
    [currency, jpyPerUsd, jpyPerCny, jpyPerKrw, jpyPerAud, jpyPerCad, rentSuffix, useWan]
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      jpyPerUsd,
      jpyPerCny,
      jpyPerKrw,
      jpyPerAud,
      jpyPerCad,
      rateDate,
      loading,
      error,
      formatPrice,
    }),
    [currency, jpyPerUsd, jpyPerCny, jpyPerKrw, jpyPerAud, jpyPerCad, rateDate, loading, error, formatPrice]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
