import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { LocateFixed } from "lucide-react";
import type { Issue, Place } from "../lib/types";
import { UPVOTE_THRESHOLD, CATEGORY_LABELS } from "../lib/types";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";

const MALOPOLSKA_CENTER: [number, number] = [49.95, 20.0];

function heatColor(score: number): string {
  if (score >= 40) return "#e2402a";
  if (score >= UPVOTE_THRESHOLD) return "#f28db2";
  if (score >= 10) return "#f0b429";
  return "#2b4acb";
}

// Dom z konta: domek; bieżąca pozycja: pulsująca kropka.
const homeIcon = L.divIcon({
  className: "",
  html: `<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:#f0b429;border:2.5px solid #1f1b16;box-shadow:2px 2px 0 #1f1b16;font-size:15px">🏠</span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});
const hereIcon = L.divIcon({
  className: "",
  html: `<span style="position:relative;display:block;width:18px;height:18px"><span style="position:absolute;inset:-8px;border-radius:50%;background:rgba(43,74,203,.25)"></span><span style="position:absolute;inset:0;border-radius:50%;background:#2b4acb;border:3px solid #fff;box-shadow:0 0 0 2px #1f1b16"></span></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FitBounds({ issues }: { issues: Issue[] }) {
  const map = useMap();
  // Dopasowanie tylko przy zmianie zestawu zgłoszeń (np. filtr), nie przy każdym głosie.
  const key = issues.map((i) => i.id).join(",");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

function FlyTo({ place }: { place: Place | null }) {
  const map = useMap();
  useEffect(() => {
    if (place) map.flyTo([place.latitude, place.longitude], 13);
  }, [place, map]);
  return null;
}

type Props = {
  issues: Issue[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  heatMode?: boolean;
  /** miejsce zamieszkania z konta */
  home?: Place | null;
  /** bieżąca pozycja z przeglądarki */
  here?: Place | null;
  onLocate?: () => void;
  locating?: boolean;
  className?: string;
};

export function IssuesMap({
  issues,
  selectedId,
  onSelect,
  heatMode = false,
  home,
  here,
  onLocate,
  locating = false,
  className = "",
}: Props) {
  const center = useMemo<[number, number]>(
    () => (home ? [home.latitude, home.longitude] : MALOPOLSKA_CENTER),
    [home],
  );

  return (
    <div
      className={`relative h-full overflow-hidden ${className}`}
      role="region"
      aria-label="Mapa zgłoszeń Małopolski"
    >
      <MapContainer center={center} zoom={9} className="z-0 h-full min-h-[300px] w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds issues={issues} />
        <FlyTo place={here ?? null} />
        {home && (
          <Marker position={[home.latitude, home.longitude]} icon={homeIcon}>
            <Tooltip direction="top" offset={[0, -14]}>
              Twoja okolica: {home.name}
            </Tooltip>
          </Marker>
        )}
        {here && (
          <Marker position={[here.latitude, here.longitude]} icon={hereIcon} zIndexOffset={1000}>
            <Tooltip direction="top" offset={[0, -10]} permanent>
              Tu jesteś
            </Tooltip>
          </Marker>
        )}
        {issues.map((issue) => {
          const selected = issue.id === selectedId;
          const score = Math.max(0, issue.score);
          const radius = heatMode ? 8 + Math.min(score / 3, 28) : selected ? 14 : 9;
          return (
            <CircleMarker
              key={issue.id}
              center={[issue.latitude, issue.longitude]}
              radius={radius}
              pathOptions={{
                color: "#1f1b16",
                fillColor: heatColor(issue.score),
                fillOpacity: heatMode ? 0.35 + Math.min(score / 80, 0.45) : 0.8,
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
                    Wynik: <strong>{issue.score}</strong> (▲{issue.upvotes} ▼{issue.downvotes})
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
      {onLocate && (
        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          className="ink-btn absolute right-3 top-3 z-[500] inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1.5 text-[13px] font-bold disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4 text-[var(--riso-blue)]" aria-hidden />
          {locating ? "Szukam…" : "Pokaż mnie"}
        </button>
      )}
    </div>
  );
}
