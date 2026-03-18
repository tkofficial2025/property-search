/* Minimal types for Google Maps JavaScript API (loaded via script tag) */
declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: HTMLElement, opts?: object);
      fitBounds(bounds: LatLngBounds): void;
      setZoom(z: number): void;
    }
    class LatLngBounds {
      constructor();
      extend(point: { lat: number; lng: number }): void;
    }
    class Marker {
      constructor(opts?: { position?: { lat: number; lng: number }; map?: Map; title?: string });
      setMap(map: Map | null): void;
      addListener(eventName: string, handler: () => void): void;
    }
    class InfoWindow {
      constructor(opts?: { content?: string });
      open(map: Map, anchor?: Marker): void;
    }
  }
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

export {};
