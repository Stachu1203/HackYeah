"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pin = L.divIcon({
  className: "",
  html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:#007aff;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

type Props = {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
  className?: string;
};

export function LocationPickerMap({ lat, lng, onPick, className = "" }: Props) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[var(--line)] ${className}`}
      role="application"
      aria-label="Wybierz lokalizację na mapie — kliknij punkt"
    >
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        className="h-44 w-full z-0"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={pin} />
        <ClickHandler onPick={onPick} />
        <Recenter lat={lat} lng={lng} />
      </MapContainer>
    </div>
  );
}
