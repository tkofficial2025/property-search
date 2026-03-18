import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Supercluster from 'supercluster';
import { geocodeAddresses, type Coordinates } from '@/lib/geocoding';
import { type Property } from '@/lib/properties';
import type { PropertyTranslationResult } from '@/lib/translate-property';
import { useCurrency } from '@/app/contexts/CurrencyContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { getStationDisplay, type Language } from '@/lib/stationNames';
import { getTileLayerConfig, getMaptilerApiKey } from '@/lib/mapTiles';
import { MapTilerLayer } from '@/app/components/MapTilerLayer';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { StationLineLogo } from '@/app/components/StationLineLogo';
import { fixLeafletDefaultIcon } from '@/lib/leafletDefaultIcon';

fixLeafletDefaultIcon();

interface PropertiesMapViewProps {
  properties: Property[];
  onPropertyClick?: (propertyId: number) => void;
  className?: string;
  height?: string;
  translationMap?: Map<number, PropertyTranslationResult>;
}

/**
 * 地図の表示範囲を自動調整するコンポーネント
 * bounds に NaN が含まれる場合は fitBounds を呼ばない（Invalid LatLng エラー防止）
 */
function MapBoundsUpdater({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const valid =
      Number.isFinite(sw.lat) && Number.isFinite(sw.lng) &&
      Number.isFinite(ne.lat) && Number.isFinite(ne.lng);
    if (!valid) return;
    try {
      map.fitBounds(bounds);
    } catch {
      // Invalid LatLng (NaN) など Leaflet 内部で発生する例外を握りつぶし、クラッシュを防ぐ
    }
  }, [map, bounds]);
  return null;
}

/**
 * ズームレベルに応じてクラスターを更新するコンポーネント
 */
