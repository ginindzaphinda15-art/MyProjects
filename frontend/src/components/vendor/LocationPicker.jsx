import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { markerIcon, DEFAULT_CENTER } from '../../utils/leafletIcons';

function ClickToSetMarker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Click-to-pin location picker for a vendor's business profile. Also offers
 * a "use my current location" shortcut via the browser's geolocation API.
 * Props: latitude, longitude (numbers or null), onChange(lat, lng)
 */
export default function LocationPicker({ latitude, longitude, onChange }) {
  const [locating, setLocating] = useState(false);
  const hasPin = latitude != null && longitude != null;
  const center = hasPin ? [latitude, longitude] : DEFAULT_CENTER;

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs text-ink/60">Business location (tap the map to place a pin)</label>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="text-xs text-brand-blue underline"
        >
          {locating ? 'Locating…' : 'Use my current location'}
        </button>
      </div>
      <div className="h-56 w-full rounded-sm overflow-hidden border border-ink/20">
        <MapContainer center={center} zoom={hasPin ? 14 : 8} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToSetMarker onPick={onChange} />
          {hasPin && <Marker position={[latitude, longitude]} icon={markerIcon} />}
        </MapContainer>
      </div>
      {hasPin ? (
        <p className="text-xs text-ink/40 mt-1">
          Pinned at {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
        </p>
      ) : (
        <p className="text-xs text-ink/40 mt-1">No location set yet — customers won't see a map on your profile.</p>
      )}
    </div>
  );
}
