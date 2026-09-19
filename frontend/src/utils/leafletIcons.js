import L from 'leaflet';

// Leaflet's default marker icon resolves image paths in a way that breaks
// under most bundlers (including CRA's webpack setup) unless you jump through
// hoops. Pointing it at the same marker images via a CDN sidesteps that
// entirely — no local asset wrangling required.
export const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Rough center of Eswatini (Mbabane) — used as the default map center when a
// vendor hasn't set a location yet.
export const DEFAULT_CENTER = [-26.3054, 31.1367];
