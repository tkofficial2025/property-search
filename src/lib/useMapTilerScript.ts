import { useEffect, useState } from 'react';
import L from 'leaflet';

const MAPTILER_SDK_CSS = 'https://cdn.maptiler.com/maptiler-sdk-js/v3.9.0/maptiler-sdk.css';
const MAPTILER_SDK_JS = 'https://cdn.maptiler.com/maptiler-sdk-js/v3.9.0/maptiler-sdk.umd.min.js';
const LEAFLET_MAPTILER_JS = 'https://cdn.maptiler.com/leaflet-maptilersdk/v4.1.1/leaflet-maptilersdk.js';

declare global {
  interface Window {
    L?: typeof L & { maptiler?: { maptilerLayer: (opts: { apiKey: string; language?: string }) => { addTo: (map: unknown) => unknown } } };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function loadStylesheet(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load ${href}`));
    document.head.appendChild(link);
  });
}

/**
 * Load MapTiler SDK + Leaflet plugin from CDN when apiKey is set.
 * Returns { ready: true } when L.maptiler.maptilerLayer is available.
 */
export function useMapTilerScript(apiKey: string | undefined): { ready: boolean } {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      setReady(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        if (!(window as unknown as { L?: unknown }).L) {
          (window as unknown as { L: typeof L }).L = L;
        }
        await loadStylesheet(MAPTILER_SDK_CSS);
        if (cancelled) return;
        await loadScript(MAPTILER_SDK_JS);
        if (cancelled) return;
        await loadScript(LEAFLET_MAPTILER_JS);
        if (cancelled) return;
        if (typeof window.L !== 'undefined' && (window.L as unknown as { maptiler?: unknown }).maptiler) {
          setReady(true);
        } else {
          setReady(false);
        }
      } catch {
        setReady(false);
      }
    })();

    return () => {
      cancelled = true;
      setReady(false);
    };
  }, [apiKey]);

  return { ready };
}