function ClusterUpdater({ 
  cluster, 
  onPropertyClick,
  language,
  translationMap,
}: { 
  cluster: Supercluster; 
  onPropertyClick?: (propertyId: number) => void;
  language: Language;
  translationMap?: Map<number, PropertyTranslationResult>;
}) {
  const map = useMap();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const [clusters, setClusters] = useState<any[]>([]);

  useEffect(() => {
    const updateClusters = () => {
      const bounds = map.getBounds();
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];
      const zoom = Math.floor(map.getZoom());
      const newClusters = cluster.getClusters(bbox, zoom);
      setClusters(newClusters);
    };

    updateClusters();
    map.on('moveend', updateClusters);
    map.on('zoomend', updateClusters);

    return () => {
      map.off('moveend', updateClusters);
      map.off('zoomend', updateClusters);
    };
  }, [map, cluster]);

  return (
    <>
      {clusters.map((point) => {
        const [lng, lat] = point.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = point.properties;

        if (isCluster) {
          // クラスターアイコン（テーマ色に統一）
          const themeColor = '#C1121F';
          const clusterIcon = L.divIcon({
            className: 'cluster-marker',
            html: `
              <div style="
                background-color: ${themeColor};
                color: white;
                width: ${pointCount < 10 ? '36px' : pointCount < 100 ? '42px' : '48px'};
                height: ${pointCount < 10 ? '36px' : pointCount < 100 ? '42px' : '48px'};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: ${pointCount < 10 ? '14px' : pointCount < 100 ? '16px' : '18px'};
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                border: 3px solid white;
                cursor: pointer;
              ">
                ${pointCount}
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          });

          return (
            <Marker
              key={`cluster-${point.id}`}
              position={[lat, lng]}
              icon={clusterIcon}
              eventHandlers={{
                click: () => {
                  const expansionZoom = Math.min(
                    cluster.getClusterExpansionZoom(point.id as number),
                    18
                  );
                  map.setView([lat, lng], expansionZoom, {
                    animate: true,
                  });
                },
              }}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">{t('map.cluster_count').replace('{n}', String(pointCount))}</p>
                  <p className="text-xs text-gray-500">{t('map.click_to_zoom')}</p>
                </div>
              </Popup>
            </Marker>
          );
        } else {
          // 個別の物件マーカー
          const property = point.properties.property as Property;
          const displayTitle = language === 'zh' && translationMap?.get(property.id)?.title_zh
            ? translationMap.get(property.id)!.title_zh
            : property.title;
          const displayAddress = language === 'zh' && translationMap?.get(property.id)?.address_zh
            ? translationMap.get(property.id)!.address_zh
            : property.address;
          const priceText = formatPrice(property.price, property.type === 'rent' ? 'rent' : 'buy');
          // テーマ色に統一
          const themeColor = '#C1121F';

          const customIcon = L.divIcon({
            className: 'custom-price-marker',
            html: `
              <div style="
                background-color: ${themeColor};
                color: white;
                padding: 8px 14px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                white-space: nowrap;
                box-shadow: 0 3px 8px rgba(0,0,0,0.4);
                border: 3px solid white;
                cursor: pointer;
                line-height: 1.3;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                min-width: fit-content;
                display: inline-block;
              ">
                ${priceText}
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -10],
          });

          // ホバー用のTooltip（HTML文字列）
          const imageHtml = property.image 
            ? `<img src="${property.image}" alt="${displayTitle}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; flex-shrink: 0;" onerror="this.style.display='none';" />`
            : '';
          const tooltipHtml = `
            <div style="min-width: 280px; max-width: 400px; padding: 10px; box-sizing: border-box; word-wrap: break-word; overflow-wrap: break-word;">
              <div style="display: flex; gap: 12px; align-items: flex-start;">
                ${imageHtml ? `<div style="flex-shrink: 0;">${imageHtml}</div>` : ''}
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; line-height: 1.4; word-wrap: break-word;">
                    ${displayTitle}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; line-height: 1.4; word-wrap: break-word;">
                    ${displayAddress}
                  </div>
                  <div style="font-size: 14px; font-weight: 600; color: #C1121F; margin-bottom: 4px;">
                    ${priceText}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; line-height: 1.4; word-wrap: break-word;">
                    ${property.beds} bed • ${property.size} m²${property.station ? ` • ${getStationDisplay(property.station, language)}` : ''}
                  </div>
                </div>
              </div>
            </div>
          `;

          return (
            <Marker
              key={`property-${property.id}`}
              position={[lat, lng]}
              icon={customIcon}
              eventHandlers={{
                click: () => {
                  // モバイルではクリックで即遷移せず Popup で詳細表示。PCでは従来どおり新しいタブで開く
                  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                  if (isMobile) return; // Popup が開くだけにする
                  const url = `${window.location.origin}${window.location.pathname}?property=${property.id}&source=${property.type === 'rent' ? 'rent' : 'buy'}`;
                  window.open(url, '_blank');
                },
              }}
            >
              <Tooltip permanent={false} direction="top" offset={[0, -10]}>
                <div dangerouslySetInnerHTML={{ __html: tooltipHtml }} />
              </Tooltip>
              <Popup>
                <div className="min-w-[250px] max-w-[300px]">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{displayTitle}</h3>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-1">{displayAddress}</p>
                  <p className="text-sm font-semibold text-[#C1121F] mb-2">
                    {priceText}
                  </p>
                  <div className="flex gap-2 text-xs text-gray-500 mb-2">
                    <span>{property.beds} {t('map.bed')}</span>
                    <span>•</span>
                    <span>{property.size} m²</span>
                    {property.station && (
                      <>
                        <span>•</span>
                        <span>{getStationDisplay(property.station, language)}</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (onPropertyClick) {
                        onPropertyClick(property.id);
                      } else {
                        const url = `${window.location.origin}${window.location.pathname}?property=${property.id}&source=${property.type === 'rent' ? 'rent' : 'buy'}`;
                        window.open(url, '_blank');
                      }
                    }}
                    className="w-full px-3 py-1.5 bg-[#C1121F] text-white text-xs font-medium rounded hover:bg-[#A00F1A] transition-colors"
                  >
                    {t('map.view_details')}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        }
      })}
    </>
  );
}

