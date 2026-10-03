import { useState } from "react";
import { Crosshair } from "lucide-react";
import { currentPosition } from "../lib/geo";
import type { Place } from "../lib/types";
import { LocationPickerMap } from "./LocationPickerMap";

/** Najczęstsze miejscowości — jedno kliknięcie zamiast szukania na mapie. */
const TOWNS: Place[] = [
  { name: "Kraków", latitude: 50.0614, longitude: 19.9366 },
  { name: "Tarnów", latitude: 50.0121, longitude: 20.9858 },
  { name: "Nowy Sącz", latitude: 49.6219, longitude: 20.6972 },
  { name: "Oświęcim", latitude: 50.0344, longitude: 19.2098 },
  { name: "Wieliczka", latitude: 49.987, longitude: 20.0647 },
  { name: "Skawina", latitude: 49.9753, longitude: 19.8274 },
  { name: "Zakopane", latitude: 49.2992, longitude: 19.9496 },
  { name: "Wadowice", latitude: 49.8833, longitude: 19.4925 },
];

type Props = {
  value: Place | null;
  onChange: (place: Place | null) => void;
  /** pokaż przycisk „Bez lokalizacji” */
  allowClear?: boolean;
};

export function PlacePicker({ value, onChange, allowClear = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  async function useMine() {
    setBusy(true);
    setError(null);
    try {
      const place = await currentPosition();
      onChange({ ...place, name: value?.name && value.name !== "Moja lokalizacja" ? value.name : "Moja okolica" });
      setShowMap(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać lokalizacji");
    } finally {
      setBusy(false);
    }
  }

  const chip = (active: boolean) =>
    `rounded-full border-2 px-2.5 py-1 text-[13px] font-bold transition ${
      active
        ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]"
        : "border-[var(--ink)] bg-[var(--surface)] hover:bg-[var(--wash)]"
    }`;

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {TOWNS.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => onChange(t)}
            aria-pressed={value?.name === t.name}
            className={chip(value?.name === t.name)}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => void useMine()}
          disabled={busy}
          className="ink-btn inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1 text-[13px] font-bold text-[var(--accent)] disabled:opacity-50"
        >
          <Crosshair className="h-3.5 w-3.5" aria-hidden />
          {busy ? "Szukam…" : "Użyj mojej lokalizacji"}
        </button>
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className="rounded-full px-2 py-1 text-[13px] font-bold underline decoration-2 underline-offset-4"
        >
          {showMap ? "Ukryj mapę" : "Wybierz na mapie"}
        </button>
        {allowClear && value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full px-2 py-1 text-[13px] font-semibold text-[var(--muted)] underline underline-offset-4"
          >
            Bez lokalizacji
          </button>
        )}
      </div>
      {value && (
        <label className="block text-[12px] font-extrabold uppercase tracking-[0.14em]">
          Nazwa okolicy
          <input
            value={value.name}
            maxLength={120}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            className="mt-1.5 w-full rounded-xl border-2 border-[var(--ink)] bg-[var(--surface)] px-3.5 py-2.5 text-[16px] font-normal normal-case tracking-normal outline-none transition focus:shadow-[3px_3px_0_var(--riso-blue)]"
          />
        </label>
      )}
      {showMap && (
        <LocationPickerMap
          lat={value?.latitude ?? 50.0614}
          lng={value?.longitude ?? 19.9366}
          onPick={(latitude, longitude) =>
            onChange({ name: value?.name || "Moja okolica", latitude, longitude })
          }
        />
      )}
      {error && (
        <p role="alert" className="text-[13px] font-semibold text-[var(--riso-red)]">
          {error}
        </p>
      )}
    </div>
  );
}
