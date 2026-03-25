import { useEffect, useState, useMemo, useRef } from 'react';
import { geocodeAddresses, type Coordinates } from '@/lib/geocoding';
import { useGoogleMapsScript } from '@/lib/useGoogleMapsScript';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { useCurrency } from '@/app/contexts/CurrencyContext';
import { type Property } from '@/lib/properties';

interface GooglePropertiesMapViewProps {
  properties: Property[];
  onPropertyClick?: (propertyId: number) => void;
  className?: string;
  height?: string;
  apiKey?: string;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function GooglePropertiesMapView({
  properties,
  className = '',
  height = '600px',
  apiKey,
}: GooglePropertiesMapViewProps) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const { loaded: scriptLoaded, error: scriptError } = useGoogleMapsScript(
    apiKey ?? import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    language
  );

  const [propertyCoordinates, setPropertyCoordinates] = useState<Map<number, Coordinates>>(new Map());
  const [loading, setLoading] = useState(true);
  const propertyIds = useMemo(() => properties.map((p) => p.id).sort().join(','), [properties]);

  useEffect(() => {
    let cancelled = false;
    if (properties.length === 0) {
      setPropertyCoordinates(new Map());
      setLoading(false);
      return;
    }
    setLoading(true);
    const addresses = properties.map((p) => p.address);
    geocodeAddresses(addresses).then((coordinates) => {
      if (cancelled) return;
      const coordMap = new Map<number, Coordinates>();
      properties.forEach((property, index) => {
        const coord = coordinates[index];
        if (coord) coordMap.set(property.id, coord);
      });
      setPropertyCoordinates(coordMap);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [properties.length, propertyIds]);

  useEffect(() => {
    if (!scriptLoaded || !window.google?.maps || !mapRef.current) return;

    const defaultCenter = { lat: 35.6762, lng: 139.6503 };
    const map = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    const bounds = new google.maps.LatLngBounds();
    const markers: google.maps.Marker[] = [];

    const coordsArray = Array.from(propertyCoordinates.entries());
    coordsArray.forEach(([id, coords]) => {
      const property = properties.find((p) => p.id === id);
      if (!property) return;

      const position = { lat: coords.lat, lng: coords.lng };
      bounds.extend(position);

      const priceText = formatPrice(property.price, 'buy');
      const url = `${window.location.origin}${window.location.pathname}?property=${property.id}&source=buy`;
      const content = `
        <div style="padding: 8px; min-width: 220px; max-width: 280px;">
          <p style="font-weight: 600; margin: 0 0 4px 0; line-height: 1.3;">${escapeHtml(property.title)}</p>
          <p style="font-size: 12px; color: #6b7280; margin: 0 0 6px 0;">${escapeHtml(property.address)}</p>
          <p style="font-size: 14px; font-weight: 600; color: #C1121F; margin: 0 0 8px 0;">${escapeHtml(priceText)}</p>
          <a href="${url}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #C1121F;">View details →</a>
        </div>
      `;

      const marker = new google.maps.Marker({
        position,
        map,
        title: property.title,
      });
      const infoWindow = new google.maps.InfoWindow({ content });
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
      markers.push(marker);
    });

    markersRef.current = markers;
    if (coordsArray.length > 0) {
      map.fitBounds(bounds);
      if (coordsArray.length === 1) map.setZoom(15);
    }

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [scriptLoaded, propertyCoordinates, properties, formatPrice]);

  const apiKeyResolved = apiKey ?? import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKeyResolved) {
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

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 ${className}`} style={{ height, position: 'relative', zIndex: 0 }}>
      {propertyCoordinates.size === 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm text-gray-600 font-medium">No properties to show on map</p>
        </div>
      )}
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
