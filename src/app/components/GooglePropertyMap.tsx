import { useEffect, useState, useRef } from 'react';
import { geocodeAddress, type Coordinates } from '@/lib/geocoding';
import { useGoogleMapsScript } from '@/lib/useGoogleMapsScript';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface GooglePropertyMapProps {
  address: string;
  title?: string;
  className?: string;
  height?: string;
  apiKey?: string;
}

export function GooglePropertyMap({
  address,
  title,
  className = '',
  height = '400px',
  apiKey,
}: GooglePropertyMapProps) {
  const { language } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const { loaded: scriptLoaded, error: scriptError } = useGoogleMapsScript(
    apiKey ?? import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    language
  );

  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  useEffect(() => {
    if (!address?.trim()) {
      setGeocodeError('No address');
      setLoading(false);
      return;
    }
    setLoading(true);
    setGeocodeError(null);
    geocodeAddress(address).then((coords) => {
      setCoordinates(coords ?? null);
      setGeocodeError(coords ? null : 'Could not get location');
      setLoading(false);
    });
  }, [address]);

  useEffect(() => {
    if (!scriptLoaded || !window.google?.maps || !mapRef.current || !coordinates) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: coordinates.lat, lng: coordinates.lng },
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    const marker = new google.maps.Marker({
      position: { lat: coordinates.lat, lng: coordinates.lng },
      map,
      title: title ?? undefined,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px; min-width: 180px;">
          <p style="font-weight: 600; margin: 0 0 4px 0;">${title ? escapeHtml(title) : 'Property'}</p>
          <p style="font-size: 12px; color: #6b7280; margin: 0;">${escapeHtml(address)}</p>
        </div>
      `,
    });
    marker.addListener('click', () => infoWindow.open(map, marker));

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapInstanceRef.current = null;
    };
  }, [scriptLoaded, coordinates, title, address]);

  if (!apiKey && !import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <p className="text-gray-500 text-sm">Set VITE_GOOGLE_MAPS_API_KEY to use Google Maps</p>
      </div>
    );
  }

  if (scriptError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <p className="text-gray-500 text-sm">Failed to load map</p>
      </div>
    );
  }

  if (loading || !scriptLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <p className="text-gray-500 text-sm">Loading map...</p>
      </div>
    );
  }

  if (geocodeError || !coordinates) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <p className="text-gray-500 text-sm">Could not show location</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`rounded-lg overflow-hidden border border-gray-200 ${className}`}
      style={{ height, width: '100%' }}
    />
  );
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
