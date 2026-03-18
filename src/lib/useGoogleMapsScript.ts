import { useEffect, useState } from 'react';

const SCRIPT_ID = 'google-maps-api-script';
type Language = 'en' | 'zh';

declare global {
  interface Window {
    __googleMapsCallback?: () => void;
    __googleMapsLanguage?: Language;
  }
}

/**
 * Loads Google Maps JavaScript API with the given language.
 * When language changes, removes the old script and loads with the new language.
 */
export function useGoogleMapsScript(apiKey: string | undefined, language: Language) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!apiKey || apiKey.trim() === '') {
      setLoaded(false);
      setError(new Error('Google Maps API key is not set'));
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      const currentLang = window.__googleMapsLanguage;
      if (currentLang === language && window.google?.maps) {
        setLoaded(true);
        setError(null);
        return;
      }
      existing.remove();
      delete window.google;
      delete window.__googleMapsLanguage;
    }

    setLoaded(false);
    setError(null);

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    window.__googleMapsLanguage = language;
    window.__googleMapsCallback = () => {
      setLoaded(true);
      setError(null);
      delete window.__googleMapsCallback;
    };
    script.onerror = () => {
      setError(new Error('Failed to load Google Maps'));
      delete window.__googleMapsCallback;
    };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=${language}&callback=__googleMapsCallback`;

    document.head.appendChild(script);

    return () => {
      script.onerror = null;
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [apiKey, language]);

  return { loaded: loaded && !!window.google?.maps, error };
}
