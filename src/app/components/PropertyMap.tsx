import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { geocodeAddress, type Coordinates } from '@/lib/geocoding';
import { getTileLayerConfig, getMaptilerApiKey } from '@/lib/mapTiles';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { MapTilerLayer } from '@/app/components/MapTilerLayer';
import { fixLeafletDefaultIcon } from '@/lib/leafletDefaultIcon';

fixLeafletDefaultIcon();

interface PropertyMapProps {
  address: string;
  title?: string;
  className?: string;
  height?: string;
}

/**
 * 地図の中心を更新するコンポーネント
 */
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [map, center]);
  return null;
}

export function PropertyMap({ address, title, className = '', height = '400px' }: PropertyMapProps) {
  const { t, language } = useLanguage();
  const tileConfig = getTileLayerConfig(language);
  const maptilerApiKey = getMaptilerApiKey();
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCoordinates() {
      if (!address) {
        setError('no_address');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      const coords = await geocodeAddress(address);
      
      if (coords) {
        setCoordinates(coords);
      } else {
        setError('geocode_error');
      }
      
      setLoading(false);
    }

    loadCoordinates();
  }, [address]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <p className="text-gray-500">{t('map.loading')}</p>
      </div>
    );
  }

  if (error || !coordinates) {
    const message = error === 'no_address' ? t('map.no_address') : error === 'geocode_error' ? t('map.geocode_error') : t('map.cannot_display');
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <p className="text-gray-500">{message}</p>
      </div>
    );
  }

  const center: [number, number] = [coordinates.lat, coordinates.lng];

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {maptilerApiKey ? (
          <MapTilerLayer apiKey={maptilerApiKey} language={language} />
        ) : (
          <TileLayer attribution={tileConfig.attribution} url={tileConfig.url} />
        )}
        <MapCenterUpdater center={center} />
        <Marker position={center}>
          <Popup>
            <div>
              <p className="font-semibold">{title || t('map.property_location')}</p>
              <p className="text-sm text-gray-600">{address}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