export function PropertiesMapView({ 
  properties, 
  onPropertyClick, 
  className = '', 
  height = '600px',
  translationMap,
}: PropertiesMapViewProps) {
  const { formatPrice } = useCurrency();
  const { t, language } = useLanguage();
  const tileConfig = getTileLayerConfig(language);
  const maptilerApiKey = getMaptilerApiKey();
  const [propertyCoordinates, setPropertyCoordinates] = useState<Map<number, Coordinates>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // propertiesのID配列をメモ化（依存配列の最適化）
  const propertyIds = useMemo(() => properties.map(p => p.id).sort().join(','), [properties]);

  useEffect(() => {
    let cancelled = false;

    async function loadCoordinates() {
      if (properties.length === 0) {
        if (!cancelled) {
          setPropertyCoordinates(new Map());
          setLoading(false);
          setError(null);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError(null);
      }

      const coordMap = new Map<number, Coordinates>();

      // 1. DB に保存済みの latitude/longitude がある物件はそのまま使用（ジオコーディング不要）
      const withStoredCoords: { property: Property; index: number }[] = [];
      const needGeocode: { property: Property; index: number }[] = [];
      properties.forEach((property, index) => {
        const lat = property.latitude;
        const lng = property.longitude;
        if (
          lat != null &&
          lng != null &&
          Number.isFinite(lat) &&
          Number.isFinite(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
        ) {
          coordMap.set(property.id, { lat, lng });
          withStoredCoords.push({ property, index });
        } else {
          needGeocode.push({ property, index });
        }
      });

      // 2. 座標がない物件だけジオコーディング（件数が少ないときのみ軽量）
      if (needGeocode.length > 0) {
        const addresses = needGeocode.map(({ property }) => property.address);
        const coordinates = await geocodeAddresses(addresses);
        if (cancelled) return;
        needGeocode.forEach(({ property }, i) => {
          const coord = coordinates[i];
          if (coord) coordMap.set(property.id, coord);
        });
      }

      if (!cancelled) {
        setPropertyCoordinates(coordMap);
        setLoading(false);
      }
    }

    loadCoordinates();

    return () => {
      cancelled = true;
    };
  }, [properties.length, propertyIds]);

  // Superclusterの初期化
  const cluster = useMemo(() => {
    if (propertyCoordinates.size === 0) return null;

    const points = properties
      .map((property) => {
        const coords = propertyCoordinates.get(property.id);
        if (!coords) return null;
        return {
          type: 'Feature' as const,
          properties: {
            cluster: false,
            property,
            propertyId: property.id,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [coords.lng, coords.lat],
          },
        };
      })
      .filter((point): point is NonNullable<typeof point> => point !== null);

    const clusterInstance = new Supercluster({
      radius: 60, // クラスター化する半径（ピクセル）
      maxZoom: 15, // このズームレベル以上ではクラスター化しない
      minZoom: 0,
      minPoints: 2, // 2つ以上のポイントでクラスター化
    });

    clusterInstance.load(points);
    return clusterInstance;
  }, [properties, propertyCoordinates]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <p className="text-gray-500">地図を読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  // すべての座標から境界を計算（NaN を除外して Invalid LatLng を防ぐ）
  const coordsArray = Array.from(propertyCoordinates.values()).filter(
    (c: Coordinates) => Number.isFinite(c.lat) && Number.isFinite(c.lng)
  );
  const bounds = coordsArray.length > 0
    ? L.latLngBounds(coordsArray.map((c: Coordinates) => [c.lat, c.lng] as [number, number]))
    : null;

  // デフォルトの中心（東京）
  const defaultCenter: [number, number] = [35.6762, 139.6503];

  return (
    <>
      <style>{`
        .custom-price-marker {
          background: transparent !important;
          border: none !important;
        }
        .custom-price-marker > div {
          transition: transform 0.2s, box-shadow 0.2s;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        .custom-price-marker:hover > div {
          transform: scale(1.05);
          box-shadow: 0 5px 12px rgba(0,0,0,0.5);
          z-index: 1000;
        }
        .cluster-marker {
          background: transparent !important;
          border: none !important;
        }
        .cluster-marker > div {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .cluster-marker:hover > div {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        /* Leaflet地図のz-indexを制御 */
        .leaflet-container {
          z-index: 0 !important;
        }
        .leaflet-top,
        .leaflet-bottom {
          z-index: 1 !important;
        }
        .leaflet-pane {
          z-index: 0 !important;
        }
        .leaflet-control {
          z-index: 1 !important;
        }
      `}</style>
      <div className={`rounded-lg overflow-hidden border border-gray-200 ${className}`} style={{ height, position: 'relative', zIndex: 0 }}>
        {propertyCoordinates.size === 0 && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200">
            <p className="text-sm text-gray-600 font-medium">{t('map.no_properties')}</p>
          </div>
        )}
        <MapContainer
          center={defaultCenter}
          zoom={12}
          style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}
          scrollWheelZoom={true}
        >
          {maptilerApiKey ? (
            <MapTilerLayer apiKey={maptilerApiKey} language={language} />
          ) : (
            <TileLayer attribution={tileConfig.attribution} url={tileConfig.url} />
          )}
          {bounds && <MapBoundsUpdater bounds={bounds} />}
          {cluster && <ClusterUpdater cluster={cluster} onPropertyClick={onPropertyClick} language={language} />}
        </MapContainer>
      </div>
    </>
  );
}
