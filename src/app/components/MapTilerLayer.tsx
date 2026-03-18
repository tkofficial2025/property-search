import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Layer } from 'leaflet';

interface MapTilerLayerProps {
  apiKey: string;
  language: string;
}

/**
 * MapTiler のラスタタイルを Leaflet の TileLayer で表示。
 * @maptiler/leaflet-maptilersdk は使わない（Windows + pnpm でシンボリックリンク誤動作を避ける）。
 */
export function MapTilerLayer({ apiKey, language }: MapTilerLayerProps) {
  const map = useMap();
  const layerRef = useRef<Layer | null>(null);

  useEffect(() => {
    const key = apiKey?.trim();
    if (!key || !map) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    // MapTiler ラスタタイル（SDK 不要）。language はタイルURLに含められるスタイルがあれば差し替え可能。
    const tileUrl = `https://api.maptiler.com/maps/streets/256/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}`;
    const layer = L.tileLayer(tileUrl, {
      minZoom: 1,
      attribution: '© <a href="https://www.maptiler.com/copyright/">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      crossOrigin: true,
    }).addTo(map);

    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, apiKey, language]);

  return null;
}
