import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { markerIcon } from '../../utils/leafletIcons';

/**
 * Shows where a vendor is located, so a customer can see it while booking.
 * Props: latitude, longitude, businessName
 */
export default function VendorLocationMap({ latitude, longitude, businessName }) {
  if (latitude == null || longitude == null) return null;

  const position = [latitude, longitude];

  return (
    <div className="bg-white border border-ink/10 rounded-sm overflow-hidden mb-6">
      <div className="h-48 w-full">
        <MapContainer center={position} zoom={15} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={markerIcon}>
            <Popup>{businessName}</Popup>
          </Marker>
        </MapContainer>
      </div>
      <a
        href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`}
        target="_blank"
        rel="noreferrer"
        className="block text-center text-xs text-brand-blue py-2 border-t border-ink/10 hover:underline"
      >
        Open in maps for directions
      </a>
    </div>
  );
}
