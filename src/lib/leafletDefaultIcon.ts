/**
 * Leaflet のデフォルトマーカーを same-origin で表示するためのアイコン設定。
 * CDN を使わないため、Tracking Prevention にブロックされない。
 */
import L from 'leaflet';

// シンプルなピン形 SVG（data URI）。外部リクエストなし。
const PIN_SVG =
  'data:image/svg+xml;base64,' +
  btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
  <path fill="#2A2A2A" stroke="#fff" stroke-width="1.5" d="M12.5 0C5.6 0 0 5.6 0 12.5 0 22 12.5 41 12.5 41S25 22 25 12.5C25 5.6 19.4 0 12.5 0z"/>
  <circle fill="#fff" cx="12.5" cy="12.5" r="5.5"/>
</svg>`
  );

const SHADOW_SVG =
  'data:image/svg+xml;base64,' +
  btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 41 41" width="41" height="41">
  <ellipse fill="rgba(0,0,0,0.2)" cx="20" cy="38" rx="14" ry="3"/>
</svg>`
  );

export function fixLeafletDefaultIcon(): void {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: PIN_SVG,
    iconRetinaUrl: PIN_SVG,
    shadowUrl: SHADOW_SVG,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
    shadowAnchor: [12, 41],
  });
}
