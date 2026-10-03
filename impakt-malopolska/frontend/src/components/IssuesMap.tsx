import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import type { Issue } from "../lib/types";
import { UPVOTE_THRESHOLD, CATEGORY_LABELS } from "../lib/types";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";

const MALOPOLSKA_CENTER: [number, number] = [49.95, 20.0];

function heatColor(upvotes: number): string {
  if (upvotes >= 40) return "#e2402a";
  if (upvotes >= UPVOTE_THRESHOLD) return "#f28db2";
  if (upvotes >= 10) return "#f0b429";
  return "#2b4acb";
}

function FitBounds({ issues }: { issues: Issue[] }) {
  const map = useMap();
  useEffect(() => {
    if (issues.length === 0) return;
    const lats = issues.map((i) => i.latitude);
    const lngs = issues.map((i) => i.longitude);
    map.fitBounds(
      [
        [Math.min(...lats) - 0.05, Math.min(...lngs) - 0.05],
        [Math.max(...lats) + 0.05, Math.max(...lngs) + 0.05],
      ],
      { padding: [40, 40] },
    );
  }, [issues, map]);
  return null;
}

type Props = {
  issues: Issue[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  heatMode?: boolean;
  className?: string;
};

export function IssuesMap({
  issues,
  selectedId,
  onSelect,
  heatMode = false,
  className = "",
}: Props) {
  return (
    <div
      className={`relative h-full overflow-hidden ${className}`}
      role="region"
      aria-label="Mapa zgłoszeń Małopolski"
    >
      <MapContainer
        center={MALOPOLSKA_CENTER}
        zoom={9}
        className="h-full w-full min-h-[320px] z-0"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds issues={issues} />
        {issues.map((issue) => {
          const selected = issue.id === selectedId;
          const radius = heatMode
            ? 8 + Math.min(issue.upvotes / 3, 28)
            : selected
              ? 14
              : 9;
          return (
            <CircleMarker
              key={issue.id}
              center={[issue.latitude, issue.longitude]}
              radius={radius}
              pathOptions={{
                color: "#1f1b16",
                fillColor: heatColor(issue.upvotes),
                fillOpacity: heatMode
                  ? 0.35 + Math.min(issue.upvotes / 80, 0.45)
                  : 0.8,
                weight: selected ? 3.5 : 2,
              }}
              eventHandlers={{
                click: () => onSelect?.(issue.id),
              }}
            >
              <Popup>
                <div className="min-w-[180px] space-y-1 text-sm">
                  <p className="font-display text-[15px] font-bold italic">{issue.title}</p>
                  <p className="text-xs text-neutral-600">
                    {issue.locationName} · {CATEGORY_LABELS[issue.category]}
                  </p>
                  <p className="text-xs">
                    Poparcie: <strong>{issue.upvotes}</strong>
                  </p>
                  <Link
                    to={`/zgloszenie/${issue.id}`}
                    className="inline-block text-xs font-bold text-[#2b4acb] underline"
                  >
                    Otwórz →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
